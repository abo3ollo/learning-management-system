// app/_components/LinkParentStudentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    X,
    Users,
    CheckCircle,
    AlertCircle,
    Loader2,
    UserPlus,
    Trash2
} from "lucide-react";

interface LinkParentStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
}

export function LinkParentStudentModal({ isOpen, onClose, parentId }: LinkParentStudentModalProps) {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectedRelationship, setSelectedRelationship] = useState<string>("father");
    const [isPrimary, setIsPrimary] = useState(true);
    const [permissions, setPermissions] = useState({
        viewGrades: true,
        financialAccess: false,
        pickupNotification: false,
        emergencyContact: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ استخدام المسار الصحيح api.user.parents.getParentById
    const parentData = useQuery(api.user.parents.getParentById,
        parentId ? { parentId: parentId as any } : "skip"
    );


    const linkParentToStudent = useMutation(api.relationships.parentStudent.linkParentToStudent);
const unlinkParentFromStudent = useMutation(api.relationships.parentStudent.unlinkParentFromStudent);

    useEffect(() => {
        if (parentData?.children) {
            setSelectedStudents(parentData.children.map((c: any) => c._id));
        }
    }, [parentData]);

    if (!isOpen) return null;

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleUnlinkStudent = async (studentId: string, studentName: string) => {
        if (!confirm(`هل أنت متأكد من فك ربط الطالب "${studentName}"؟`)) return;

        try {
            await unlinkParentFromStudent({
                parentId: parentId as any,
                studentId: studentId as any,
            });
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        } catch (err) {
            console.error("Error unlinking student:", err);
            setError("حدث خطأ أثناء فك الربط");
        }
    };

    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            setError("يرجى اختيار طالب واحد على الأقل");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Link each selected student
            for (const studentId of selectedStudents) {
                const isAlreadyLinked = parentData?.children?.some((c: any) => c._id === studentId);

                if (!isAlreadyLinked) {
                    await linkParentToStudent({
                        parentId: parentId as any,
                        studentId: studentId as any,
                        relationship: selectedRelationship,
                        isPrimary,
                        permissions, // ✅ إضافة الصلاحيات
                    });
                }
            }

            onClose();
        } catch (err) {
            console.error("Error linking students:", err);
            setError("حدث خطأ أثناء ربط الطلاب");
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableStudents = parentData?.availableStudents || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#0a2540]">ربط أولياء الأمور بالطلاب</h2>
                        <p className="text-sm text-gray-500 mt-1">إنشاء ربط بين ولي أمر وطلاب مع تحديد الصلاحيات</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Parent Info */}
                    <div className="bg-[#f7fafa] rounded-xl p-4 border border-[#c0c8c9]">
                        <p className="text-sm text-gray-500">ولي الأمر</p>
                        <p className="font-semibold text-[#0a2540]">{parentData?.name}</p>
                        <p className="text-sm text-gray-500">{parentData?.email}</p>
                    </div>

                    {/* Permissions Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
                            الصلاحيات
                        </h3>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                    className="w-4 h-4 text-[#1a7a8a] rounded border-[#c0c8c9] focus:ring-[#1a7a8a]"
                                />
                                <div>
                                    <p className="font-medium text-[#0a2540]">جهة اتصال أساسية</p>
                                    <p className="text-xs text-gray-500">سيتم التواصل مع ولي الأمر هذا أولاً عند الحاجة</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.viewGrades}
                                    onChange={(e) => setPermissions({ ...permissions, viewGrades: e.target.checked })}
                                    className="w-4 h-4 text-[#1a7a8a] rounded border-[#c0c8c9] focus:ring-[#1a7a8a]"
                                />
                                <div>
                                    <p className="font-medium text-[#0a2540]">عرض الدرجات</p>
                                    <p className="text-xs text-gray-500">السماح لولي الأمر بالاطلاع على درجات ونتائج الطالب</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.financialAccess}
                                    onChange={(e) => setPermissions({ ...permissions, financialAccess: e.target.checked })}
                                    className="w-4 h-4 text-[#1a7a8a] rounded border-[#c0c8c9] focus:ring-[#1a7a8a]"
                                />
                                <div>
                                    <p className="font-medium text-[#0a2540]">الوصول المالي</p>
                                    <p className="text-xs text-gray-500">السماح لولي الأمر بالاطلاع على المعاملات المالية والرسوم</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.pickupNotification}
                                    onChange={(e) => setPermissions({ ...permissions, pickupNotification: e.target.checked })}
                                    className="w-4 h-4 text-[#1a7a8a] rounded border-[#c0c8c9] focus:ring-[#1a7a8a]"
                                />
                                <div>
                                    <p className="font-medium text-[#0a2540]">إشعار الاستلام</p>
                                    <p className="text-xs text-gray-500">السماح باستلام الطالب من المدرسة</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.emergencyContact}
                                    onChange={(e) => setPermissions({ ...permissions, emergencyContact: e.target.checked })}
                                    className="w-4 h-4 text-[#1a7a8a] rounded border-[#c0c8c9] focus:ring-[#1a7a8a]"
                                />
                                <div>
                                    <p className="font-medium text-[#0a2540]">جهة اتصال طوارئ</p>
                                    <p className="text-xs text-gray-500">الاتصال في حالات الطوارئ</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Relationship Type */}
                    <div>
                        <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
                            نوع العلاقة
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { value: "father", label: "أب" },
                                { value: "mother", label: "أم" },
                                { value: "brother", label: "أخ" },
                                { value: "sister", label: "أخت" },
                                { value: "grandfather", label: "جد" },
                                { value: "grandmother", label: "جدة" },
                                { value: "uncle", label: "عم/خال" },
                                { value: "guardian", label: "وصي" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setSelectedRelationship(option.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRelationship === option.value
                                        ? "bg-[#1a7a8a] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Students Selection */}
                    <div>
                        <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
                            الطلاب المرتبطين
                        </h3>

                        {/* Already linked students */}
                        {parentData?.children && parentData.children.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <p className="text-sm text-gray-500">الطلاب المرتبطين حالياً:</p>
                                {parentData.children.map((student: any) => (
                                    <div key={student._id} className="flex items-center justify-between bg-[#e0f5f7] p-3 rounded-lg">
                                        <div>
                                            <p className="font-medium text-[#0a2540]">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.relationship} - {student.isPrimary ? "أساسي" : "ثانوي"}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUnlinkStudent(student._id, student.name)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Available students to link */}
                        {availableStudents.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">إضافة طلاب:</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {availableStudents.map((student: any) => (
                                        <label key={student._id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student._id)}
                                                onChange={() => handleToggleStudent(student._id)}
                                                className="w-4 h-4 text-[#1a7a8a] rounded border-[#c0c8c9] focus:ring-[#1a7a8a]"
                                            />
                                            <div>
                                                <p className="font-medium text-[#0a2540]">{student.name}</p>
                                                <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableStudents.length === 0 && parentData?.children?.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>لا يوجد طلاب متاحين للربط</p>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || selectedStudents.length === 0}
                            className="min-w-30 bg-[#0a2540] hover:bg-[#1a7a8a]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                "حفظ الرابط"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}