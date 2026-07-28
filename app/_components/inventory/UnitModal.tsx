"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string }) => Promise<void>;
  initialData?: any;
}

export function UnitModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: UnitModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim() });
      setName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "تعديل وحدة" : "إضافة وحدة جديدة"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              اسم الوحدة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كجم، متر، قطعة"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
              autoFocus
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                initialData ? "تحديث" : "إضافة"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}