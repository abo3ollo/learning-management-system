// app/(pages)/(roles)/admin/teachers/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Users,
  Download,
  Loader2,
  Filter,
  Briefcase,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddTeacherModal } from "@/app/_components/AddTeacherModal";

export default function AdminTeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const teachersData = useQuery(api.user.teachers.getTeachers, {
    status: selectedFilter !== "all" ? selectedFilter : undefined,
    search: searchQuery || undefined,
  });
  const teachersStats = useQuery(api.user.teachers.getTeachersStats);
  const deleteTeacher = useMutation(api.user.teachers.deleteTeacher);

  const teachers = teachersData || [];
  const isLoading = teachersData === undefined;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "نشط", icon: CheckCircle, className: "bg-green-50 text-green-700 border border-green-200" };
      case "inactive":
        return { label: "غير نشط", icon: XCircle, className: "bg-gray-50 text-gray-600 border border-gray-200" };
      case "on_leave":
        return { label: "في إجازة", icon: Clock, className: "bg-amber-50 text-amber-700 border border-amber-200" };
      default:
        return { label: "نشط", icon: CheckCircle, className: "bg-green-50 text-green-700 border border-green-200" };
    }
  };

  const stats = [
    {
      label: "إجمالي المعلمين",
      value: teachersStats?.total || teachers.length,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      trend: "+0%",
      up: true,
    },
    {
      label: "نشطون",
      value: teachersStats?.active || teachers.filter((t: any) => t.status === "active").length,
      icon: CheckCircle,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      trend: "+0%",
      up: true,
    },
    {
      label: "في إجازة",
      value: teachersStats?.onLeave || teachers.filter((t: any) => t.status === "on_leave").length,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      trend: "+0%",
      up: true,
    },
  ];

  const handleDelete = async (teacherId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المعلم؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setDeletingId(teacherId);
    try {
      await deleteTeacher({ teacherId: teacherId as any });
    } catch (error: any) {
      console.error("Error deleting teacher:", error);
      alert(error.message || "حدث خطأ أثناء حذف المعلم");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const exportData = teachers.map((teacher: any) => ({
        "ID": teacher.teacherId || teacher._id.slice(-6),
        "الاسم": teacher.name,
        "البريد الإلكتروني": teacher.email,
        "رقم الهاتف": teacher.phoneNumber || "",
        "التخصص": teacher.specialization || "",
        "المؤهل": teacher.qualification || "",
        "الخبرة": teacher.experience ? `${teacher.experience} سنوات` : "",
        "الحالة": teacher.status === "active" ? "نشط" : teacher.status === "on_leave" ? "في إجازة" : "غير نشط",
        "عدد المواد": teacher.courseCount || 0,
        "تاريخ التسجيل": new Date(teacher.createdAt).toLocaleDateString("ar-EG"),
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(","),
        ...exportData.map(row => 
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
      link.setAttribute("download", `teachers_${new Date().toISOString().slice(0, 19)}.csv`);
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
    <div className="min-h-screen bg-[#f7fafa]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-[#001f24]">إدارة المعلمين</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={handleExportCSV}
            disabled={isExporting || teachers.length === 0}
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
            إضافة معلم
          </Button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold text-[#001f24]">إدارة المعلمين</h2>
          <p className="text-gray-500 mt-1 text-sm">
            عرض وإضافة وإدارة جميع المعلمين
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
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.up ? "text-green-600" : "text-red-500"
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
              placeholder="بحث بالاسم، البريد الإلكتروني أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200 focus-visible:ring-[#03363d]/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
            >
              <option value="all">جميع المعلمين</option>
              <option value="active">نشط</option>
              <option value="on_leave">في إجازة</option>
              <option value="inactive">غير نشط</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSelectedFilter("all"); setSearchQuery(""); }}
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">المعلم</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">معلومات الاتصال</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">التخصص</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">المواد</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الحالة</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#001f24]" />
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <Users className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-gray-500 font-medium">لا يوجد معلمين</p>
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          إضافة معلم
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher: any) => {
                    const statusBadge = getStatusBadge(teacher.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <tr key={teacher._id} className="hover:bg-[#f7fafa] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <span className="text-blue-600 font-bold text-sm">
                                {teacher.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#001f24] text-sm">{teacher.name}</p>
                              <p className="text-xs text-gray-400 font-mono">
                                #{teacher.teacherId || teacher._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                         </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              {teacher.email}
                            </p>
                            {teacher.phoneNumber && (
                              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {teacher.phoneNumber}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {teacher.specialization || "—"}
                            </span>
                          </div>
                          {teacher.qualification && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {teacher.qualification}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-[#001f24]">{teacher.courseCount || 0}</span>
                            <span className="text-xs text-gray-400">مواد</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/teachers/${teacher._id}`}>
                              <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors group">
                                <Edit className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                              </button>
                            </Link>
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                              onClick={() => handleDelete(teacher._id)}
                              disabled={deletingId === teacher._id}
                            >
                              {deletingId === teacher._id ? (
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
          {teachers.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400 text-right">
                عرض <span className="font-semibold text-[#001f24]">{teachers.length}</span> من{" "}
                <span className="font-semibold text-[#001f24]">{teachers.length}</span> معلم
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Teacher Modal */}
      <AddTeacherModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}