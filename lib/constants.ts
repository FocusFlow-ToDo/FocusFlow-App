import { Priority, TaskStatus } from "@/types";

export const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "red",      // We map this to literal tailwind colors via cn() classes manually or style vars
  high: "orange",
  medium: "blue",
  low: "emerald",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "zinc",
  in_progress: "amber",
  done: "emerald",
  trash: "rose",
};

export const POMODORO_DEFAULTS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
};

export const ROUTES = [
  { name: "Focus", href: "/", icon: "Target" },
  { name: "Planlayıcı", href: "/planner", icon: "Calendar" },
  { name: "Görevler", href: "/tasks", icon: "List" },
  { name: "Analizler", href: "/analytics", icon: "BarChart2" },
  { name: "Ayarlar", href: "/settings", icon: "Settings" },
];

export const SHORTCUTS = [
  { key: "K", modifier: "Cmd", description: "Command Palette" },
  { key: "N", modifier: "Cmd", description: "Yeni Görev" },
  { key: "Space", modifier: "", description: "Timer Başlat/Duraklat" },
  { key: "Enter", modifier: "Cmd", description: "Görevi Tamamla" },
  { key: "Esc", modifier: "", description: "Modal/Panel Kapat" },
  { key: "1", modifier: "Cmd", description: "Focus Sayfası" },
  { key: "2", modifier: "Cmd", description: "Planlayıcı" },
  { key: "3", modifier: "Cmd", description: "Görevler" },
  { key: "4", modifier: "Cmd", description: "Analizler" },
  { key: ",", modifier: "Cmd", description: "Ayarlar" },
];
