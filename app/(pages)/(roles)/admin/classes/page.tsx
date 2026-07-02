// app/(pages)/(roles)/admin/classes/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Download,
  Loader2,
  Filter,
  GraduationCap,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  BookOpen,
  UserPlus,
  UserMinus,
  School,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddClassModal } from "@/app/_components/AddClassModal";
import { SiGoogleclassroom } from "react-icons/si";


export default function AdminClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const classesData = useQuery(api.classes.classes.getClasses, {
    status: selectedFilter !== "all" ? (selectedFilter as any) : undefined,
    academicYear: selectedYear !== "all" ? selectedYear : undefined,
    search: searchQuery || undefined,
  });
  console.log(classesData, "classesData");
  const classesStats = useQuery(api.classes.classes.getClassesStats);
  const deleteClass = useMutation(api.classes.classes.deleteClass);

  const classes = classesData || [];
  const isLoading = classesData === undefined;

  const academicYears = ["2026-2027", "2027-2028", "2028-2029", "2029-2030"];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "نشط", className: "bg-green-50 text-green-700 border border-green-200" };
      case "inactive":
        return { label: "غير نشط", className: "bg-gray-50 text-gray-600 border border-gray-200" };
      case "completed":
        return { label: "مكتمل", className: "bg-blue-50 text-blue-700 border border-blue-200" };
      default:
        return { label: "نشط", className: "bg-green-50 text-green-700 border border-green-200" };
    }
  };

  const stats = [
    {
      label: "إجمالي الفصول",
      value: classesStats?.total || classes.length,
      icon: SiGoogleclassroom,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      trend: "+0%",
      up: true,
    },
    {
      label: "فصول نشطة",
      value: classesStats?.active || classes.filter((c: any) => c.status === "active").length,
      icon: CheckCircle,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      trend: "+0%",
      up: true,
    },
    {
      label: "إجمالي الطلاب",
      value: classesStats?.totalStudents || classes.reduce((sum: number, c: any) => sum + (c.currentStudents || 0), 0),
      icon: Users,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      trend: "+0%",
      up: true,
    },
  ];

  const handleDelete = async (classId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفصل؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    setDeletingId(classId);
    try {
      await deleteClass({ classId: classId as any });
    } catch (error: any) {
      console.error("Error deleting class:", error);
      alert(error.message || "حدث خطأ أثناء حذف الفصل");
    } finally {
      setDeletingId(null);
    }
  };


  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const exportData = classes.map((cls: any) => ({
        "كود الفصل": cls.classCode,
        "الاسم (عربي)": cls.classNameAr,
        "الاسم (إنجليزي)": cls.classNameEn,
        "الصف": cls.grade,
        "الشعبة": cls.section,
        "مشرف الفصل": cls.supervisorName || "غير محدد",
        "عدد الطلاب": cls.currentStudents || 0,
        "الحد الأقصى": cls.maxStudents,
        "الموقع": cls.location || "",
        "العام الدراسي": cls.academicYear,
        "الحالة": cls.status === "active" ? "نشط" : cls.status === "completed" ? "مكتمل" : "غير نشط",
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(","),
        ...exportData.map((row: Record<string, unknown>) =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `classes_${new Date().toISOString().slice(0, 19)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("فشل تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-[#001f24]">إدارة الفصول</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={handleExportCSV}
            disabled={isExporting || classes.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "جاري التصدير..." : "تصدير CSV"}
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4" />
            إضافة فصل
          </Button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold text-[#001f24]">إدارة الفصول الدراسية</h2>
          <p className="text-gray-500 mt-1 text-sm">
            عرض وإضافة وإدارة جميع الفصول الدراسية
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.up ? "text-green-600" : "text-red-500"
                    }`}>
                    {stat.trend} {stat.up ? "↗" : "↘"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#001f24]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search + filter */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث باسم الفصل أو كود الفصل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200 focus-visible:ring-[#03363d]/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
            >
              <option value="all">جميع السنوات</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
            >
              <option value="all">جميع الفصول</option>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="inactive">غير نشط</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSelectedFilter("all"); setSelectedYear("all"); setSearchQuery(""); }}
              className="border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#f7fafa]">
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الفصل</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الصف / الشعبة</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">مشرف الفصل</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الطلاب</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">المعلمون</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">المواد</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">العام الدراسي</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الحالة</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#001f24]" />
                    </td>
                  </tr>
                ) : classes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <SiGoogleclassroom className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-gray-500 font-medium">لا توجد فصول دراسية</p>
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          إضافة فصل
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classes.map((cls: any) => {
                    const statusBadge = getStatusBadge(cls.status);
                    return (
                      <tr key={cls._id} className="hover:bg-[#f7fafa] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <SiGoogleclassroom className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#001f24] text-sm">{cls.classNameAr}</p>
                              <p className="text-xs text-gray-400 font-mono">{cls.classCode}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">{cls.grade}</p>
                            <p className="text-xs text-gray-400">شعبة {cls.section}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {cls.supervisorName || "غير محدد"}
                            </span>
                          </div>
                          {cls.location && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cls.location}
                            </p>
                          )}
                        </td>

                        {/* زر إدارة الطلاب */}
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-1.5 text-[#1a7a8a] "
                            title="إدارة الطلاب"
                          >
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-semibold">{cls.currentStudents || 0}</span>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">طالب</span>
                          </div>
                        </td>

                        {/* زر إدارة المعلمين */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[#1a7a8a]">
                            <School className="h-4 w-4" />
                            <span className="text-sm font-semibold">{cls.teachers?.length || 0}</span>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">معلم</span>
                          </div>
                        </td>

                        {/* ✅ عدد المواد */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[#1a7a8a]">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-sm font-semibold">{cls.subjectsCount || 0}</span>
                            <span className="text-xs text-gray-400">مادة</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">{cls.academicYear}</span>
                          </div>
                        </td>                

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/classes/${cls._id}`}>
                              <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors group">
                                <Edit className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                              </button>
                            </Link>
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                              onClick={() => handleDelete(cls._id)}
                              disabled={deletingId === cls._id}
                            >
                              {deletingId === cls._id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {classes.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400 text-right">
                عرض <span className="font-semibold text-[#001f24]">{classes.length}</span> من{" "}
                <span className="font-semibold text-[#001f24]">{classes.length}</span> فصل
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddClassModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}