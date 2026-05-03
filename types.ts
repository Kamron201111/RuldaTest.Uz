export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  fullName?: string;
  phone?: string;
  password?: string;
  avatar?: string;
  role: Role;
  createdAt: string;
  totalPoints: number;
  lastActive?: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
    F?: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  image?: string;
  category?: string;
  description?: string;
}

export interface TestResultDetail {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface TestResult {
  id: string;
  userId: string;
  date: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  details: TestResultDetail[];
  questions?: Question[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  loginTime: string;
  lastSeen: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUserProfile: (updatedUser: User) => void;
}

export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  totalTestsTaken: number;
  badges: string[];
  streak: number;
  lastTestDate?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
}

export interface Friend {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  addedAt: string;
}

export interface UserGoal {
  userId: string;
  dailyTestTarget: number;
  accuracyTarget: number;
  weeklyTestTarget: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  category: string;
  type: 'article' | 'video' | 'quiz';
  content: string;
}

export interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  questionCount: number;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  challengerScore?: number;
  challengedScore?: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  savedAt: string;
}
