"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Moon, Sun, Monitor, Camera, Minus, Plus,
  Download, Upload, Trash2, Eye, EyeOff, Check, Sparkles,
  Layout, Volume2, Clock, Calendar, Flag, Tag, Settings2,
  RefreshCw, ArrowUpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSettings } from "@/hooks/useSettings"
import { useTasks } from "@/hooks/useTasks"
import { useToast } from "@/contexts/ToastContext"
import { format } from "date-fns"
import { getEventShortcutString } from "@/lib/shortcut"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { Card } from "@/components/ui/Card"
import { Divider } from "@/components/ui/Divider"

const ACCENT_COLORS = [
  { id: "blue", bg: "bg-blue-500", ring: "ring-blue-500" },
  { id: "purple", bg: "bg-purple-500", ring: "ring-purple-500" },
  { id: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { id: "orange", bg: "bg-orange-500", ring: "ring-orange-500" },
  { id: "red", bg: "bg-red-500", ring: "ring-red-500" },
  { id: "pink", bg: "bg-pink-500", ring: "ring-pink-500" },
] as const

const THEME_OPTIONS = [
  { id: "dark", label: "Koyu", icon: Moon },
  { id: "light", label: "Açık", icon: Sun },
  { id: "system", label: "Sistem", icon: Monitor },
] as const

const BLUR_OPTIONS = [
  { id: "none", label: "Yok" },
  { id: "low", label: "Az" },
  { id: "medium", label: "Orta" },
  { id: "high", label: "Çok" },
] as const

const POMODORO_ITEMS = [
  { key: "pomodoroFocus" as const, label: "Odaklanma Süresi", unit: "dk", min: 5, max: 90, step: 5 },
  { key: "pomodoroShortBreak" as const, label: "Kısa Mola", unit: "dk", min: 1, max: 30, step: 1 },
  { key: "pomodoroLongBreak" as const, label: "Uzun Mola", unit: "dk", min: 5, max: 60, step: 1 },
  { key: "pomodoroInterval" as const, label: "Uzun Mola Aralığı", unit: "döngü", min: 1, max: 10, step: 1 },
]

export default function SettingsPage() {
  const { user, updateDisplayName, updateProfilePicture } = useAuth() as any
  const { settings, updateSettings } = useSettings()
  const { tasks, addTask, deleteTask } = useTasks()
  const { showToast } = useToast()

  const [showApiKey, setShowApiKey] = React.useState(false)
  const [deleteText, setDeleteText] = React.useState("")
  const [showDeleteSection, setShowDeleteSection] = React.useState(false)
  
  // Profile Name Editing States
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [isSavingName, setIsSavingName] = React.useState(false)

  // Profile Picture Upload States
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // App Version & Auto-Updater States
  const [appVersion, setAppVersion] = React.useState("0.1.0")
  const [checkingUpdates, setCheckingUpdates] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electron) {
      (window as any).electron.ipcRenderer
        .invoke("get-app-version")
        .then((ver: string) => {
          if (ver) setAppVersion(ver)
        })
        .catch(() => {})
    }
  }, [])

  const handleCheckUpdates = async () => {
    if (typeof window === "undefined" || !(window as any).electron) {
      showToast({ type: "warning", message: "Güncelleme kontrolü yalnızca masaüstü uygulamasında çalışır." })
      return
    }
    setCheckingUpdates(true)
    try {
      const res = await (window as any).electron.ipcRenderer.invoke("check-for-updates")
      if (res?.updateAvailable) {
        showToast({ type: "success", message: `Yeni sürüm bulundu: v${res.version?.replace(/^v/, "")}!` })
      } else if (res?.success) {
        showToast({ type: "info", message: "Harika! FocusFlow'un en güncel sürümünü kullanıyorsunuz." })
      } else if (res?.error) {
        showToast({ type: "error", message: `Güncelleme kontrolü: ${res.error}` })
      }
    } catch (err: any) {
      showToast({ type: "error", message: err?.message || "Güncelleme sorgulanırken hata oluştu." })
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      showToast({ type: "error", message: "Cloudinary ENV bilgileri .env dosyasında mevcut değil!" });
      return;
    }

    try {
      setIsUploadingPhoto(true);

      const compressedFile = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            const MAX_SIZE = 400;
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
               ctx.drawImage(img, 0, 0, width, height);
               canvas.toBlob((blob) => {
                 if (blob) resolve(blob);
                 else reject(new Error("Sıkıştırma başarısız."));
               }, "image/webp", 0.85);
            } else {
               reject(new Error("Canvas desteklenmiyor"));
            }
          };
          img.onerror = () => reject(new Error("Görsel yüklenemedi"));
          if (event.target?.result) img.src = event.target.result as string;
        };
        reader.onerror = () => reject(new Error("Dosya okunamadı"));
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append("file", compressedFile, "avatar.webp");
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Cloudinary sunucu hatası");

      const oldPhotoURL = user?.photoURL;
      
      const data = await response.json();
      await updateProfilePicture(data.secure_url);

      // Eski Cloudinary Görselini Silme
      if (oldPhotoURL && oldPhotoURL.includes("res.cloudinary.com")) {
        try {
          const regex = /\/v\d+\/(.+)\.\w+$/;
          const match = oldPhotoURL.match(regex);
          if (match && match[1]) {
            // Arka planda sil, bekletmeye gerek yok
            fetch("/api/cloudinary/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId: match[1] }),
            }).catch(console.error);
          }
        } catch (err) {
          console.error("Eski resim yakalanamadı", err);
        }
      }

      showToast({ type: "success", message: "Profil resmi güncellendi! ✨" });

    } catch (e) {
      console.error(e);
      showToast({ type: "error", message: "Resim yüklenemedi." });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const completedCount = tasks.filter((t) => t.status === "done").length

  const handleUpdateName = async () => {
    if(!newName.trim() || newName.trim() === user?.displayName) {
       setIsEditingName(false);
       return;
    }
    setIsSavingName(true);
    try {
      await updateDisplayName(newName);
      showToast({ type: "success", message: "Kullanıcı adı güncellendi ✨" });
      setIsEditingName(false);
    } catch(e) {
      showToast({ type: "error", message: "Ad değiştirilemedi." });
    } finally {
      setIsSavingName(false);
    }
  }

  const handleExport = React.useCallback(() => {
    const data = {
      tasks: tasks.map((t) => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
        completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : t.completedAt,
        dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
      })),
      settings, exportedAt: new Date().toISOString(), version: "0.1.0",
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `focusflow-export-${format(new Date(), "yyyy-MM-dd")}.json`
    a.click(); URL.revokeObjectURL(url)
    showToast({ type: "success", message: "✅ Veriler dışa aktarıldı" })
  }, [tasks, settings, showToast])

  const handleImport = React.useCallback(() => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      try {
        const text = await file.text(); const data = JSON.parse(text); let count = 0
        if (Array.isArray(data.tasks)) {
          for (const t of data.tasks) {
            await addTask({ title: t.title || "İçe Aktarılan", description: t.description || "", priority: t.priority || "medium",
              status: t.status === "done" ? "done" : "todo", dueDate: t.dueDate ? new Date(t.dueDate) : null,
              tags: Array.isArray(t.tags) ? t.tags : [], subtasks: Array.isArray(t.subtasks) ? t.subtasks : [] })
            count++
          }
        }
        if (data.settings) updateSettings(data.settings)
        showToast({ type: "success", message: `✅ ${count} görev içe aktarıldı` })
      } catch { showToast({ type: "error", message: "❌ Geçersiz dosya formatı" }) }
    }; input.click()
  }, [addTask, updateSettings, showToast])

  const handleClearCompleted = React.useCallback(async () => {
    const completed = tasks.filter((t) => t.status === "done")
    if (!completed.length) { showToast({ type: "info", message: "Temizlenecek görev yok" }); return }
    for (const t of completed) await deleteTask(t.id)
    showToast({ type: "success", message: `🗑 ${completed.length} görev silindi` })
  }, [tasks, deleteTask, showToast])

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32">

        {/* PROFIL */}
        <SectionLabel>Profil</SectionLabel>
        <Card>
          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            <div 
               onClick={() => !isUploadingPhoto && fileInputRef.current?.click()} 
               className={cn("relative group w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0 transition-all", isUploadingPhoto ? "opacity-50 cursor-not-allowed scale-95" : "cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20")}
            >
              {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover relative z-0" data-no-invert /> :
                <span className="text-lg sm:text-xl font-bold text-white relative z-0">{user?.displayName?.charAt(0).toUpperCase() || "U"}</span>}
              
              <div className={cn("absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center z-10", isUploadingPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                {isUploadingPhoto ? (
                   <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : (
                   <Camera className="w-4 h-4 text-white drop-shadow-md" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              {!isEditingName ? (
                 <div className="group/name flex items-center gap-2">
                   <h4 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">{user?.displayName || "Kullanıcı"}</h4>
                   <button onClick={() => { setNewName(user?.displayName || ""); setIsEditingName(true); }} className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-md shrink-0">
                     <Settings2 className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                   </button>
                 </div>
              ) : (
                 <div className="flex items-center gap-2 max-w-[240px]">
                   <input 
                      type="text" 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      disabled={isSavingName} 
                      autoFocus 
                      onKeyDown={(e) => { if(e.key==='Enter') handleUpdateName(); else if(e.key==='Escape') setIsEditingName(false); }} 
                      className="w-full bg-black/40 border border-white/20 rounded-md px-2.5 py-1 text-sm text-white focus:outline-none focus:border-purple-500/50" 
                      placeholder="Yeni İsim"
                   />
                   <button onClick={handleUpdateName} disabled={isSavingName} className="p-1.5 bg-purple-500 hover:bg-purple-600 rounded-md transition-colors disabled:opacity-50 text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                   </button>
                   <button onClick={() => setIsEditingName(false)} disabled={isSavingName} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white shrink-0">
                      <Minus className="w-3.5 h-3.5" />
                   </button>
                 </div>
              )}
              <p className="text-sm text-zinc-500 truncate mt-0.5">{user?.email || "—"}</p>
            </div>
          </div>
        </Card>

        {/* GÖRÜNÜM */}
        <SectionLabel>Görünüm & Stil</SectionLabel>
        <Card>
          <Row label="Tema">
            <div className="glass-surface rounded-xl p-1 inline-flex relative">
              {THEME_OPTIONS.map((t) => (
                <button key={t.id} onClick={() => updateSettings({ theme: t.id as any })}
                  className={cn("relative z-10 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors",
                    settings.theme === t.id ? "text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300")}>
                  <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
              <motion.div className="absolute top-1 bottom-1 bg-white/[0.08] rounded-lg" layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ left: `${THEME_OPTIONS.findIndex((t) => t.id === settings.theme) * (100 / 3)}%`, width: `${100 / 3}%` }} />
            </div>
          </Row>
          <Divider />
          <Row label="Aksan Rengi">
            <div className="flex gap-2.5">
              {ACCENT_COLORS.map((c) => (
                <button key={c.id} onClick={() => updateSettings({ accentColor: c.id })}
                  className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110", c.bg,
                    settings.accentColor === c.id && cn("scale-110 ring-2 ring-offset-2 ring-offset-[#0a0a0f]", c.ring))}>
                  {settings.accentColor === c.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </Row>
          <Divider />
          <Row label="Blur (Bulanıklık)">
            <div className="glass-surface rounded-xl p-1 inline-flex relative w-full sm:w-auto">
              {BLUR_OPTIONS.map((opt) => (
                <button key={opt.id} onClick={() => updateSettings({ appearance: { ...settings.appearance, blurIntensity: opt.id } })}
                  className={cn("relative z-10 flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs transition-colors",
                    settings.appearance.blurIntensity === opt.id ? "text-zinc-100 font-bold" : "text-zinc-500 hover:text-zinc-400")}>
                  {opt.label}
                </button>
              ))}
              <motion.div className="absolute top-1 bottom-1 bg-white/[0.1] rounded-lg" layout
                style={{ left: `${BLUR_OPTIONS.findIndex((o) => o.id === settings.appearance.blurIntensity) * 25}%`, width: "25%" }} />
            </div>
          </Row>
          <Divider />
          <ToggleRow 
            title="Kompakt Arayüz" 
            desc="Boşlukları daraltarak daha fazla içerik göster" 
            checked={settings.appearance.compactMode} 
            onChange={(v) => updateSettings({ appearance: { ...settings.appearance, compactMode: v } })} 
          />
        </Card>

        {/* GÖREV KARTI DETAYLARI */}
        <SectionLabel>Görev Kartı Detayları</SectionLabel>
        <Card>
          <ToggleRow 
            title="Oluşturulma Saati" 
            desc="Görevlerin ne zaman eklendiğini göster" 
            checked={settings.appearance.showTaskMetadata.createdAt} 
            onChange={(v) => updateSettings({ appearance: { ...settings.appearance, showTaskMetadata: { ...settings.appearance.showTaskMetadata, createdAt: v } } })} 
          />
          <Divider />
          <ToggleRow 
            title="Öncelik Etiketleri" 
            desc="Görev üzerinde öncelik durumunu belirt" 
            checked={settings.appearance.showTaskMetadata.priorityBadge} 
            onChange={(v) => updateSettings({ appearance: { ...settings.appearance, showTaskMetadata: { ...settings.appearance.showTaskMetadata, priorityBadge: v } } })} 
          />
          <Divider />
          <ToggleRow 
            title="Kategori Rozetleri" 
            desc="Kategori isimlerini ve ikonlarını göster" 
            checked={settings.appearance.showTaskMetadata.categoryBadge} 
            onChange={(v) => updateSettings({ appearance: { ...settings.appearance, showTaskMetadata: { ...settings.appearance.showTaskMetadata, categoryBadge: v } } })} 
          />
          <Divider />
          <ToggleRow 
            title="Tarih Bilgisi" 
            desc="Görevlerin bitiş tarihlerini göster" 
            checked={settings.appearance.showTaskMetadata.dueDate} 
            onChange={(v) => updateSettings({ appearance: { ...settings.appearance, showTaskMetadata: { ...settings.appearance.showTaskMetadata, dueDate: v } } })} 
          />
        </Card>

        {/* TABS & FEATURES (Önceki sistemle uyumlu) */}
        <SectionLabel>Navigasyon</SectionLabel>
        <Card>
          <ToggleRow title="Focus" desc="Ana çalışma ekranı" checked={settings.tabs.focus} onChange={(v) => updateSettings({ tabs: { ...settings.tabs, focus: v } })} />
          <Divider />
          <ToggleRow title="Planlayıcı" desc="Takvim görünümü" checked={settings.tabs.planner} onChange={(v) => updateSettings({ tabs: { ...settings.tabs, planner: v } })} />
          <Divider />
          <ToggleRow title="Görevler" desc="Listeler" checked={settings.tabs.tasks} onChange={(v) => updateSettings({ tabs: { ...settings.tabs, tasks: v } })} />
          <Divider />
          <ToggleRow title="Analizler" desc="İstatistikler" checked={settings.tabs.analytics} onChange={(v) => updateSettings({ tabs: { ...settings.tabs, analytics: v } })} />
          <Divider />
          <ToggleRow title="Çöp Kutusu" desc="Silinen görevler" checked={settings.tabs.trash} onChange={(v) => updateSettings({ tabs: { ...settings.tabs, trash: v } })} />
        </Card>

        {/* SES VE BİLDİRİMLER */}
        <SectionLabel>Ses ve Bildirimler</SectionLabel>
        <Card>
          <ToggleRow title="Genel Bildirimler" desc="Uygulama bildirimlerini yönet" checked={settings.notificationsEnabled} onChange={(v) => updateSettings({ notificationsEnabled: v })} />
          <Divider />
          <ToggleRow title="Görev Tamamlama Sesi" desc="Görev bittiğinde onay sesi çal" checked={settings.audio.taskComplete} onChange={(v) => updateSettings({ audio: { ...settings.audio, taskComplete: v } })} />
          <Divider />
          <ToggleRow title="Timer Bitiş Sesi" desc="Pomodoro bittiğinde uyar" checked={settings.audio.timerEnd} onChange={(v) => updateSettings({ audio: { ...settings.audio, timerEnd: v } })} />
        </Card>

        {/* POMODORO */}
        <SectionLabel>Pomodoro</SectionLabel>
        <Card>
          <ToggleRow title="Pomodoro Modu" desc="Zamanlayıcıyı etkinleştir" checked={settings.features.pomodoro} onChange={(v) => updateSettings({ features: { ...settings.features, pomodoro: v } })} />
          {settings.features.pomodoro && (
            <>
              <Divider />
              {POMODORO_ITEMS.map((item, idx) => (
                <React.Fragment key={item.key}>
                  <Row label={item.label}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateSettings({ [item.key]: Math.max(item.min, (settings[item.key] as number) - item.step) })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-base font-mono font-semibold text-zinc-100 tabular-nums">{settings[item.key]}</span>
                      <button onClick={() => updateSettings({ [item.key]: Math.min(item.max, (settings[item.key] as number) + item.step) })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] text-zinc-600 w-10">{item.unit}</span>
                    </div>
                  </Row>
                  {idx < POMODORO_ITEMS.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </>
          )}
        </Card>

        {/* KLAVYE KISAYOLLARI */}
        <SectionLabel>Klavye Kısayolları</SectionLabel>
        <Card>
          <Row label="Yeni Görev Ekle">
            <ShortcutInput 
              value={settings.keybinds.newTask} 
              onSave={(v) => updateSettings({ keybinds: { ...settings.keybinds, newTask: v } })} 
            />
          </Row>
          <Divider />
          <Row label="Arama ve Komut Menüsü">
            <ShortcutInput 
              value={settings.keybinds.quickSearch} 
              onSave={(v) => updateSettings({ keybinds: { ...settings.keybinds, quickSearch: v } })} 
            />
          </Row>
        </Card>

        {/* VERİ */}
        <SectionLabel>Veri Yönetimi</SectionLabel>
        <Card>
          <Row label="Çöp Saklama Süresi">
            <div className="flex items-center gap-2">
              <button onClick={() => updateSettings({ trashRetentionDays: Math.max(1, (settings.trashRetentionDays || 15) - 1) })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-base font-mono font-semibold text-zinc-100 tabular-nums">{settings.trashRetentionDays || 15}</span>
              <button onClick={() => updateSettings({ trashRetentionDays: Math.min(90, (settings.trashRetentionDays || 15) + 1) })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-zinc-600 w-10">gün</span>
            </div>
          </Row>
          <Divider />
          <ActionRow title="Verileri Dışa Aktar" desc="JSON olarak indirin" icon={Download} onClick={handleExport} />
          <Divider />
          <ActionRow title="Verileri İçe Aktar" desc="JSON'dan yükleyin" icon={Upload} onClick={handleImport} />
          <Divider />
          <ActionRow title="Tamamlananları Temizle" desc={`${completedCount} görev silinecek`} icon={Trash2} onClick={handleClearCompleted} destructive />
        </Card>

        {/* UYGULAMA VE GÜNCELLEMELER */}
        <SectionLabel>Uygulama ve Güncellemeler</SectionLabel>
        <Card>
          <Row label="Mevcut Sürüm">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-mono font-bold text-zinc-300">
              v{appVersion}
            </span>
          </Row>
          <Divider />
          <ActionRow
            title={checkingUpdates ? "Güncellemeler Denetleniyor..." : "Güncellemeleri Denetle"}
            desc="GitHub üzerinden en yeni sürümü kontrol edin"
            icon={checkingUpdates ? RefreshCw : Sparkles}
            onClick={handleCheckUpdates}
          />
        </Card>

        <div className="mt-10 text-center pb-4">
          <p className="text-[11px] text-zinc-600 font-medium tracking-widest uppercase italic opacity-50">FocusFlow Pro v{appVersion} • Custom Tailored Experience</p>
        </div>
      </div>
    </div>
  )
}

/* SectionLabel, Card, Divider → @/components/ui */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between py-2.5 gap-4"><span className="text-sm text-zinc-300 font-semibold flex-shrink-0">{label}</span>{children}</div>
}

function ToggleRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0"><p className="text-sm text-zinc-300 font-bold">{title}</p><p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{desc}</p></div>
      <button onClick={() => onChange(!checked)} className={cn("relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 outline-none", checked ? "accent-bg shadow-[0_0_12px_rgba(59,130,246,0.5)]" : "bg-white/[0.08]")}>
        <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" animate={{ left: checked ? 24 : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  )
}

function ActionRow({ title, desc, icon: Icon, onClick, destructive }: { title: string; desc: string; icon: React.FC<{ className?: string }>; onClick: () => void; destructive?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-4 group text-left outline-none">
      <div className="min-w-0">
        <p className="text-sm text-zinc-300 font-bold group-hover:text-zinc-100 transition-colors">{title}</p>
        <p className="text-[11px] text-zinc-600 mt-1">{desc}</p>
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
        destructive ? "bg-red-500/10 group-hover:bg-red-500/20 text-red-400" : "bg-white/[0.04] group-hover:bg-white/[0.08] text-zinc-400 group-hover:text-zinc-100")}>
        <Icon className="w-4.5 h-4.5" />
      </div>
    </button>
  )
}

function ShortcutInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [recording, setRecording] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    if (!recording) return
    const handler = (e: KeyboardEvent) => {
      // Don't save if it's ONLY a modifier key being pressed
      const isOnlyModifier = ["Control", "Meta", "Alt", "Shift"].includes(e.key)
      
      if (e.repeat) return

      e.preventDefault()
      e.stopPropagation()
      
      const newShortcut = getEventShortcutString(e)
      setLocalValue(newShortcut)

      if (!isOnlyModifier) {
        onSave(newShortcut)
        setRecording(false)
      }
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [recording, onSave])

  return (
    <button
      onClick={() => setRecording(true)}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-bold transition-all border outline-none min-w-[120px]",
        recording 
          ? "border-blue-500 bg-blue-500/10 text-blue-400 animate-pulse" 
          : "border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]"
      )}
    >
      {recording ? "Kaydediliyor..." : (localValue || "Ayarlanmadı").replace("Control", "Ctrl").replace("Meta", "Cmd")}
    </button>
  )
}