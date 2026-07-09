// app/(pages)/(roles)/admin/grades/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  School,
  Users,
  Layers,
  Edit,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { AddGradeModal } from "@/app/_components/Admin/AddGradeModal";


function GradeCard({ grade }: { grade: any }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{grade.name}</CardTitle>
            <p className="text-sm text-gray-500">{grade.nameEn}</p>
          </div>
          <Badge
            className={
              grade.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }
          >
            {grade.status === "active" ? "نشط" : "غير نشط"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <School className="h-4 w-4 text-[#1a7a8a]" />
            <span>المستوى: {grade.gradeLevel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Layers className="h-4 w-4 text-[#1a7a8a]" />
            <span>{grade.groupsCount || 0} مجموعات</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">
              الحد الأقصى: {grade.maxGroups || "غير محدد"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-[#1a7a8a]" />
            <span>{grade.studentsCount || 0} طالب</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-[#1a7a8a]" />
            <span>{grade.academicYear}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Link href={`/admin/grades/${grade._id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full gap-1">
                <Eye className="h-4 w-4" />
                عرض التفاصيل
              </Button>
            </Link>
            <Link href={`/admin/grades/${grade._id}/groups`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full gap-1">
                <Layers className="h-4 w-4" />
                المجموعات
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGradesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const grades = useQuery(api.grades.grades.getGrades, {
    search: searchQuery || undefined,
  });

  if (grades === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const filteredGrades = grades.filter((g: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      g.name?.toLowerCase().includes(search) ||
      g.nameEn?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            الصفوف الدراسية
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة الصفوف والمستويات الدراسية
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة صف جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي الصفوف</p>
              <p className="text-2xl font-bold">{grades.length}</p>
            </div>
            <School className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">صفوف نشطة</p>
              <p className="text-2xl font-bold text-green-500">
                {grades.filter((g: any) => g.status === "active").length}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي المجموعات</p>
              <p className="text-2xl font-bold text-[#1a7a8a]">
                {grades.reduce((acc: number, g: any) => acc + (g.groupsCount || 0), 0)}
              </p>
            </div>
            <Layers className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="بحث عن صف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Grades Grid */}
      {filteredGrades.length === 0 ? (
        <Card className="p-12 text-center">
          <School className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">لا توجد صفوف</h3>
          <p className="text-gray-400">
            {searchQuery ? "لا توجد نتائج تطابق بحثك" : "قم بإضافة صف جديد"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة صف جديد
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGrades.map((grade: any) => (
            <GradeCard key={grade._id} grade={grade} />
          ))}
        </div>
      )}

      <AddGradeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh data
        }}
      />
    </div>
  );
}