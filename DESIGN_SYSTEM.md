# FocusFlow Design System

> FocusFlow genelinde tutarlı, modern ve erişilebilir bir kullanıcı arayüzü sağlamak amacıyla oluşturulan tasarım sistemi referans dokümantasyonudur.

---

## 1. Tasarım Token'ları (`lib/design-tokens.ts`)

Tüm öncelik renkleri, animasyon eğrileri ve geçiş sabitleri tek bir merkezden yönetilir.

### Öncelik Sistemi (`PRIORITY_CONFIG`)

| Öncelik | Etiket | Metin Rengi | Arka Plan | Kenarlık | Nokta Rengi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **urgent** | Acil | `text-red-400` | `bg-red-500/10` | `border-red-500/20` | `bg-red-500` |
| **high** | Yüksek | `text-orange-400` | `bg-orange-500/10` | `border-orange-500/20` | `bg-orange-500` |
| **medium** | Orta | `text-blue-400` | `bg-blue-500/10` | `border-blue-500/20` | `bg-blue-500` |
| **low** | Düşük | `text-emerald-400` | `bg-emerald-500/10` | `border-emerald-500/20` | `bg-emerald-500` |

### Animasyon Easing & Motion (`EASING`, `MOTION`)

```typescript
import { EASING, MOTION } from "@/lib/design-tokens"

// Apple-style yumuşak cubic-bezier
EASING.apple // [0.32, 0.72, 0, 1]

// Spring konfigürasyonları
EASING.spring // { type: "spring", stiffness: 400, damping: 30 }
EASING.springBouncy // { type: "spring", stiffness: 350, damping: 25 }

// Hazır Motion Varyantları
MOTION.fadeIn
MOTION.fadeScale
MOTION.slideUp
```

---

## 2. Paylaşılan UI Bileşenleri (`components/ui/`)

### `PageHeader`
Sayfa üst başlıkları, ikonları, sayaç badge'leri ve aksiyon butonları için standart başlık bileşeni.

```tsx
import { PageHeader } from "@/components/ui/PageHeader"
import { Archive, Download } from "lucide-react"

<PageHeader
  icon={Archive}
  title="Arşiv"
  description="Tamamlanmış ve saklanan eski görevler"
  badge={42}
  action={
    <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
      Dışa Aktar
    </Button>
  }
/>
```

### `SectionLabel`
Sayfa içi veya liste içi bölüm başlıkları ve sayaçları için etiket.

```tsx
import { SectionLabel } from "@/components/ui/SectionLabel"

<SectionLabel count={activeTasks.length}>
  Aktif Görevler
</SectionLabel>
```

### `SearchInput`
Tüm sayfalarda arama girdi deneyimini standartlaştıran temizleme butonlu arama alanı.

```tsx
import { SearchInput } from "@/components/ui/SearchInput"

<SearchInput
  value={query}
  onChange={setQuery}
  onClear={() => setQuery("")}
  placeholder="Görevlerde ara... (⌘F)"
  className="w-72"
/>
```

### `PriorityBadge` & `PriorityDot`
Öncelik durumunu görselleştiren rozet ve nokta indikatörleri.

```tsx
import { PriorityBadge, PriorityDot } from "@/components/ui/PriorityBadge"

<PriorityBadge priority="urgent" size="sm" />
<PriorityDot priority="high" />
```

### `CountBadge`
Sayısal sayaçları (görev sayısı, filtre sonucu vb.) göstermek için rozet.

```tsx
import { CountBadge } from "@/components/ui/CountBadge"

<CountBadge count={12} variant="accent" size="md" />
```

### `Card`
Glassmorphism tabanlı, tutarlı kenarlık ve hover efektlerine sahip kart konteyneri.

```tsx
import { Card } from "@/components/ui/Card"

<Card interactive variant="glass" className="p-4">
  <h4>Kart Başlığı</h4>
</Card>
```

### `Divider`
İsteğe bağlı etiket metni ve boşluk ayarları olan ayırıcı çizgi.

```tsx
import { Divider } from "@/components/ui/Divider"

<Divider spacing="lg" />
<Divider label="VEYA" />
```

### `EmptyState`
Liste ve arama boş durumları için şık animasyonlu geri bildirim bileşeni.

```tsx
import { EmptyState } from "@/components/ui/EmptyState"
import { CheckCircle2 } from "lucide-react"

<EmptyState
  icon={CheckCircle2}
  title="Henüz görev yok"
  description="Bugün için planladığın tüm işleri buraya ekleyebilirsin."
  action={{
    label: "Yeni Görev Ekle",
    onClick: handleCreateTask
  }}
/>
```

### `Button`
Gelişmiş varyant, boyut, yüklenme durumu ve ikon desteğine sahip temel buton.

```tsx
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"

<Button variant="primary" size="md" icon={Plus} loading={isSubmitting}>
  Kaydet
</Button>
```

---

## 3. Sayfa Standartları ve Entegrasyon Durumu

| Sayfa | Rota | Kullanılan Tasarım Bileşenleri |
| :--- | :--- | :--- |
| **Focus** | `/` | `SectionLabel`, `EmptyState`, `PRIORITY_CONFIG`, `Button` |
| **Tasks** | `/tasks` | `PageHeader`, `SearchInput`, `SectionLabel`, `CountBadge`, `Divider`, `EmptyState` |
| **Archive** | `/archive` | `PageHeader`, `SearchInput`, `PriorityBadge`, `EmptyState`, `Button`, `PRIORITY_CONFIG` |
| **Trash** | `/trash` | `PageHeader`, `SearchInput`, `EmptyState`, `Button` |
| **Settings** | `/settings` | `Card`, `SectionLabel`, `Divider`, `Button` |
| **Community** | `/community` | `SearchInput`, `EmptyState`, `Badge` |
| **Shop** | `/shop` | `motion/react`, `Button`, `Badge` |
| **Analytics** | `/analytics` | `CalendarPicker`, Glass Card yapısı |
| **Planner** | `/planner` | `StatusMilestones`, Kanban Kartları, `GlobalContextMenu` |
| **Profile** | `/profile` | `ProfileEffectOverlay`, 3D Card yapısı |
| **Achievements** | `/achievements` | `AchievementModal`, 3D Showcase Card |

---

## 4. Renk Paleti ve Stil İlkeleri

- **Ana Arka Plan**: Deep Dark `#050508` ve `#0a0a0f`
- **Glassmorphism**: `bg-white/[0.025]`, `border-white/[0.06]`, `backdrop-blur-xl`
- **Vurgu Renkleri (Accents)**: Blue (`#3B82F6`), Purple (`#8B5CF6`), Emerald (`#10B981`)
- **Tipografi**: Inter / Geists Sans, yüksek kontrastlı hiyerarşi (`zinc-100` başlık, `zinc-400` gövde, `zinc-600` ikincil/meta)
