// app/admin/chatbox/components/ChatHeader.tsx

"use client";

import {
  UserPlus,
  Settings,
  Trash2,
  Info,
  MoreVertical,
  LogOut,
  Users,
} from "lucide-react";
import { useState } from "react";

interface ChatHeaderProps {
  chat: any;
  participants: any[];
  isAdmin: boolean;
  onAddMembers: () => void;
  onShowDetails: () => void;
  onToggleSettings: () => void;
  showSettings: boolean;
  onDeleteChat: () => void;
  onLeaveChat: () => void;
  isStudent?: boolean;
  isTeacher?: boolean;
}

export function ChatHeader({
  chat,
  participants,
  isAdmin,
  onAddMembers,
  onShowDetails,
  onToggleSettings,
  showSettings,
  onDeleteChat,
  onLeaveChat,
  isStudent = false,
  isTeacher = false,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  // ✅ الطلاب لا يمكنهم إضافة أعضاء أبداً
  const canAddMembers = isAdmin && !isStudent;

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
        return "";
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {chat.name?.charAt(0) || "?"}
        </div>
        <div className="text-right min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">
            {chat.name}
          </h2>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Users size={12} />
            {participants?.filter((p: any) => p.status === "active").length || 0} أعضاء
            <span className="mx-1">•</span>
            {getTypeLabel(chat.type)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* ✅ Add Members - فقط للأدمن وليس للطالب */}
        {canAddMembers && (
          <button
            onClick={onAddMembers}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="إضافة أعضاء"
          >
            <UserPlus size={20} />
          </button>
        )}

        {/* Chat Info - متاح للجميع */}
        <button
          onClick={onShowDetails}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="تفاصيل المحادثة"
        >
          <Info size={20} />
        </button>

        {/* ✅ Settings - فقط للأدمن وليس للطالب */}
        {!isStudent && isAdmin && (
          <button
            onClick={onToggleSettings}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
              showSettings ? "bg-gray-100 dark:bg-gray-700" : ""
            }`}
            title="إعدادات المحادثة"
          >
            <Settings size={20} />
          </button>
        )}

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              {isAdmin && !isStudent ? (
                <button
                  onClick={() => {
                    if (confirm("هل أنت متأكد من حذف هذه المحادثة؟")) {
                      onDeleteChat();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-right text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  حذف المحادثة
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm("هل أنت متأكد من مغادرة هذه المحادثة؟")) {
                      onLeaveChat();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-right text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  مغادرة المحادثة
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}