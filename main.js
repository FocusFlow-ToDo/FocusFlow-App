const { app, BrowserWindow, Menu, ipcMain, shell, protocol, net, Tray, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const url = require('url');
const fs = require('fs');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged;

// Set AppUserModelId so Windows toast notifications route back to this process correctly
app.setAppUserModelId(isDev ? process.execPath : "com.focusflow.app");

// =============================================
// ★ Single Instance Lock (2 kere açma koruması)
// =============================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Odaklanmış pencereyi geri getir
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow;
let tray;
let authServer;
let authTimeout;
let isQuitting = false; // ★ Tray menüsünden çıkış yapıldığını anlamak için
let currentSettings = null; // ★ Ayarları sakla

// =============================================
// ★ Custom Protocol (Production için)
// app:// protokolü ile static dosyaları servis et
// =============================================
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}

// =============================================
// ★ Firebase Config
// =============================================
let firebaseConfig = null;
try {
  const possiblePaths = isDev
    ? [
        path.join(__dirname, 'firebase-applet-config.json'),
        path.join(__dirname, 'src', 'firebase-applet-config.json'),
      ]
    : [path.join(process.resourcesPath, 'firebase-applet-config.json')];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      firebaseConfig = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log('Firebase config loaded from:', p);
      break;
    }
  }

  if (!firebaseConfig) console.error('Firebase config not found');
} catch (err) {
  console.error('Failed to load firebase config:', err);
}

// =============================================
// ★ Pencere Oluştur
// =============================================
function createWindow() {
  const userDataPath = app.getPath('userData');
  const windowStateFile = path.join(userDataPath, 'window-state.json');
  let windowState = {};
  try {
    if (fs.existsSync(windowStateFile)) {
      windowState = JSON.parse(fs.readFileSync(windowStateFile, 'utf8'));
    }
  } catch (err) {
    console.error('Could not read window state', err);
  }

  const { x, y, width, height, isMaximized } = windowState;

  mainWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width || 1280,
    height: height || 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // ★ İkon - resources klasöründen al
    icon: path.join(__dirname, 'resources', 'logo.png'),
  });

  const saveWindowState = () => {
    if (!mainWindow) return;
    try {
      const bounds = mainWindow.getBounds();
      const maximized = mainWindow.isMaximized();
      fs.writeFileSync(windowStateFile, JSON.stringify({
        ...bounds,
        isMaximized: maximized
      }));
    } catch (err) {
      console.error('Could not save window state', err);
    }
  };

  let resizeTimer;
  mainWindow.on('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(saveWindowState, 500);
  });
  
  let moveTimer;
  mainWindow.on('move', () => {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(saveWindowState, 500);
  });

  // ★ Production'da menü barını kaldır
  if (isDev) {
    mainWindow.setMenuBarVisibility(true);
  } else {
    Menu.setApplicationMenu(null);
  }

  // ★ URL yükleme
  if (isDev) {
    mainWindow.loadURL('http://localhost:3456');
  } else {
    mainWindow.loadURL('app://-/');
  }

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (isMaximized) mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();

      // ★ Uygulama açılışından 5 saniye sonra arka planda güncelleme kontrolü
      setTimeout(() => {
        if (!isDev && autoUpdater) {
          autoUpdater.checkForUpdates().catch(err => {
            console.log('[Updater] Background check error:', err.message);
          });
        }
      }, 5000);
    }, 2000);
  });

  // ★ Kapatma butonuna basıldığında ayara göre davran
  mainWindow.on('close', (event) => {
    if (isQuitting) return;

    event.preventDefault();

    if (currentSettings?.closeAction === 'exit') {
      isQuitting = true;
      app.quit();
    } else if (currentSettings?.closeAction === 'tray') {
      mainWindow.hide();
    } else {
      // 'ask' veya ayar yoksa -> Renderer'a sor
      mainWindow.webContents.send('attempt-close');
    }
  });
}

// =============================================
// 🚀 GOOGLE OAUTH
// =============================================
const getAuthHtml = (apiKey, authDomain) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FocusFlow Giriş</title>
    <style>
        body { background: #0a0a0f; color: white; font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.03); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.08); padding: 48px; border-radius: 32px; text-align: center; max-width: 420px; width: 90%; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        .logo { width: 64px; height: 64px; background: linear-gradient(135deg, #3B82F6, #6366F1); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-weight: 800; font-size: 32px; box-shadow: 0 10px 30px rgba(59,130,246,0.3); }
        .btn { background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; border: none; padding: 16px 32px; border-radius: 16px; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.3s ease; width: 100%; margin-top: 10px; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(59,130,246,0.3); }
        h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
        p { color: #71717A; margin-bottom: 32px; line-height: 1.5; font-size: 15px; }
        .loader { display: none; margin: 20px auto; width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.08); border-top-color: #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">F</div>
        <h1>FocusFlow</h1>
        <p>Giriş işlemini tamamlamak için aşağıdaki butona tıklayın.</p>
        <button id="loginBtn" class="btn">Google ile Giriş Yap</button>
        <div id="loader" class="loader"></div>
    </div>
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        const firebaseConfig = { apiKey: "${apiKey}", authDomain: "${authDomain}" };
        try {
            const fbApp = initializeApp(firebaseConfig);
            const auth = getAuth(fbApp);
            const provider = new GoogleAuthProvider();
            const btn = document.getElementById("loginBtn");
            const loader = document.getElementById("loader");
            btn.addEventListener("click", () => {
                btn.style.display = 'none';
                loader.style.display = 'block';
                signInWithPopup(auth, provider).then((result) => {
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential.idToken;
                    window.location.href = "/callback?token=" + token;
                }).catch(err => {
                    alert("Giriş hatası: " + err.message);
                    btn.style.display = 'block';
                    loader.style.display = 'none';
                });
            });
        } catch (e) {
            document.querySelector('.card').innerHTML += '<p style="color:#EF4444;">Firebase hata: ' + e.message + '</p>';
        }
    </script>
</body>
</html>
`;

const getSuccessHtml = () => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Giriş Başarılı</title>
<style>body{background:#0a0a0f;color:white;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center}.icon{font-size:80px;margin-bottom:24px}h1{font-size:32px;font-weight:800;margin-bottom:12px}p{color:#71717A;font-size:18px}</style>
</head><body><div class="card"><div class="icon">✅</div><h1>Hoş Geldiniz!</h1><p>Bu pencereyi kapatabilirsiniz.</p></div>
<script>setTimeout(()=>window.close(),3000);</script></body></html>
`;

ipcMain.handle('start-google-login', async (event, rendererConfig) => {
  const config = rendererConfig || firebaseConfig;
  if (!config || !config.apiKey) {
    return { success: false, error: 'Firebase config bulunamadı' };
  }

  return new Promise((resolve, reject) => {
    if (authServer) authServer.close();
    if (authTimeout) clearTimeout(authTimeout);

    authServer = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);

      if (parsedUrl.pathname === '/auth') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getAuthHtml(config.apiKey, config.authDomain));
      } else if (parsedUrl.pathname === '/callback') {
        const token = parsedUrl.query.token;
        if (token) {
          BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send('google-login-success', token);
          });
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getSuccessHtml());
        setTimeout(() => {
          if (authServer) { authServer.close(); authServer = null; }
        }, 5000);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    authServer.listen(0, '127.0.0.1', () => {
      const port = authServer.address().port;
      shell.openExternal(`http://127.0.0.1:${port}/auth`);
      authTimeout = setTimeout(() => {
        if (authServer) { authServer.close(); authServer = null; }
      }, 300000);
      resolve({ success: true, port });
    });

    authServer.on('error', reject);
  });
});

ipcMain.handle('archive-tasks', async (event, tasks) => {
  try {
    const archivesDir = path.join(app.getPath('userData'), 'archives');
    if (!fs.existsSync(archivesDir)) {
      fs.mkdirSync(archivesDir, { recursive: true });
    }
    
    // Create a file per month or just a big file. Let's do per month to keep it clean.
    const dateStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const filePath = path.join(archivesDir, `tasks_${dateStr}.json`);

    let existing = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) { console.error('Archive read error', e); }
    }
    
    // Don't add duplicates
    const existingIds = new Set(existing.map(t => t.id));
    const newTasks = tasks.filter(t => !existingIds.has(t.id));
    
    if (newTasks.length > 0) {
      existing.push(...newTasks);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');
    }
    
    return { success: true, count: newTasks.length, path: filePath };
  } catch (err) {
    console.error('Archive failed', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-archives', async () => {
  try {
    const archivesDir = path.join(app.getPath('userData'), 'archives');
    if (!fs.existsSync(archivesDir)) {
      return { success: true, tasks: [] };
    }
    
    const allFiles = fs.readdirSync(archivesDir).filter(f => f.endsWith('.json'));
    // Prefer monthly archive files tasks_*.json, but fallback to others if none match
    const taskFiles = allFiles.filter(f => f.startsWith('tasks_'));
    const files = taskFiles.length > 0 ? taskFiles : allFiles;

    const taskMap = new Map();
    
    for (const file of files) {
      try {
        const filePath = path.join(archivesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const list = Array.isArray(data) ? data : (Array.isArray(data?.tasks) ? data.tasks : []);
        for (const task of list) {
          if (task && task.id) {
            // Keep unique tasks, overwriting older duplicates if updated later
            taskMap.set(task.id, task);
          }
        }
      } catch (err) {
        console.error('Error reading archive file', file, err);
      }
    }
    
    return { success: true, tasks: Array.from(taskMap.values()) };
  } catch (err) {
    console.error('Failed to read archives', err);
    return { success: false, error: err.message };
  }
});

// Full backup: all data (tasks, categories, settings, activity) to a user-chosen file
ipcMain.handle('create-full-backup', async (event, data) => {
  try {
    const { dialog } = require('electron');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'FocusFlow Yedek Dosyasını Kaydet',
      defaultPath: path.join(app.getPath('documents'), `focusflow-backup-${dateStr}.json`),
      filters: [{ name: 'JSON Yedek', extensions: ['json'] }],
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    // Also include locally-archived tasks if they exist
    const archivesDir = path.join(app.getPath('userData'), 'archives');
    let archivedTasks = [];
    if (fs.existsSync(archivesDir)) {
      const files = fs.readdirSync(archivesDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = JSON.parse(fs.readFileSync(path.join(archivesDir, file), 'utf8'));
          if (Array.isArray(raw)) archivedTasks.push(...raw);
        } catch (e) {}
      }
    }

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      appVersion: app.getVersion(),
      ...data,                        // tasks, categories, settings, activityLog
      archivedTasks,                  // locally-archived (30+ day) tasks
    };

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8');
    return { success: true, path: filePath };
  } catch (err) {
    console.error('Backup failed', err);
    return { success: false, error: err.message };
  }
});

// Open the archives folder in File Explorer
ipcMain.handle('open-archives-folder', async () => {
  const archivesDir = path.join(app.getPath('userData'), 'archives');
  if (!fs.existsSync(archivesDir)) fs.mkdirSync(archivesDir, { recursive: true });
  shell.openPath(archivesDir);
  return { success: true };
});


ipcMain.on('app-quit', () => {
  isQuitting = true;
  app.quit();
});

ipcMain.on('app-hide', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('focus-window', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('settings-updated', (event, settings) => {
  currentSettings = settings;
});

// =============================================
// ★ Tray Update (Dışarıdan tetiklenebilir)
// =============================================
ipcMain.on('update-tray', (event, data) => {
  if (!tray) return;
  const { title } = data;
  
  const label = title ? `Görev: ${title}` : 'Görev yok';
  tray.setToolTip(`FocusFlow - ${label}`);
  
  const menuItems = [
    { label: 'FocusFlow\'u Aç', click: () => { if(mainWindow) mainWindow.show(); } },
    { type: 'separator' },
    { label: label, enabled: false },
  ];
  
  if (title) {
    menuItems.push({ 
      label: '✓ Görevi Bitti İşaretle', 
      click: () => {
        if(mainWindow) mainWindow.webContents.send('tray-complete-task');
      } 
    });
  }
  
  menuItems.push({ type: 'separator' });
  menuItems.push({ 
    label: 'Uygulamadan Çık', 
    click: () => {
      isQuitting = true;
      app.quit();
    } 
  });
  
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
});

// =============================================
// ★ GitHub Auto-Updater (electron-updater)
// =============================================
let autoUpdater = null;
try {
  const updaterModule = require('electron-updater');
  autoUpdater = updaterModule.autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (e) {
  console.warn('[Updater] electron-updater could not be loaded:', e);
}

function sendUpdaterStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('updater-status', { status, ...data });
  }
}

function isNewerVersion(remote, local) {
  if (!remote || !local) return false;
  const cleanR = remote.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const cleanL = local.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(cleanR.length, cleanL.length); i++) {
    const r = cleanR[i] || 0;
    const l = cleanL[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

if (autoUpdater) {
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
    sendUpdaterStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    sendUpdaterStatus('available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] Update not available. Current version:', info.version);
    sendUpdaterStatus('not-available', { version: info.version });
  });

  autoUpdater.on('error', (err) => {
    const message = err ? (err.message || err.toString()) : 'Bilinmeyen güncelleme hatası';
    console.error('[Updater] Update error:', message);
    sendUpdaterStatus('error', { error: message });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdaterStatus('downloading', {
      percent: Math.round(progress.percent || 0),
      bytesPerSecond: progress.bytesPerSecond || 0,
      transferred: progress.transferred || 0,
      total: progress.total || 0,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    sendUpdaterStatus('downloaded', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });
}

// IPC Handlers for Auto-Updater
ipcMain.handle('get-app-version', () => app.getVersion());

// Track the path of a downloaded installer for dev-mode manual downloads
let downloadedInstallerPath = null;

ipcMain.handle('check-for-updates', async () => {
  const currentVersion = app.getVersion();

  // Geliştirici modunda veya autoUpdater yoksa GitHub Releases API ile kontrol et
  if (isDev || !autoUpdater) {
    try {
      sendUpdaterStatus('checking');
      const response = await net.fetch('https://api.github.com/repos/FocusFlow-ToDo/FocusFlow-App/releases/latest', {
        headers: {
          'User-Agent': `FocusFlow/${currentVersion}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          sendUpdaterStatus('not-available', { version: currentVersion });
          return { success: true, updateAvailable: false, version: currentVersion };
        }
        throw new Error(`GitHub API HTTP ${response.status}`);
      }

      const release = await response.json();
      const latestVersion = release.tag_name || release.name || '';
      const hasUpdate = isNewerVersion(latestVersion, currentVersion);

      if (hasUpdate) {
        // Find the .exe asset for download
        const assets = release.assets || [];
        const exeAsset = assets.find(a => a.name && a.name.endsWith('.exe') && !a.name.includes('blockmap'));
        const downloadUrl = exeAsset ? exeAsset.browser_download_url : null;
        const downloadSize = exeAsset ? exeAsset.size : 0;

        sendUpdaterStatus('available', {
          version: latestVersion,
          releaseNotes: release.body,
          releaseUrl: release.html_url,
          downloadUrl: downloadUrl,
          downloadSize: downloadSize,
          isDev: true,
        });
        return {
          success: true,
          updateAvailable: true,
          version: latestVersion,
          releaseNotes: release.body,
          releaseUrl: release.html_url,
          downloadUrl: downloadUrl,
          downloadSize: downloadSize,
        };
      } else {
        sendUpdaterStatus('not-available', { version: currentVersion });
        return { success: true, updateAvailable: false, version: currentVersion };
      }
    } catch (err) {
      const errorMsg = err.message || 'GitHub sürüm kontrolü başarısız oldu';
      sendUpdaterStatus('error', { error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  // Production ortamında paketlenmiş autoUpdater çalıştır
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, result };
  } catch (err) {
    sendUpdaterStatus('error', { error: err.message });
    return { success: false, error: err.message };
  }
});

// Download update from GitHub (dev mode manual download)
ipcMain.handle('download-update', async (event, downloadUrl) => {
  if (!downloadUrl) {
    sendUpdaterStatus('error', { error: 'İndirme URL bulunamadı' });
    return { success: false, error: 'No download URL' };
  }

  try {
    const os = require('os');
    const fileName = path.basename(new URL(downloadUrl).pathname);
    const savePath = path.join(os.tmpdir(), fileName);

    sendUpdaterStatus('downloading', { percent: 0, transferred: 0, total: 0 });

    const response = await net.fetch(downloadUrl, {
      headers: { 'User-Agent': `FocusFlow/${app.getVersion()}` }
    });

    if (!response.ok) {
      throw new Error(`İndirme hatası: HTTP ${response.status}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;

      const percent = contentLength > 0 ? Math.round((received / contentLength) * 100) : 0;
      sendUpdaterStatus('downloading', {
        percent,
        transferred: received,
        total: contentLength,
        bytesPerSecond: 0,
      });
    }

    // Combine chunks and write to file
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(savePath, buffer);

    downloadedInstallerPath = savePath;

    console.log('[Updater] Downloaded installer to:', savePath);
    sendUpdaterStatus('downloaded', {
      version: '',
      installerPath: savePath,
    });

    return { success: true, path: savePath };
  } catch (err) {
    const errorMsg = err.message || 'İndirme başarısız oldu';
    console.error('[Updater] Download error:', errorMsg);
    sendUpdaterStatus('error', { error: errorMsg });
    return { success: false, error: errorMsg };
  }
});

ipcMain.handle('install-update', () => {
  if (autoUpdater && !isDev) {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } else if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
    // Dev modunda indirilen installer'ı çalıştır
    const { execFile } = require('child_process');
    execFile(downloadedInstallerPath, { detached: true, stdio: 'ignore' });
    setTimeout(() => app.quit(), 1000);
    return { success: true };
  } else {
    // Fallback: GitHub releases sayfasını aç
    shell.openExternal('https://github.com/FocusFlow-ToDo/FocusFlow-App/releases/latest');
    return { success: true, redirected: true };
  }
});


// =============================================
// ★ App Ready
// =============================================
app.whenReady().then(() => {
  // ★ Production'da custom protocol ile static dosyaları servis et
  if (!isDev) {
    const outDir = path.join(__dirname, 'out');

    protocol.handle('app', (request) => {
      const reqUrl = new URL(request.url);
      let filePath = path.join(outDir, decodeURIComponent(reqUrl.pathname));

      // Klasör ise → index.html
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      // Uzantısız path → index.html veya .html dene
      if (!path.extname(filePath)) {
        if (fs.existsSync(path.join(filePath, 'index.html'))) {
          filePath = path.join(filePath, 'index.html');
        } else if (fs.existsSync(filePath + '.html')) {
          filePath = filePath + '.html';
        } else {
          // SPA fallback → ana sayfa
          filePath = path.join(outDir, 'index.html');
        }
      }

      // Dosya yoksa → ana sayfa fallback
      if (!fs.existsSync(filePath)) {
        filePath = path.join(outDir, 'index.html');
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });
  }

  createWindow();

  // =============================================
  // ★ Tray (Sistem Tepsisi) Oluştur
  // =============================================
  try {
    const iconPath = path.join(__dirname, 'resources', 'logo.png');
    // Eğer ikon yoksa boş bir native image yarat (hata almamak için)
    let trayIcon = fs.existsSync(iconPath) 
      ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
      : nativeImage.createEmpty();

    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'FocusFlow\'u Aç', click: () => mainWindow.show() },
      { type: 'separator' },
      { 
        label: 'Uygulamadan Çık', 
        click: () => {
          isQuitting = true;
          app.quit();
        } 
      }
    ]);

    tray.setToolTip('FocusFlow');
    tray.setContextMenu(contextMenu);

    // ★ İkona tıklandığında göster/gizle
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });
  } catch (err) {
    console.error('Tray initialization error:', err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});