"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users, BookOpen, CreditCard, Award,
  GraduationCap, Calendar, CheckCircle,
  AlertCircle, Loader2, Phone, Mail,
  FileText, FolderOpen, Eye, ChevronRight,
  Clock, XCircle, Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

const paymentStatusMap: Record<string, { label: string; cls: string; icon: any }> = {
  completed: { label: "مكتمل",  cls: "bg-green-100 text-green-700", icon: CheckCircle },
  pending:   { label: "معلق",    cls: "bg-amber-100 text-amber-700", icon: Clock },
  failed:    { label: "فشل",    cls: "bg-red-100 text-red-600", icon: XCircle },
  refunded:  { label: "مُسترد", cls: "bg-blue-100 text-blue-700", icon: Wallet },
};

// ═══════════════════════════════════════════════════════════════════
export default function ParentDashboard() {
  // ✅ Single source of truth — one state for selected student
  const [selectedStudentId, setSelectedStudentId] =
    useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState<
    "children" | "grades" | "groups" | "payments"
  >("children");

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  const children = useQuery(
    api.relationships.parentStudent.getChildrenByParent,
    currentUser?._id
      ? { parentId: currentUser._id as Id<"users"> }
      : "skip"
  );

  const grades = useQuery(
    api.user.parents.getStudentGrades,
    selectedStudentId ? { studentId: selectedStudentId } : "skip"
  );

  const groups = useQuery(
    api.groups.groups.getStudentGroups,
    selectedStudentId ? { studentId: selectedStudentId } : "skip"
  );

  const payments = useQuery(
    api.user.parents.getPayments,
    currentUser?._id
      ? selectedStudentId
        ? { studentId: selectedStudentId }
        : {}
      : "skip"
  );

  // ── Loading / auth guard ──────────────────────────────────────
  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "parent") {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">غير مصرح بالوصول</p>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────
  const childrenList = children ?? [];
  const paymentList  = payments ?? [];
  const gradeData    = grades   ?? { examGrades: [], assignmentGrades: [] };
  const groupList    = groups   ?? [];

  const selectedChild = childrenList.find(
    (c: any) => c?._id === selectedStudentId
  );

  // ✅ Select student AND switch to relevant tab
  const handleSelectStudent = (
    id: Id<"users">,
    tab: "grades" | "groups" | "payments" = "grades"
  ) => {
    setSelectedStudentId(id);
    setActiveTab(tab);
  };

  // ✅ حساب الإحصائيات
  const totalPaid = paymentList
    .filter((p: any) => p.status === "completed")
    .reduce((s: number, p: any) => s + p.amount, 0);
  
  const totalPending = paymentList
    .filter((p: any) => p.status === "pending")
    .reduce((s: number, p: any) => s + p.amount, 0);
  
  const unpaidCount = paymentList
    .filter((p: any) => p.status === "pending" || p.status === "failed")
    .length;

  const gradedCount = gradeData.examGrades.filter(
    (g: any) => g.status === "graded"
  ).length;

  const tabs = [
    { key: "children" as const, label: "الأبناء",   icon: Users       },
    { key: "grades"   as const, label: "الدرجات",   icon: Award       },
    { key: "groups"   as const, label: "المجموعات", icon: FolderOpen  },
    { key: "payments" as const, label: "المدفوعات", icon: CreditCard  },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              لوحة تحكم ولي الأمر
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <span>🎓</span> مرحباً {currentUser.name}
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              {currentUser.phoneNumber && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5" />
                  {currentUser.phoneNumber}
                </span>
              )}
              {currentUser.email && (
                <span className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-2 py-1 rounded-full">
                  <Mail className="h-3.5 w-3.5" />
                  {currentUser.email}
                </span>
              )}
            </div>
          </div>
          <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            {childrenList.length} طالب
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "الأبناء",          value: childrenList.length, icon: Users,      iconCls: "text-blue-500",   bg: "bg-blue-50"   },
            { label: "الدرجات",          value: gradedCount,          icon: Award,      iconCls: "text-green-500",  bg: "bg-green-50"  },
            { label: "مدفوعات معلقة",    value: totalPending > 0 ? `${totalPending} ج.م` : "0", icon: CreditCard, iconCls: "text-amber-500", bg: "bg-amber-50"  },
            { label: "يجب الدفع",         value: unpaidCount,          icon: AlertCircle, iconCls: "text-red-500", bg: "bg-red-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${s.iconCls}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Quick child picker ─────────────────────────────── */}
        {childrenList.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500">عرض بيانات:</span>
            {childrenList.map((child: any) => {
              if (!child) return null;
              const isSelected = selectedStudentId === child._id;
              return (
                <button
                  key={child._id}
                  onClick={() =>
                    setSelectedStudentId(
                      isSelected ? null : (child._id as Id<"users">)
                    )
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                    isSelected
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-teal-400"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {child.name?.charAt(0)}
                  </span>
                  {child.name}
                  {child.isPrimary && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      رئيسي
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-gray-100 flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "border-teal-600 text-teal-600 bg-teal-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB: الأبناء ─────────────────────────────────────── */}
          {activeTab === "children" && (
            <div className="p-6">
              {childrenList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">لا يوجد أبناء مرتبطون بحسابك</p>
                  <p className="text-xs text-gray-400 mt-1">
                    تواصل مع الإدارة لربط حسابات الأبناء
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childrenList.map((child: any) => {
                    if (!child) return null;
                    return (
                      <div
                        key={child._id}
                        className="border border-gray-100 rounded-xl p-5 hover:border-teal-300 hover:shadow-sm transition-all"
                      >
                        {/* Name + badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
                              {child.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {child.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                رقم الطالب: {child.studentId ?? "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {child.relationship && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {child.relationship}
                              </span>
                            )}
                            {child.isPrimary && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                رئيسي
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Info rows */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <GraduationCap className="h-3.5 w-3.5 text-teal-500" />
                            <span>{child.gradeName ?? "غير محدد"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FolderOpen className="h-3.5 w-3.5 text-teal-500" />
                            <span>{child.groupName ?? "غير محدد"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                child.status === "active" || child.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : child.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {child.status === "active" || child.status === "approved"
                                ? "نشط"
                                : child.status === "pending"
                                ? "انتظار"
                                : child.status ?? "غير محدد"}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "grades"
                              )
                            }
                            className="flex flex-col items-center gap-1 p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs transition-colors"
                          >
                            <Award className="h-4 w-4" />
                            الدرجات
                          </button>
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "groups"
                              )
                            }
                            className="flex flex-col items-center gap-1 p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs transition-colors"
                          >
                            <FolderOpen className="h-4 w-4" />
                            المجموعات
                          </button>
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "payments"
                              )
                            }
                            className="flex flex-col items-center gap-1 p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs transition-colors"
                          >
                            <CreditCard className="h-4 w-4" />
                            المدفوعات
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: الدرجات ─────────────────────────────────────── */}
          {activeTab === "grades" && (
            <div className="p-6">
              {!selectedStudentId ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">اختر طالباً لعرض درجاته</p>
                  <p className="text-xs text-gray-400 mt-1">
                    اضغط على اسم الطالب في الأعلى أو من تبويب الأبناء
                  </p>
                </div>
              ) : grades === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    درجات:{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedChild?.name}
                    </span>
                  </p>

                  {/* Exam grades */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600" />
                      درجات الامتحانات ({gradeData.examGrades.length})
                    </h3>
                    {gradeData.examGrades.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                        لا توجد امتحانات مسجلة
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {gradeData.examGrades.map((g: any) => (
                          <div
                            key={g._id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {g.examTitle}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {g.examSubject} — {formatDate(g.examDate)}
                              </p>
                            </div>
                            <div className="text-left">
                              {g.status === "graded" ? (
                                <div className="text-center">
                                  <p className="text-xl font-bold text-teal-600">
                                    {g.totalMarks}
                                  </p>
                                  {g.maxMarks > 0 && (
                                    <p className="text-xs text-gray-400">
                                      / {g.maxMarks}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                  انتظار التصحيح
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignment grades */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      درجات الواجبات ({gradeData.assignmentGrades.length})
                    </h3>
                    {gradeData.assignmentGrades.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                        لا توجد واجبات مسجلة
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {gradeData.assignmentGrades.map((g: any) => (
                          <div
                            key={g._id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {g.assignmentTitle}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                تاريخ التسليم: {formatDate(g.assignmentDueDate)}
                              </p>
                            </div>
                            <div className="text-left">
                              {g.status === "graded" ? (
                                <div className="text-center">
                                  <p className="text-xl font-bold text-teal-600">
                                    {g.grade}
                                  </p>
                                  {g.maxGrade > 0 && (
                                    <p className="text-xs text-gray-400">
                                      / {g.maxGrade}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                  انتظار التصحيح
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: المجموعات ───────────────────────────────────── */}
          {activeTab === "groups" && (
            <div className="p-6">
              {!selectedStudentId ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">اختر طالباً لعرض مجموعاته</p>
                </div>
              ) : groups === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : groupList.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    لا توجد مجموعات للطالب {selectedChild?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    مجموعات:{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedChild?.name}
                    </span>
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {groupList.map((group: any) => {
                      if (!group) return null;
                      return (
                        <div
                          key={group._id}
                          className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-gray-900 text-sm">
                              {group.name}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                group.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {group.status === "active" ? "نشطة" : group.status}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {group.subject && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                                <span>{group.subject}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <GraduationCap className="h-3.5 w-3.5 text-teal-500" />
                              <span>{group.gradeName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3.5 w-3.5 text-teal-500" />
                              <span>المشرف: {group.supervisorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3.5 w-3.5 text-teal-500" />
                              <span>{group.studentCount} طالب</span>
                            </div>
                            {group.schedule && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3.5 w-3.5 text-teal-500" />
                                <span>
                                  {Array.isArray(group.schedule.days)
                                    ? group.schedule.days.join("، ")
                                    : group.schedule.days ?? "—"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: المدفوعات ───────────────────────────────────── */}
          {activeTab === "payments" && (
            <div className="p-6">
              {payments === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ✅ حالة اشتراك ولي الأمر */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">حالة الاشتراك</h3>
                        <p className="text-xs text-gray-500">حالة اشتراكك في المنصة</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border">
                      <div>
                        <p className="text-sm text-gray-500">حالة الاشتراك</p>
                        <p className="font-bold text-gray-900 mt-0.5">
                          {currentUser.subscriptionStatus === "active" ? "نشط" :
                           currentUser.subscriptionStatus === "awaiting_approval" ? "في انتظار الموافقة" :
                           currentUser.subscriptionStatus === "pending" ? "قيد الانتظار" :
                           currentUser.subscriptionStatus === "rejected" ? "مرفوض" : "غير محدد"}
                        </p>
                      </div>
                      <div>
                        {currentUser.subscriptionStatus === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                            مفعل
                          </span>
                        ) : currentUser.subscriptionStatus === "awaiting_approval" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-amber-700 bg-amber-100 rounded-full">
                            <Clock className="h-4 w-4" />
                            قيد المراجعة
                          </span>
                        ) : currentUser.subscriptionStatus === "pending" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
                            <Clock className="h-4 w-4" />
                            لم يدفع بعد
                          </span>
                        ) : currentUser.subscriptionStatus === "rejected" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-100 rounded-full">
                            <XCircle className="h-4 w-4" />
                            مرفوض
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full">
                            <AlertCircle className="h-4 w-4" />
                            غير محدد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ✅ حالة اشتراك الأبناء */}
                  {childrenList.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">اشتراكات الأبناء</h3>
                          <p className="text-xs text-gray-500">حالة اشتراك كل ابن في المنصة</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {childrenList.map((child: any) => {
                          const childPayment = paymentList.find(
                            (p: any) => p.studentId === child._id
                          );
                          
                          const isActive = child.subscriptionStatus === "active" || childPayment?.status === "completed";
                          const isPending = child.subscriptionStatus === "awaiting_approval" || childPayment?.status === "pending";
                          const isRejected = child.subscriptionStatus === "rejected" || childPayment?.status === "failed";
                          
                          return (
                            <div
                              key={child._id}
                              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-teal-300 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                                  <span className="text-teal-700 font-bold text-sm">
                                    {child.name?.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{child.name}</p>
                                  <p className="text-xs text-gray-400">{child.studentId || "رقم غير محدد"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {isActive && (
                                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    مدفوع
                                  </span>
                                )}
                                {isPending && (
                                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    قيد المراجعة
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5" />
                                    مرفوض
                                  </span>
                                )}
                                {!isActive && !isPending && !isRejected && (
                                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    لم يدفع
                                  </span>
                                )}
                                {childPayment && (
                                  <span className="text-xs text-gray-400">
                                    {childPayment.amount} {childPayment.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ✅ ملخص سريع */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-xs text-green-600 font-medium">المدفوع</p>
                      <p className="text-xl font-bold text-green-700 mt-1">
                        {paymentList.filter((p: any) => p.status === "completed").length}
                      </p>
                      <p className="text-xs text-green-500">اشتراكات مكتملة</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="text-xs text-amber-600 font-medium">قيد الانتظار</p>
                      <p className="text-xl font-bold text-amber-700 mt-1">
                        {paymentList.filter((p: any) => p.status === "pending").length}
                      </p>
                      <p className="text-xs text-amber-500">اشتراكات قيد المراجعة</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}