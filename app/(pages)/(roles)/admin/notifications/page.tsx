// app/(pages)/(roles)/admin/notifications/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  Bell, Send, FileText, Search, Loader2,
  Users, GraduationCap, User, ChevronDown,
  Eye, Trash2, Plus, AlertCircle, CheckCircle,
  BookOpen, Calendar, Radio, School,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────
type NotifType =
  | "teacher_message"
  | "exam_published"
  | "exam_reminder"
  | "new_assignment"
  | "system_announcement"
  | "submission"
  | "assignment";

type Priority = "low" | "normal" | "high" | "urgent";

// ── Constants ─────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: NotifType; label: string; color: string }[] = [
  { value: "teacher_message",     label: "رسالة معلم",      color: "text-blue-600"  },
  { value: "exam_published",      label: "نشر امتحان",      color: "text-green-600" },
  { value: "exam_reminder",       label: "تذكير امتحان",    color: "text-amber-600" },
  { value: "new_assignment",      label: "واجب جديد",       color: "text-purple-600"},
  { value: "system_announcement", label: "إعلان نظام",      color: "text-gray-600"  },
  { value: "submission",          label: "تسليم واجب",      color: "text-cyan-600"  },
  { value: "assignment",          label: "تخصيص واجب",      color: "text-indigo-600"},
];

const PRIORITY_OPTIONS: { value: Priority; label: string; cls: string }[] = [
  { value: "low",    label: "منخفضة", cls: "bg-gray-100  text-gray-600"   },
  { value: "normal", label: "عادية",  cls: "bg-blue-100  text-blue-700"   },
  { value: "high",   label: "عالية",  cls: "bg-amber-100 text-amber-700"  },
  { value: "urgent", label: "عاجلة",  cls: "bg-red-100   text-red-600"    },
];

function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy – HH:mm", { locale: ar });
}

function TypeBadge({ type }: { type: string }) {
  const t = TYPE_OPTIONS.find((o) => o.value === type);
  return (
    <span className={`text-xs font-medium ${t?.color ?? "text-gray-600"}`}>
      {t?.label ?? type}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY_OPTIONS.find((o) => o.value === priority);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p?.cls ?? "bg-gray-100 text-gray-600"}`}>
      {p?.label ?? priority}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function AdminNotificationsPage() {
  const [search, setSearch] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────
  const notifications = useQuery(api.notifications.notifications.listNotifications, {});
  const deleteNotification = useMutation(api.notifications.notifications.deleteNotification);

  const notifList = notifications ?? [];

  const filtered = useMemo(() =>
    notifList.filter((n: any) =>
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase())
    ), [notifList, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا الإشعار؟")) return;
    await deleteNotification({ notificationId: id as Id<"notifications"> });
    if (previewId === id) setPreviewId(null);
  };

  const recipientLabel = (n: any) => {
    if (n.recipientType === "group")        return n.recipientName ?? "مجموعة";
    if (n.recipientType === "grade")        return n.recipientName ?? "صف";
    if (n.recipientType === "student")      return n.recipientName ?? "طالب";
    if (n.recipientType === "all_teachers") return "جميع المعلمين";
    if (n.recipientType === "teacher")      return n.recipientName ?? "معلم";
    return "—";
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5" /> الإشعارات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              إدارة وإرسال إشعارات الطلاب والمعلمين
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
              {notifList.length} إشعار
            </span>
            {/* ✅ زر إنشاء إشعار جديد */}
            <Link href="/admin/notifications/create">
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 gap-2">
                <Plus className="h-4 w-4" />
                إنشاء إشعار
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* ── Search ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm font-semibold text-[#001f24]">
              سجل الإشعارات ({filtered.length})
            </p>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafa] border-b border-gray-100">
                <tr>
                  {["العنوان", "النوع", "الأولوية", "أُرسل إلى", "التاريخ", "أُنشئ بواسطة", "إجراءات"].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notifications === undefined ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a7a8a]" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Bell className="h-10 w-10 text-gray-200" />
                        <p className="text-sm">لا توجد إشعارات</p>
                        <Link href="/admin/notifications/create">
                          <Button variant="outline" size="sm" className="mt-2">
                            <Plus className="h-4 w-4 ml-2" />
                            إنشاء أول إشعار
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((n: any) => (
                    <tr key={n._id} className="hover:bg-[#f7fafa] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#001f24] max-w-50 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-400 max-w-50 truncate">
                          {n.message}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={n.type} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={n.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          {n.recipientType === "group" && <Users className="h-3.5 w-3.5 text-[#1a7a8a]" />}
                          {n.recipientType === "grade" && <School className="h-3.5 w-3.5 text-amber-500" />}
                          {n.recipientType === "student" && <User className="h-3.5 w-3.5 text-blue-500" />}
                          {n.recipientType === "all_teachers" && <GraduationCap className="h-3.5 w-3.5 text-purple-500" />}
                          {n.recipientType === "teacher" && <GraduationCap className="h-3.5 w-3.5 text-amber-500" />}
                          <span className="truncate max-w-35">{recipientLabel(n)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(n.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {n.createdByName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(n._id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400">عرض {filtered.length} إشعار</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}