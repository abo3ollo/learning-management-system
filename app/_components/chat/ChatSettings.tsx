// app/admin/chatbox/components/ChatSettings.tsx

"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Crown, UserCog, UserMinus, X, Shield } from "lucide-react";

interface ChatSettingsProps {
  participants: any[];
  chatCreatorId: Id<"users">;
  currentUserId: Id<"users">;
  isAdmin: boolean;
  onKickMember: (userId: Id<"users">) => void;
  onChangeRole: (userId: Id<"users">, role: "admin" | "member") => void;
  onClose: () => void;
}

export function ChatSettings({
  participants,
  chatCreatorId,
  currentUserId,
  isAdmin,
  onKickMember,
  onChangeRole,
  onClose,
}: ChatSettingsProps) {
  const activeParticipants = participants.filter((p) => p.status === "active");

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "مدير" : "عضو";
  };

  const getRoleColor = (role: string) => {
    return role === "admin" ? "text-yellow-500" : "text-gray-500";
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield size={18} />
          إدارة الأعضاء
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1">
        {activeParticipants.map((participant: any) => {
          const isCreator = participant.userId === chatCreatorId;
          const isSelf = participant.userId === currentUserId;
          const canManage = isAdmin && !isCreator && !isSelf;

          return (
            <div
              key={participant._id}
              className="flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {participant.user?.name?.charAt(0) || "?"}
                </div>
                <div className="text-right min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {participant.user?.name}
                    {isCreator && (
                      <span className="text-xs text-yellow-500 mr-1">(منشئ)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.user?.role === "admin" && "مشرف"}
                    {participant.user?.role === "teacher" && "معلم"}
                    {participant.user?.role === "student" && "طالب"}
                    {participant.user?.role === "parent" && "ولي أمر"}
                    <span className="mx-1">•</span>
                    <span className={getRoleColor(participant.role)}>
                      {getRoleLabel(participant.role)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Change Role */}
                  <button
                    onClick={() =>
                      onChangeRole(
                        participant.userId,
                        participant.role === "admin" ? "member" : "admin"
                      )
                    }
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title={
                      participant.role === "admin"
                        ? "إزالة صلاحيات المدير"
                        : "جعله مدير"
                    }
                  >
                    <UserCog size={16} />
                  </button>

                  {/* Kick */}
                  <button
                    onClick={() => onKickMember(participant.userId)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
                    title="طرد العضو"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              )}

              {/* Role Badge */}
              {!canManage && participant.role === "admin" && (
                <Crown size={16} className="text-yellow-500 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <p>إجمالي الأعضاء: {activeParticipants.length}</p>
        <p>المدراء: {activeParticipants.filter((p: any) => p.role === "admin").length}</p>
      </div>
    </div>
  );
}