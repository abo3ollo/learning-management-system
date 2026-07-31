// app/admin/chatbox/types.ts

import { Id } from "@/convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student" | "parent";
  status: string;
  avatar?: string;
  studentId?: string;
  teacherId?: string;
  phoneNumber?: string;
}

export interface Participant {
  _id: Id<"chatParticipants">;
  chatId: Id<"chatGroups">;
  userId: Id<"users">;
  role: "admin" | "member";
  status: "active" | "inactive" | "kicked";
  joinedAt: number;
  lastReadAt?: number;
  isMuted: boolean;
  pinned: boolean;
  user?: User;
}

export interface ChatMessage {
  _id: Id<"chatMessages">;
  chatId: Id<"chatGroups">;
  senderId: Id<"users">;
  content: string;
  type: "text" | "image" | "file" | "voice" | "video" | "system";
  mediaUrl?: string;
  mediaKey?: string;
  replyTo?: Id<"chatMessages">;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  readBy: Id<"users">[];
  createdAt: number;
  updatedAt?: number;
  sender?: User;
  isMine?: boolean;
}

export interface ChatGroup {
  _id: Id<"chatGroups">;
  name: string;
  description?: string;
  type: "group" | "class" | "grade" | "direct";
  createdBy: Id<"users">;
  isPrivate: boolean;
  isActive: boolean;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  lastMessageSender?: Id<"users">;
  unreadCount?: number;
  memberCount?: number;
  isAdmin?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatData {
  chat: ChatGroup;
  participants: Participant[];
  participantStatus: Participant;
  messages: ChatMessage[];
}