// app/(pages)/(roles)/teacher/aptitude/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  FileText,
  Video,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Filter,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddMaterialModal } from "@/app/_components/Teacher/AddMaterialModal";
import { AptitudeCoursePriceModal } from "@/app/_components/Teacher/AptitudeCoursePriceModal";



export default function TeacherMaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCoursePriceModalOpen, setIsCoursePriceModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);


  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const materials = useQuery(
  api.teacherMaterials.teacherMaterials.getTeacherMaterials,
  currentUser?._id ? { teacherId: currentUser._id as any } : "skip"
);

  const deleteMaterial = useMutation(api.teacherMaterials.teacherMaterials.deleteMaterial);
  const updateMaterial = useMutation(api.teacherMaterials.teacherMaterials.updateMaterial);

  if (!currentUser || materials === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const filteredMaterials = materials.filter((m: any) => {
    const matchesSearch = m.title.includes(searchQuery) || m.titleAr.includes(searchQuery);
    const matchesType = selectedType === "all" || m.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "video": return Video;
      case "exam": return BookOpen;
      case "assignment": return CheckCircle;
      case "revision": return Eye;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: "ملفات PDF",
      video: "فيديوهات",
      exam: "امتحانات",
      assignment: "واجبات",
      revision: "مراجعات",
    };
    return labels[type] || type;
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) return;
    try {
      await deleteMaterial({ materialId: materialId as any });
    } catch (error) {
      alert("حدث خطأ أثناء حذف المادة");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold text-[#001f24]">موادي التعليمية</h1>
          <p className="text-sm text-gray-500">إدارة المواد التعليمية الخاصة بك</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ زر سعر الكورس */}
          <Button
            onClick={() => setIsCoursePriceModalOpen(true)}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 gap-2"
          >
            <DollarSign className="h-4 w-4" />
            {currentUser?.aptitudeCoursePrice ? (
              <span>{currentUser.aptitudeCoursePrice} {currentUser.aptitudeCourseCurrency || "EGP"}</span>
            ) : (
              "تحديد سعر الكورس"
            )}
          </Button>

          <Button
            onClick={() => {
              setEditingMaterial(null);
              setIsAddModalOpen(true);
            }}
            className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة مادة
          </Button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث عن مادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="all">جميع المواد</option>
            <option value="pdf">ملفات PDF</option>
            <option value="video">فيديوهات</option>
            <option value="exam">امتحانات</option>
            <option value="assignment">واجبات</option>
            <option value="revision">مراجعات</option>
          </select>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد مواد تعليمية</p>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول مادة
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material: any) => {
              const Icon = getTypeIcon(material.type);
              return (
                <Card key={material._id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#1a7a8a]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#001f24]">
                            {material.title || material.titleAr}
                          </h3>
                          <p className="text-xs text-gray-500">{material.subject}</p>
                        </div>
                      </div>
                      <Badge className={material.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {material.isPublished ? "منشور" : "غير منشور"}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{getTypeLabel(material.type)}</span>
                        <span>•</span>
                        <span>{material.grade}</span>
                      </div>
                      {material.fileSize && (
                        <p className="text-sm text-gray-400">حجم الملف: {material.fileSize}</p>
                      )}
                      {material.duration && (
                        <p className="text-sm text-gray-400">المدة: {material.duration}</p>
                      )}
                      {material.deadline && (
                        <p className="text-sm text-gray-400">
                          تاريخ التسليم: {new Date(material.deadline).toLocaleDateString("ar-EG")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingMaterial(material);
                          setIsAddModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(material._id)}
                      >
                        <Trash2 className="h-4 w-4 ml-1 text-red-500" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Material Modal */}
      <AddMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMaterial(null);
        }}
        teacherId={currentUser._id}
        editingMaterial={editingMaterial}
      />


      <AptitudeCoursePriceModal
        isOpen={isCoursePriceModalOpen}
        onClose={() => setIsCoursePriceModalOpen(false)}
        teacherId={currentUser?._id}
        initialPrice={currentUser?.aptitudeCoursePrice || 0}
        initialCurrency={currentUser?.aptitudeCourseCurrency || "EGP"}
        teacherName={currentUser?.name}
      />
    </div>
  );
}