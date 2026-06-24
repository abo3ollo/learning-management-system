// app/_components/ClassSubjectsTab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  GripVertical,
  Clock,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClassSubjectsTabProps {
  classId: string;
}

export function ClassSubjectsTab({ classId }: ClassSubjectsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // جلب مواد الفصل
  const classSubjects = useQuery(api.classes.classSubjects.getClassSubjects, {
    classId: classId as any,
  });

  const stats = useQuery(api.classes.classSubjects.getClassSubjectsStats, {
    classId: classId as any,
  });

  const removeSubject = useMutation(api.classes.classSubjects.removeSubjectFromClass);
  const updateSubject = useMutation(api.classes.classSubjects.updateClassSubject);

  const isLoading = classSubjects === undefined;

  const handleRemove = async (classSubjectId: string, subjectName: string) => {
    if (!confirm(`هل أنت متأكد من إزالة المادة "${subjectName}" من هذا الفصل؟`)) return;
    try {
      await removeSubject({ classSubjectId: classSubjectId as any });
    } catch (error) {
      console.error("Error removing subject:", error);
      alert("حدث خطأ أثناء إزالة المادة");
    }
  };

  const handleToggleStatus = async (classSubjectId: string, currentStatus: string) => {
    try {
      await updateSubject({
        classSubjectId: classSubjectId as any,
        status: currentStatus === "active" ? "inactive" : "active",
      });
    } catch (error) {
      console.error("Error updating subject status:", error);
      alert("حدث خطأ أثناء تحديث حالة المادة");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#001f24]">مواد الفصل الدراسي</h3>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المواد الدراسية المقدمة في هذا الفصل
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {stats?.total || 0} مادة • {stats?.active || 0} نشطة
          </span>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مادة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#001f24]">{stats?.total || 0}</p>
              <p className="text-xs text-gray-500">إجمالي المواد</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#001f24]">{stats?.active || 0}</p>
              <p className="text-xs text-gray-500">مواد نشطة</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#001f24]">{stats?.inactive || 0}</p>
              <p className="text-xs text-gray-500">مواد غير نشطة</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Subjects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
        </div>
      ) : classSubjects?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#c0c8c9] border-dashed">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">لا توجد مواد دراسية في هذا الفصل</p>
          <p className="text-sm text-gray-400 mt-1">أضف مواد للفصل لتظهر هنا</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة أول مادة
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 w-12">#</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المادة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المعلم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {classSubjects?.map((cs: any) => (
                  <tr key={cs._id} className="hover:bg-[#f7fafa] transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">
                      <GripVertical className="h-4 w-4 text-gray-300 mx-auto cursor-move" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#e0f5f7] flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-[#1a7a8a]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#001f24] text-sm">{cs.subjectName}</p>
                          <p className="text-xs text-gray-400">{cs.subjectDescription || "لا يوجد وصف"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-xs">
                            {cs.teacherName?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{cs.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(cs._id, cs.status)}
                        className={`px-2.5 py-1 text-xs rounded-full flex items-center gap-1 ${
                          cs.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cs.status === "active" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {cs.status === "active" ? "نشط" : "غير نشط"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingId(cs._id)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleRemove(cs._id, cs.subjectName)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="إزالة"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      <AddSubjectToClassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        classId={classId}
      />

      {/* Edit Subject Modal */}
      {editingId && (
        <EditClassSubjectModal
          isOpen={!!editingId}
          onClose={() => setEditingId(null)}
          classSubjectId={editingId}
        />
      )}
    </div>
  );
}

// ============================================
// Add Subject Modal
// ============================================
function AddSubjectToClassModal({ isOpen, onClose, classId }: { isOpen: boolean; onClose: () => void; classId: string }) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSubjects = useQuery(api.classes.classSubjects.getAvailableSubjects, {
    classId: classId as any,
  });

  const availableTeachers = useQuery(
  api.classes.classSubjects.getAvailableTeachersForSubject,
  selectedSubject ? {
    subjectId: selectedSubject as any,
    classId: classId as any,
  } : "skip"
);

  const addSubject = useMutation(api.classes.classSubjects.addSubjectToClass);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedTeacher) {
      setError("يرجى اختيار المادة والمعلم");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addSubject({
        classId: classId as any,
        subjectId: selectedSubject as any,
        teacherId: selectedTeacher as any,
        status: "active",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إضافة المادة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#001f24]">إضافة مادة للفصل</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>المادة <span className="text-red-500">*</span></Label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTeacher("");
              }}
              className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
            >
              <option value="">اختر المادة</option>
              {availableSubjects?.map((s: any) => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))}
            </select>
            {availableSubjects?.length === 0 && (
              <p className="text-xs text-amber-600">لا توجد مواد متاحة للإضافة</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>المعلم <span className="text-red-500">*</span></Label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              disabled={!selectedSubject}
            >
              <option value="">اختر المعلم</option>
              {availableTeachers?.map((t: any) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            {selectedSubject && availableTeachers?.length === 0 && (
              <p className="text-xs text-amber-600">لا يوجد معلمين متاحين</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedSubject || !selectedTeacher}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Edit Subject Modal
// ============================================
function EditClassSubjectModal({ isOpen, onClose, classSubjectId }: { isOpen: boolean; onClose: () => void; classSubjectId: string }) {
  const classSubject = useQuery(api.classes.classSubjects.getClassSubjectById, {
    classSubjectId: classSubjectId as any,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSubject = useMutation(api.classes.classSubjects.updateClassSubject);

  if (!isOpen || !classSubject) return null;

  // ... Similar to Add modal with edit functionality
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Edit modal content */}
    </div>
  );
}