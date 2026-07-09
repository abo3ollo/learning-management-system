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
  Filter,
  X,
  GraduationCap,
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
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ جلب بيانات المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب المجموعات الخاصة بالطالب
  const groups = useQuery(
    api.groups.groups.getStudentGroups,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // ✅ جلب الواجبات
  const assignments = useQuery(api.assignments.assignments.getStudentAssignments, {
    status: statusFilter as any,
    groupId: groupFilter !== "all" ? (groupFilter as any) : undefined,
    sortBy: sortBy as any,
  });

  const stats = useQuery(api.assignments.assignments.getStudentAssignmentStats);

  // حالة التحميل
  if (currentUser === undefined || assignments === undefined || stats === undefined || groups === undefined) {
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

  // ✅ دوال الترجمة
  const getStatusLabel = (value: string) => {
    const map: Record<string, string> = {
      all: "جميع الحالات",
      pending: "في الانتظار",
      submitted: "مسلم",
      graded: "تم التصحيح",
    };
    return map[value] || value;
  };

  const getSortLabel = (value: string) => {
    const map: Record<string, string> = {
      dueDate: "تاريخ التسليم",
      createdAt: "تاريخ الإنشاء",
    };
    return map[value] || value;
  };

  // ✅ فلترة البحث
  const filteredAssignments = assignments.filter((assignment: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      assignment.title?.toLowerCase().includes(search) ||
      assignment.description?.toLowerCase().includes(search) ||
      assignment.gradeName?.toLowerCase().includes(search) ||
      assignment.groupNames?.some((g: string) => g.toLowerCase().includes(search))
    );
  });

  // ✅ دوال التعامل مع تغيير القيم
  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value || "all");
  };

  const handleGroupChange = (value: string | null) => {
    setGroupFilter(value || "all");
  };

  const handleSortChange = (value: string | null) => {
    setSortBy(value || "dueDate");
  };

  // ✅ إعادة ضبط الفلاتر
  const resetFilters = () => {
    setStatusFilter("all");
    setGroupFilter("all");
    setSortBy("dueDate");
    setSearchTerm("");
  };

  // ✅ عدد الفلاتر النشطة
  const activeFiltersCount = [
    statusFilter !== "all",
    groupFilter !== "all",
    sortBy !== "dueDate",
    searchTerm !== "",
  ].filter(Boolean).length;

  // ✅ الحصول على اسم المجموعة من المعرفات
  const getGroupName = (groupId: string) => {
    const group = groups?.find((g: any) => g._id === groupId);
    return group?.name || "مجموعة غير معروفة";
  };

  // ✅ فلترة الواجبات حسب المجموعة
  const getFilteredAssignments = () => {
    if (groupFilter === "all") {
      return filteredAssignments;
    }
    return filteredAssignments.filter((assignment: any) =>
      assignment.groupIds?.includes(groupFilter)
    );
  };

  const displayAssignments = getFilteredAssignments();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* ✅ Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">واجباتي</h1>
          <p className="text-sm text-gray-500 mt-1">جميع الواجبات الخاصة بك وحالة التسليم</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث في الواجبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden relative"
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1a7a8a] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ✅ الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">الكل</p>
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">في الانتظار</p>
              <p className="text-xl md:text-2xl font-bold text-amber-500">{stats.pending}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">مسلم</p>
              <p className="text-xl md:text-2xl font-bold text-blue-500">{stats.submitted}</p>
            </div>
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">تم التصحيح</p>
              <p className="text-xl md:text-2xl font-bold text-green-500">{stats.graded}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* ✅ المتوسط */}
      {stats.graded > 0 && (
        <Card className="bg-linear-to-r from-[#001f24] to-[#03363d] text-white">
          <CardContent className="p-3 md:p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-[#a3ced6]">متوسط الدرجات</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.averageGrade}%</p>
            </div>
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-[#a3ced6]" />
          </CardContent>
        </Card>
      )}

      {/* ✅ الفلاتر - تصميم محسن */}
      <div className={`bg-white rounded-lg border border-gray-200 p-4 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* صف الفلاتر الرئيسي */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* فلتر الحالة */}
          <div className="flex-1 min-w-37.5">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="جميع الحالات">
                  {getStatusLabel(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="submitted">مسلم</SelectItem>
                <SelectItem value="graded">تم التصحيح</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ فلتر المجموعة */}
          <div className="flex-1 min-w-37.5">
            <Select value={groupFilter} onValueChange={handleGroupChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="جميع المجموعات">
                  {groupFilter !== "all" 
                    ? getGroupName(groupFilter)
                    : "جميع المجموعات"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المجموعات</SelectItem>
                {groups?.map((group: any) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* فلتر الترتيب */}
          <div className="flex-1 min-w-37.5">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="ترتيب حسب">
                  {getSortLabel(sortBy)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">تاريخ التسليم</SelectItem>
                <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <X className="h-4 w-4" />
            إعادة ضبط
            {activeFiltersCount > 0 && (
              <span className="bg-[#1a7a8a] text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* ✅ الفلاتر النشطة - عرض سريع */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">الفلاتر النشطة:</span>
            {statusFilter !== "all" && (
              <Badge className="bg-[#e0f5f7] text-[#1a7a8a]">
                الحالة: {getStatusLabel(statusFilter)}
              </Badge>
            )}
            {groupFilter !== "all" && (
              <Badge className="bg-[#e0f5f7] text-[#1a7a8a]">
                المجموعة: {getGroupName(groupFilter)}
              </Badge>
            )}
            {sortBy !== "dueDate" && (
              <Badge className="bg-[#e0f5f7] text-[#1a7a8a]">
                الترتيب: {getSortLabel(sortBy)}
              </Badge>
            )}
            {searchTerm && (
              <Badge className="bg-[#e0f5f7] text-[#1a7a8a]">
                بحث: "{searchTerm}"
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ✅ عدد النتائج */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>عرض {displayAssignments.length} واجب</span>
        {activeFiltersCount > 0 && (
          <span className="text-xs text-gray-400">
            {activeFiltersCount} فلتر نشط
          </span>
        )}
      </div>

      {/* ✅ قائمة الواجبات */}
      {displayAssignments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">لا توجد واجبات</h3>
          <p className="text-gray-400">
            {searchTerm ? "لا توجد نتائج تطابق بحثك" : "لم يتم العثور على أي واجبات"}
          </p>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="mt-4"
            >
              إزالة جميع الفلاتر
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayAssignments.map((assignment: any) => (
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
                {/* الصف */}
                {assignment.gradeName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span className="truncate">{assignment.gradeName}</span>
                  </div>
                )}

                {/* المجموعة */}
                {assignment.groupNames && assignment.groupNames.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span className="truncate">
                      {assignment.groupNames.join(", ")}
                    </span>
                  </div>
                )}

                {/* المادة من المجموعة الأولى */}
                {assignment.groups && assignment.groups.length > 0 && assignment.groups[0]?.subject && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 text-[#1a7a8a] shrink-0" />
                    <span className="truncate">{assignment.groups[0].subject}</span>
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
                  <Button variant="outline" className="w-full mt-2 hover:bg-[#e0f5f7] hover:border-[#1a7a8a] transition-colors">
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