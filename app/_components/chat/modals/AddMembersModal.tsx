// app/_components/chat/modals/AddMembersModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Search, UserPlus, Users, Check } from "lucide-react";

interface AddMembersModalProps {
  isOpen: boolean;
  chatId?: Id<"chatGroups">;
  onClose: () => void;
  onAdd: (userIds: Id<"users">[]) => Promise<void>;
  isLoading: boolean;
  isStudent?: boolean;
  isTeacher?: boolean;
}

export function AddMembersModal({
  isOpen,
  chatId,
  onClose,
  onAdd,
  isLoading,
  isStudent = false,
  isTeacher = false,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [filterRole, setFilterRole] = useState<"all" | "student" | "teacher" | "parent" | "admin">("all");

  // ✅ إذا كان المستخدم طالب، لا نعرض المودال أبداً
  if (isStudent) return null;

  // ✅ جلب المستخدمين المتاحين
  const availableUsers = useQuery(
    api.chat.participants.getAvailableParticipants,
    chatId ? { chatId, search: searchQuery || undefined } : "skip"
  );

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setSearchQuery("");
      setFilterRole("all");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter users based on search and role
  const filteredUsers = availableUsers?.filter((user: any) => {
    // Role filter
    if (filterRole !== "all" && user.role !== filterRole) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = user.name?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      const idMatch = user.studentId?.toLowerCase().includes(searchLower) ||
                      user.teacherId?.toLowerCase().includes(searchLower);
      return nameMatch || emailMatch || idMatch;
    }
    
    return true;
  });

  const toggleUser = (userId: Id<"users">) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    await onAdd(selectedUsers);
    setSelectedUsers([]);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مشرف";
      case "teacher":
        return "معلم";
      case "student":
        return "طالب";
      case "parent":
        return "ولي أمر";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "teacher":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "student":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "parent":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              إضافة أعضاء
            </h2>
            <p className="text-sm text-gray-500">
              {selectedUsers.length} مستخدم مختار
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مستخدم..."
            className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Role Filter */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {["all", "student", "teacher", "parent", "admin"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role as any)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                filterRole === role
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {role === "all" ? "الكل" : getRoleLabel(role)}
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto max-h-75 space-y-1">
          {!availableUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Users size={32} className="mb-2" />
              <p className="text-sm">لا يوجد مستخدمين متاحين</p>
              <p className="text-xs">جميع المستخدمين موجودون بالفعل في المحادثة</p>
            </div>
          ) : (
            filteredUsers?.map((user: any) => (
              <button
                key={user._id}
                onClick={() => toggleUser(user._id)}
                className={`w-full px-3 py-2 text-right rounded-lg flex items-center justify-between transition-colors ${
                  selectedUsers.includes(user._id)
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name?.charAt(0) || "?"}
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      {user.gradeName && user.gradeName !== "غير محدد" && (
                        <span className="text-xs text-gray-400">{user.gradeName}</span>
                      )}
                      {user.studentId && (
                        <span className="text-xs text-gray-400">{user.studentId}</span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedUsers.includes(user._id) && (
                  <Check size={18} className="text-blue-600 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedUsers.length === 0 || isLoading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإضافة...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                إضافة {selectedUsers.length} مستخدم
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}