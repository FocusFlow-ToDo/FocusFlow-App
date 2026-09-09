<div align="center">

# ⚡ FocusFlow

**Zamanını Yönet, Odaklan, Başar.**  
*Akıllı, oyunlaştırılmış ve modern masaüstü & web odaklanma ve görev yönetim platformu.*

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-41.1-47848F?style=for-the-badge&logo=electron)](https://www.electronjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFA611?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

[Özellikler](#-özellikler) • [Kurulum](#-kurulum--çalıştırma) • [Ortam-Değişkenleri](#-ortam-değişkenleri-env) • [Masaüstü-Kısayolları](#-masaüstü-entegrasyonu--kısayollar) • [Teknoloji-Yığını](#-teknoloji-yığını)

</div>

---

## 🌟 FocusFlow Nedir?

**FocusFlow**, üretkenliği sıradan bir görev listesinden çıkarıp oyunlaştırılmış, akıcı ve keyifli bir deneyime dönüştüren yeni nesil bir çalışma asistanıdır. Pomodoro tekniğini, gelişmiş görev/proje yönetimini, detaylı odak analizlerini ve RPG benzeri bir seviye/başarım sistemini bir araya getirir.

Hem modern bir **Web Uygulaması** olarak hem de **Electron** altyapısıyla sistem tepsisine küçülebilen yerel bir **Windows Masaüstü Uygulaması** olarak çalışır.

---

## ✨ Özellikler

### ⏱️ Akıllı Pomodoro & Odak Modu
- **Kişiselleştirilebilir Süreler:** Odaklanma, kısa mola ve uzun mola sürelerini dilediğiniz gibi ayarlayın.
- **Tam Ekran Odaklanma (Zen Mode):** Dikkat dağıtıcı unsurlardan arınmış, derin çalışma arayüzü.
- **Mini Kayan Pencere (Widget):** Diğer pencerelerin üzerinde kalarak odak sürenizi takip etmenizi sağlayan kompakt masaüstü penceresi.
- **Ortam Sesleri ve Uyarılar:** Seans başlangıç ve bitişlerinde yumuşak sesli bildirimler.

### 📋 Görev & Proje Yönetimi
- **Kanban ve Liste Görünümleri:** Görevlerinizi ister aşamalara göre sürükleyip bırakın (`@dnd-kit`), ister liste halinde yönetin.
- **Öncelik Seviyeleri:** `Acil (Urgent)`, `Yüksek (High)`, `Orta (Medium)` ve `Düşük (Low)` renk kodlu öncelik sistemi.
- **Alt Görevler & İlerleme:** Büyük görevleri parçalara bölün ve tamamlanma yüzdesini anlık takip edin.
- **Özel Kategoriler:** Kendi simgeleriniz veya emojilerinizle kategoriler oluşturun (Cloudinary destekli).
- **Arşiv & Çöp Kutusu:** Tamamlanan görevleri arşivleyin veya silinenleri geri getirin.

### 🎮 Oyunlaştırma & XP Sistemi
- **XP ve Seviye Atlama:** Tamamlanan her görev ve odaklanma seansı size tecrübe puanı (XP) kazandırır.
- **Başarım Rozetleri:** Süreklilik, tamamlanan görev sayısı ve odaklanma rekorları için özel rozetler.
- **Günlük Seri (Streak):** Düzenli çalışarak serinizi koruyun ve motivasyonunuzu yüksek tutun.
- **Ödül Mağazası:** Kazandığınız puanlarla sanal ödüller ve kişiselleştirmeler açın.

### 📊 Derinlemesine Analiz & Isı Haritası
- **Günlük & Haftalık İstatistikler:** Hangi gün ve saatlerde daha üretken olduğunuzu gösteren odak haritaları.
- **Kategori Dağılımı:** Zamanınızın ne kadarını hangi projelere ve kategorilere ayırdığınızı grafiklerle görün.

### 👥 Topluluk & Ortak Projeler
- **Ortak Proje Alanları:** Takım arkadaşlarınızla projeler oluşturun, görev atayın ve davet bağlantılarıyla birlikte çalışın.
- **Liderlik Tablosu:** Toplulukta kimlerin daha çok odaklandığını görerek tatlı bir rekabete katılın.

### 🖥️ Yerel Masaüstü Özellikleri (Electron)
- **Çerçevesiz Özel Başlık Çubuğu:** Modern ve şık masaüstü penceresi.
- **Sistem Tepsisi (Tray):** Arka planda sessizce çalışır, tepsiye küçülebilir.
- **Hızlı Dikkat Dağıtıcısı Yakalayıcı (`Ctrl + Shift + D`):** Çalışırken aklınıza gelen ani düşünceleri veya yapılacakları odağınızı bölmeden anında kaydedin.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Modern React SSR ve Statik Export mimarisi |
| **Masaüstü Motoru** | [Electron 41](https://www.electronjs.org/) | Windows için yerel masaüstü deneyimi |
| **Kullanıcı Arayüzü** | [React 19](https://react.dev/) & [TypeScript 5.9](https://www.typescriptlang.org/) | Tip güvenli bileşen mimarisi |
| **Stil & Tasarım** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern ve optimize CSS altyapısı |
| **Animasyonlar** | [Motion](https://motion.dev/) (Framer Motion) | 60 FPS akıcı geçişler ve yay fiziği |
| **Veritabanı & Auth** | [Google Firebase Firestore & Auth](https://firebase.google.com/) | Çevrimdışı önbellekli gerçek zamanlı senkronizasyon |
| **Medya Yönetimi** | [Cloudinary](https://cloudinary.com/) | Profil ve kategori simgelerinin güvenli bulut depolaması |
| **Paketleme** | [electron-builder](https://www.electron.build/) | NSIS tabanlı Windows yükleyicisi (`.exe`) |

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- **Node.js**: `v20.x` veya üzeri
- **npm**: `v10.x` veya üzeri

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/FocusFlow-App.git
cd FocusFlow-App
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini Ayarlayın
Depo içinde bulunan `.env.example` dosyasını `.env` veya `.env.local` olarak kopyalayın:

```bash
cp .env.example .env.local
```

Dosyayı açıp kendi **Firebase** ve **Cloudinary** bilgilerinizi girin:

```env
# Cloudinary (Görsel Yüklemeleri İçin)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Firebase (Kimlik Doğrulama & Firestore)
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

> [!NOTE]
> Electron sürümünü geliştirmek ve paketlemek için `firebase-applet-config.example.json` dosyasını referans alarak kök dizinde `firebase-applet-config.json` oluşturabilirsiniz. Bu dosya `.gitignore` tarafından korunmaktadır.

---

## 💻 Çalıştırma Komutları

### Web Geliştirme Sunucusu (Tarayıcı)
Next.js geliştirme sunucusunu başlatır:
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### Masaüstü Geliştirme Modu (Electron + Next.js)
Next.js ve Electron'u eş zamanlı başlatır ve hot-reload ile canlı izler:
```bash
npm run electron-dev
```

### Windows Yükleyici Paketi Oluşturma (`.exe`)
Uygulamayı derler ve `dist/` klasörü altına kurulabilir Windows kurulum dosyasını (`FocusFlow-Setup-0.1.0.exe`) üretir:
```bash
npm run dist
```

---

## ⌨️ Masaüstü Entegrasyonu & Kısayollar

| Kısayol | İşlev |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | **Hızlı Dikkat Dağıtıcı Yakalama:** Herhangi bir uygulamadayken mini not giriş penceresi açar. |
| <kbd>Space</kbd> | Pomodoro sayacını başlat / duraklat |
| <kbd>F11</kbd> | Tam Ekran (Zen Modu) aç / kapat |

---

## 📂 Proje Dizin Yapısı

```text
FocusFlow-App/
├── app/                        # Next.js 15 App Router sayfaları
│   ├── achievements/           # Başarımlar ve rozetler sayfası
│   ├── analytics/              # Odaklanma analizleri ve grafikler
│   ├── community/              # Topluluk ve liderlik tablosu
│   ├── planner/                # Haftalık / günlük ajanda planlayıcı
│   ├── projects/               # Ortak ve kişisel proje panoları
│   ├── settings/               # Ayarlar (temalar, süreler, sesler)
│   ├── shop/                   # Puan ve ödül mağazası
│   ├── tasks/                  # Görev listesi ve kanban panoları
│   ├── globals.css             # Tailwind v4 stil tanımları
│   └── page.tsx                # Ana Odaklanma Dashboard'u
├── components/                 # Yeniden kullanılabilir UI bileşenleri
│   ├── categories/             # Kategori yöneticisi ve modalı
│   ├── modals/                 # Görev ekleme, düzenleme ve mola pencereleri
│   ├── pomodoro/               # Pomodoro sayaç ve kontrolleri
│   ├── tasks/                  # Görev kartları ve sürükle-bırak elemanları
│   └── ui/                     # Butonlar, inputlar, tasarım sistemi bileşenleri
├── contexts/                   # React Context sağlayıcıları (Auth, Tasks, Theme)
├── firebase/                   # Firebase istemci yapılandırması
├── hooks/                      # Özel React Hook'ları (usePomodoro, useSound, vb.)
├── lib/                        # Tasarım token'ları, yardımcı fonksiyonlar
├── resources/                  # Uygulama ikonları (.ico) ve logolar
├── main.js                     # Electron ana süreç dosyası (Tray, Shortcuts, IPC)
├── preload.js                  # Electron güvenli köprü (contextBridge)
├── .env.example                # Çevre değişkenleri şablonu
├── DESIGN_SYSTEM.md            # Tasarım sistemi dokümantasyonu
└── package.json                # Bağımlılıklar ve derleme betikleri
```

---

## 🔒 Güvenlik & Gizlilik

- **Hassas Bilgiler:** `.env`, `.env.local` ve özel Firebase anahtar dosyaları `.gitignore` kapsamında korunmaktadır.
- **GitHub Secret Scanning:** Kod tabanında hiçbir sabitlenmiş API anahtarı veya gizli anahtar (secret) barındırılmaz; tüm kimlikler ortam değişkenleri üzerinden beslenir.

---

## 📄 Lisans

Bu proje özel mülkiyet altındadır. Tüm hakları saklıdır.
