export type Priority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done" | "trash";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  completedAt?: string | Date | null;
}

export interface FocusSession {
  startTime: string | Date;
  duration: number; // seconds
}

export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt?: Date;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
  priority?: Priority;
  categoryId?: string | null;
  order?: number;
  addedBy?: string;
  addedByName?: string;
  createdAt?: string;
  completedAt?: string | null;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  status: "planning" | "in_progress" | "completed";
  targetDate: string | null;
  tasks: ProjectTask[];
  categories?: SharedCategory[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedProjectTask {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string | null;
  completedByName?: string | null;
  addedBy: string;
  addedByName: string;
  categoryId?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
  order?: number;
  createdAt: string;
  completedAt?: string | null;
  description?: string;
}

export interface SharedCategory {
  id: string;
  name: string;
  color: string;
  createdBy: string;
}

export interface SharedProjectActivity {
  id: string;
  type:
    | "task_added"
    | "task_completed"
    | "task_uncompleted"
    | "task_deleted"
    | "category_added"
    | "status_changed"
    | "member_joined";
  userId: string;
  userName: string;
  detail: string;
  timestamp: string;
}

export interface SharedProject {
  id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  status: "planning" | "in_progress" | "completed";
  targetDate: string | null;
  leaderId: string;
  leaderName: string;
  leaderPhotoURL?: string | null;
  memberId: string;
  memberName: string;
  memberPhotoURL?: string | null;
  members: string[];
  inviteStatus: "pending" | "accepted" | "rejected";
  tasks: SharedProjectTask[];
  categories: SharedCategory[];
  activityLog: SharedProjectActivity[];
  createdAt: any;
  updatedAt: any;
}

export interface SharedProjectInvite {
  id: string;
  projectId: string;
  projectTitle: string;
  projectEmoji?: string;
  projectColor?: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL?: string | null;
  toUid: string;
  toName?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  categoryId: string | null;
  groupId?: string | null;
  groupName?: string | null;
  groupColor?: string | null;
  groupIcon?: string | null;
  dueDate: Date | null;
  dueTime: string | null;
  recurrence?: "daily" | "weekdays" | "weekly" | "monthly" | null;
  tags: string[];
  subtasks: Subtask[];
  isFocused: boolean;
  focusTime: number;
  sessions?: FocusSession[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  deletedAt?: Date | null;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
  order: number;
  userId: string;
  createdAt: Date;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  accentColor: string;
  pomodoroFocus: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  pomodoroLongBreakInterval: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  aiEnabled: boolean;
  sidebarCollapsed: boolean;
  trashRetentionDays: number;
  tabs: {
    focus: boolean;
    planner: boolean;
    tasks: boolean;
    analytics: boolean;
    trash: boolean;
    archive: boolean;
    community?: boolean;
    projects?: boolean;
    shop?: boolean;
    profile?: boolean;
  };
  features: {
    subtasks: boolean;
    priorities: boolean;
    categories: boolean;
    pomodoro: boolean;
    aiGeneration: boolean;
    notifications: boolean;
    milestones: boolean;
  };
  appearance: {
    compactMode: boolean;
    blurIntensity: "none" | "low" | "medium" | "high";
    showTaskMetadata: {
      createdAt: boolean;
      priorityBadge: boolean;
      categoryBadge: boolean;
      dueDate: boolean;
    };
  };
  audio: {
    taskComplete: boolean;
    timerEnd: boolean;
    clickSound: boolean;
  };
  plannerWeekStart?: string;
  plannerShowArchive?: boolean;
  plannerDoneFilter?: "today" | "week" | "all";

  // Gamification, Coins, Badges & Shop
  earnedBadges: string[];
  showcaseBadges: (string | null)[];
  lastActionDate: string | null;
  streakCount: number;
  streakCelebratedDate: string | null;
  lastWarningDate: string | null;
  streakFreezes: number;
  lastFrozenDate?: string | null;
  focusCoins: number;
  equippedFrame: string | null;
  equippedTitle: string | null;
  equippedProfileEffect?: string | null;
  bio?: string;
  inventory: string[];
  friends: string[];
  purchases?: {
    id: string;
    itemId: string;
    price: number;
    timestamp: number;
    count?: number;
  }[];
}
