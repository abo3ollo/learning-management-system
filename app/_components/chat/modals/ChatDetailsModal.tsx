// app/admin/chatbox/components/modals/ChatDetailsModal.tsx

"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Users,
  Calendar,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Crown,
  User,
  Mail,
  Phone,
  Clock,
  School,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

interface ChatDetailsModalProps {
  isOpen: boolean;
  chat: any;
  participants: any[];
  onClose: () => void;
  onDeleteChat: () => void;
  onUpdateChat: (data: any) => Promise<void>;
}

export function ChatDetailsModal({
  isOpen,
  chat,
  participants,
  onClose,
  onDeleteChat,
  onUpdateChat,
}: ChatDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(chat?.name || "");
  const [description, setDescription] = useState(chat?.description || "");
  const [isPrivate, setIsPrivate] = useState(chat?.isPrivate || false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !chat) return null;

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd MMM yyyy, hh:mm a", { locale: arSA });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateChat({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const activeParticipants = participants.filter((p: any) => p.status === "active");
  const admins = activeParticipants.filter((p: any) => p.role === "admin");

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "group":
        return "مجموعة";
      case "class":
        return "فصل";
      case "grade":
        return "صف";
      case "direct":
        return "مباشر";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "group":
        return <Users size={18} />;
      case "class":
        return <School size={18} />;
      case "grade":
        return <GraduationCap size={18} />;
      case "direct":
        return <User size={18} />;
      default:
        return <Users size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            تفاصيل المحادثة
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Info */}
        <div className="space-y-4">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {chat.name?.charAt(0) || "?"}
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chat.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {getTypeIcon(chat.type)}
                {getTypeLabel(chat.type)}
                <span className="mx-1">•</span>
                {chat.isPrivate ? (
                  <Lock size={14} className="text-yellow-500" />
                ) : (
                  <Unlock size={14} className="text-green-500" />
                )}
                {chat.isPrivate ? "خاص" : "عام"}
              </p>
            </div>
          </div>

          {/* Description */}
          {chat.description && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {chat.description}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <Users size={20} className="mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeParticipants.length}
              </p>
              <p className="text-xs text-gray-500">الأعضاء</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <Crown size={20} className="mx-auto text-yellow-500 mb-1" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {admins.length}
              </p>
              <p className="text-xs text-gray-500">المدراء</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">النوع</span>
              <span className="text-gray-900 dark:text-white">{getTypeLabel(chat.type)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">الحالة</span>
              <span className={`${chat.isActive ? "text-green-500" : "text-red-500"}`}>
                {chat.isActive ? "نشطة" : "غير نشطة"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">تم الإنشاء</span>
              <span className="text-gray-900 dark:text-white text-xs">
                {formatDate(chat.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">آخر تحديث</span>
              <span className="text-gray-900 dark:text-white text-xs">
                {formatDate(chat.updatedAt)}
              </span>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              الأعضاء ({activeParticipants.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activeParticipants.map((participant: any) => (
                <div
                  key={participant._id}
                  className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold">
                      {participant.user?.name?.charAt(0) || "?"}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {participant.user?.name}
                    </span>
                  </div>
                  {participant.role === "admin" && (
                    <Crown size={14} className="text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 size={18} />
              تعديل
            </button>
            <button
              onClick={onDeleteChat}
              className="flex-1 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              حذف
            </button>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleUpdate} className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اسم المحادثة
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الوصف
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  محادثة خاصة
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setName(chat.name);
                    setDescription(chat.description || "");
                    setIsPrivate(chat.isPrivate);
                  }}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}