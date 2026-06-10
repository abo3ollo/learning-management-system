"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  Download,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddStudentModal } from "@/app/_components/AddStudentModal";

export default function AdminStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // ✅ استخدام المسار الصحيح api.user.students
  const studentsData = useQuery(api.user.students.getStudents, {
    status: selectedFilter !== "all" ? selectedFilter : undefined,
    search: searchQuery || undefined,
  });
  const pendingApprovals = useQuery(api.user.students.getPendingStudents);
  const studentsStats = useQuery(api.user.students.getStudentsStats);
  const deleteStudent = useMutation(api.user.students.deleteStudent);

  const students = studentsData || [];
  const isLoading = studentsData === undefined;

  const stats = [
    { label: "إجمالي الطلاب", value: studentsStats?.total || students.length, color: "bg-blue-500", icon: GraduationCap },
    { label: "بانتظار الموافقة", value: pendingApprovals?.length || 0, color: "bg-amber-500", icon: UserPlus },
    { label: "نشطون", value: studentsStats?.active || students.filter((s: any) => s.status === "active").length, color: "bg-green-500", icon: UserPlus },
  ];

  const handleDelete = async (studentId: string) => {
    if (!confirm("هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
    
    setDeletingId(studentId);
    try {
      await deleteStudent({ studentId: studentId as any });
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("حدث خطأ أثناء حذف الطالب");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h1>
          <p className="text-gray-500 mt-1">إدارة وتسجيل الطلاب في النظام</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة طالب
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                  <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث بالاسم، البريد الإلكتروني أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">جميع الطلاب</option>
              <option value="active">نشط</option>
              <option value="pending">بانتظار الموافقة</option>
              <option value="inactive">غير نشط</option>
            </select>
            <Button variant="outline" size="icon" onClick={() => setSelectedFilter("all")}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">الطالب</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">معلومات الاتصال</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">تاريخ الميلاد</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap className="h-12 w-12 text-gray-300" />
                      <p>لا يوجد طلاب</p>
                      <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 ml-1" />
                        إضافة أول طالب
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {student.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">ID: {student.studentId || student._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {student.email}
                        </p>
                        {student.phoneNumber && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {student.phoneNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.birthDate ? new Date(student.birthDate).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : student.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.status === 'active' ? 'نشط' : student.status === 'pending' ? 'بانتظار الموافقة' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/students/${student._id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => handleDelete(student._id)}
                          disabled={deletingId === student._id}
                        >
                          {deletingId === student._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}