// app/_components/AddScheduleModal.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  academicYear: string;
  term: "first" | "second";
  scheduleId?: string;
}

export function AddScheduleModal({
  isOpen,
  onClose,
  classId,
  academicYear,
  term,
  scheduleId,
}: AddScheduleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // بيانات الجدول (سيتم إضافة منطق إنشاء الجدول هنا)
  // هذا مجرد هيكل - يمكن إضافة واجهة كاملة لإنشاء الجدول

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#001f24]">
              {scheduleId ? "تعديل الجدول" : "إنشاء جدول جديد"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {academicYear} - {term === "first" ? "الفصل الأول" : "الفصل الثاني"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-500 text-center py-12">
            سيتم إضافة واجهة إنشاء الجدول هنا قريباً
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button className="bg-[#001f24] hover:bg-[#03363d] text-white">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
          </Button>
        </div>
      </div>
    </div>
  );
}