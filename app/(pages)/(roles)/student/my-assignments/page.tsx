// app/(pages)/(roles)/student/my-assignments/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ✅ مكونات مخصصة
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 pb-0 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export default function MyAssignmentsPage() {
  // ✅ State للفلاتر
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ✅ جلب البيانات - استخدام المسار الصحيح للـ courses
  const courses = useQuery(api.courses.courses.getStudentCourses, {}); 
  console.log(courses);
  
  const assignments = useQuery(api.assignments.assignments.getStudentAssignments, {
    status: statusFilter as any,
    subjectId: subjectFilter !== "all" ? subjectFilter as any : undefined,
    sortBy: sortBy as any,
  });

  const stats = useQuery(api.assignments.assignments.getStudentAssignmentStats);

  // حالة التحميل
  if (assignments === undefined || stats === undefined || courses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ دوال مساعدة
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-green-100 text-green-700">تم التصحيح</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-700">مسلم</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">في الانتظار</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">غير معروف</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "submitted":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // ✅ فلترة البحث
  const filteredAssignments = assignments.filter((assignment: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      assignment.title?.toLowerCase().includes(search) ||
      assignment.description?.toLowerCase().includes(search) ||
      assignment.course?.title?.toLowerCase().includes(search)
    );
  });

  // ✅ دوال التعامل مع تغيير القيم - تدعم string | null
  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value || "all");
  };

  const handleSubjectChange = (value: string | null) => {
    setSubjectFilter(value || "all");
  };

  const handleSortChange = (value: string | null) => {
    setSortBy(value || "dueDate");
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* ✅ Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#001f24]">واجباتي</h1>
          <p className="text-gray-500 mt-1">جميع الواجبات الخاصة بك وحالة التسليم</p>
        </div>
      </div>

      {/* ✅ الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">الكل</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">في الانتظار</p>
              <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">مسلم</p>
              <p className="text-2xl font-bold text-blue-500">{stats.submitted}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">تم التصحيح</p>
              <p className="text-2xl font-bold text-green-500">{stats.graded}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* ✅ المتوسط */}
      {stats.graded > 0 && (
        <Card className="bg-linear-to-r from-[#001f24] to-[#03363d] text-white">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-[#a3ced6]">متوسط الدرجات</p>
              <p className="text-3xl font-bold">{stats.averageGrade}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[#a3ced6]" />
          </CardContent>
        </Card>
      )}

      {/* ✅ الفلاتر والبحث */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* بحث */}
        <div className="flex-1 min-w-50 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث في الواجبات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex-1 min-w-37.5">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="submitted">مسلم</SelectItem>
              <SelectItem value="graded">تم التصحيح</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-37.5">
          <Select value={subjectFilter} onValueChange={handleSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="المادة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {courses?.map((course: any) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-37.5">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">تاريخ التسليم</SelectItem>
              <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ✅ قائمة الواجبات */}
      {filteredAssignments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">لا توجد واجبات</h3>
          <p className="text-gray-400">
            {searchTerm ? "لا توجد نتائج تطابق بحثك" : "لم يتم العثور على أي واجبات"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment: any) => (
            <Card key={assignment._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2 flex-1">
                    {assignment.title}
                  </CardTitle>
                  {getStatusBadge(assignment.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* المادة */}
                {assignment.course && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span className="truncate">{assignment.course.title}</span>
                  </div>
                )}

                {/* الفصول */}
                {assignment.classes && assignment.classes.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span className="truncate">
                      {assignment.classes.map((c: any) => c.classNameAr).join(", ")}
                    </span>
                  </div>
                )}

                {/* التاريخ */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                  <span>
                    {format(new Date(assignment.dueDate), "dd MMMM yyyy", { locale: ar })}
                  </span>
                </div>

                {/* حالة التسليم */}
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(assignment.status)}
                  <span className="text-gray-600">
                    {assignment.status === "graded" && `الدرجة: ${assignment.submission?.grade || 0}`}
                    {assignment.status === "submitted" && "تم التسليم"}
                    {assignment.status === "pending" && "في انتظار التسليم"}
                  </span>
                </div>

                {/* تأخير */}
                {assignment.isLate && (
                  <div className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    متأخر
                  </div>
                )}

                {/* زر التفاصيل */}
                <Link href={`/student/my-assignments/${assignment._id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    عرض التفاصيل
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}