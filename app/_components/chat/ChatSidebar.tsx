// app/_components/chat/ChatSidebar.tsx

"use client";

import { Id } from "@/convex/_generated/dataModel";
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  User,
  GraduationCap,
  School,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

interface ChatSidebarProps {
  chats: any[];
  selectedChat: Id<"chatGroups"> | null;
  onSelectChat: (chatId: Id<"chatGroups">) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: "all" | "group" | "class" | "grade" | "direct";
  onFilterChange: (type: "all" | "group" | "class" | "grade" | "direct") => void;
  onCreateChat: () => void;
  isLoading: boolean;
  isStudent?: boolean;
  studyGroupChats?: any[];
  regularChats?: any[];
}

export function ChatSidebar({
  chats,
  selectedChat,
  onSelectChat,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  onCreateChat,
  isLoading,
  isStudent = false,
  studyGroupChats = [],
  regularChats = [],
}: ChatSidebarProps) {
  const getChatIcon = (type: string) => {
    switch (type) {
      case "group":
        return <Users size={16} />;
      case "class":
        return <School size={16} />;
      case "grade":
        return <GraduationCap size={16} />;
      case "direct":
        return <User size={16} />;
      default:
        return <MessageCircle size={16} />;
    }
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), "hh:mm a", { locale: arSA });
  };

  const filterOptions = [
    { value: "all", label: "الكل" },
    { value: "group", label: "مجموعات" },
    { value: "class", label: "فصول" },
    { value: "grade", label: "صفوف" },
    { value: "direct", label: "مباشر" },
  ];

  // ✅ إذا كان مستخدم طالب، عرض مختلف
  if (isStudent) {
    return (
      <div className="w-95 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shrink-0">
        {/* Header - بدون زر إنشاء */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={24} />
              المحادثات
            </h1>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ✅ Chat List مقسم */}
        <div className="flex-1 overflow-y-auto">
          {/* مجموعاتي الدراسية */}
          {studyGroupChats.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  مجموعاتي الدراسية
                </h3>
              </div>
              {studyGroupChats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => onSelectChat(chat._id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                    selectedChat === chat._id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {chat.name?.charAt(0) || "?"}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users size={12} />
                        {chat.memberCount} عضو
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-37.5">
                        {chat.lastMessage || "لا توجد رسائل"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* المحادثات العادية */}
          {regularChats.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  المحادثات
                </h3>
              </div>
              {regularChats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => onSelectChat(chat._id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                    selectedChat === chat._id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {chat.name?.charAt(0) || "?"}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {getChatIcon(chat.type)}
                        {chat.memberCount} عضو
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-37.5">
                        {chat.lastMessage || "لا توجد رسائل"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {studyGroupChats.length === 0 && regularChats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <MessageSquare size={48} className="mb-2" />
              <p className="text-center">لا توجد محادثات</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ عرض عادي للأدمن والمعلم
  return (
    <div className="w-95 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={24} />
            المحادثات
          </h1>
          <button
            onClick={onCreateChat}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="إنشاء محادثة جديدة"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث في المحادثات..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value as any)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                filterType === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageSquare size={48} className="mb-2" />
            <p className="text-center">لا توجد محادثات</p>
            <button
              onClick={onCreateChat}
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              إنشاء محادثة جديدة
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => onSelectChat(chat._id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                selectedChat === chat._id ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {chat.name?.charAt(0) || "?"}
                </div>
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chat.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    {getChatIcon(chat.type)}
                    {chat.memberCount} عضو
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-37.5">
                    {chat.lastMessage || "لا توجد رسائل"}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}