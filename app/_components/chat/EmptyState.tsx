// app/admin/chatbox/components/EmptyState.tsx

"use client";

import { MessageSquare, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateChat: () => void;
}

export function EmptyState({ onCreateChat }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4">
      <MessageSquare size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
      <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
        اختر محادثة للبدء
      </h2>
      <p className="text-sm text-gray-400 mt-1">
        أو قم بإنشاء محادثة جديدة باستخدام الزر الموجود في الأعلى
      </p>
      <button
        onClick={onCreateChat}
        className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        إنشاء محادثة جديدة
      </button>
    </div>
  );
}