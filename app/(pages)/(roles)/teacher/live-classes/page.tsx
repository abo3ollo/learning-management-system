// app/(pages)/(roles)/teacher/live-classes/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  Video,
  Calendar,
  Clock,
  Users,
  Link2,
  Play,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  
  Film,
  Radio,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// أيقونات المنصات
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "zoom":
      return <span className="text-[#0B5CFF] font-bold text-xs bg-blue-50 px-2 py-0.5 rounded">Zoom</span>;
    case "google_meet":
      return <span className="text-[#1A73E8] font-bold text-xs bg-blue-50 px-2 py-0.5 rounded">Meet</span>;
    case "youtube":
      return <span className="text-[#FF0000] font-bold text-xs bg-red-50 px-2 py-0.5 rounded">YouTube</span>;
    case "teams":
      return <span className="text-[#6264A7] font-bold text-xs bg-purple-50 px-2 py-0.5 rounded">Teams</span>;
    default:
      return <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">أخرى</span>;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">مجدولة</Badge>;
    case "live":
      return <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">مباشرة الآن</Badge>;
    case "ended":
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">انتهت</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700 border-red-200">ملغاة</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function TeacherLiveClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const liveClasses = useQuery(
    api.liveClasses.liveClasses.getTeacherLiveClasses,
    {
      status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    }
  );

  const deleteLiveClass = useMutation(api.liveClasses.liveClasses.deleteLiveClass);
  const updateStatus = useMutation(api.liveClasses.liveClasses.updateLiveClassStatus);

  if (!currentUser || liveClasses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحصة؟")) return;
    setIsDeleting(id);
    try {
      await deleteLiveClass({ liveClassId: id as any });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, status: "live" | "ended" | "cancelled") => {
    try {
      await updateStatus({ liveClassId: id as any, status });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء تحديث الحالة");
    }
  };

  const filteredClasses = liveClasses?.filter((cls: any) => {
    if (searchQuery && !cls.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    scheduled: liveClasses?.filter((c: any) => c.status === "scheduled").length || 0,
    live: liveClasses?.filter((c: any) => c.status === "live").length || 0,
    ended: liveClasses?.filter((c: any) => c.status === "ended").length || 0,
    total: liveClasses?.length || 0,
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Video className="h-6 w-6" />
              الحصص المباشرة
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">
              إدارة الحصص المباشرة وروابط الاجتماعات
            </p>
          </div>
          <Link href="/teacher/live-classes/create">
            <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 gap-2">
              <Plus className="h-4 w-4" />
              إنشاء حصة مباشرة
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#001f24]">{stats.total}</p>
              <p className="text-xs text-gray-500">إجمالي الحصص</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              <p className="text-xs text-gray-500">مجدولة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600 animate-pulse">{stats.live}</p>
              <p className="text-xs text-gray-500">مباشرة الآن</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.ended}</p>
              <p className="text-xs text-gray-500">انتهت</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن حصة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="scheduled">مجدولة</option>
            <option value="live">مباشرة الآن</option>
            <option value="ended">انتهت</option>
            <option value="cancelled">ملغاة</option>
          </select>
        </div>

        {/* Live Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses?.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-[#c0c8c9]">
              <Video className="h-16 w-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">لا توجد حصص مباشرة</p>
              <p className="text-sm text-gray-400">قم بإنشاء أول حصة مباشرة لك</p>
              <Link href="/teacher/live-classes/create">
                <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء حصة مباشرة
                </Button>
              </Link>
            </div>
          ) : (
            filteredClasses?.map((cls: any) => {
              const isLive = cls.status === "live";
              const isScheduled = cls.status === "scheduled";
              const isEnded = cls.status === "ended";

              return (
                <Card key={cls._id} className={`hover:shadow-md transition-shadow ${isLive ? "border-2 border-green-500" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {isLive && <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>}
                          {cls.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <PlatformIcon platform={cls.platform} />
                          <StatusBadge status={cls.status} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-[#1a7a8a]" />
                        <span>{cls.groupName}</span>
                        <span className="text-xs text-gray-400">- {cls.groupSubject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-[#1a7a8a]" />
                        <span>{format(new Date(cls.startTime), "dd MMM yyyy", { locale: ar })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-[#1a7a8a]" />
                        <span>
                          {format(new Date(cls.startTime), "HH:mm", { locale: ar })} - {format(new Date(cls.endTime), "HH:mm", { locale: ar })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-[#1a7a8a]" />
                        <span>{cls.attendance?.length || 0} طالب</span>
                      </div>

                      {/* رابط الحصة */}
                      {isLive || isScheduled ? (
                        <a
                          href={cls.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#1a7a8a] hover:underline text-sm"
                        >
                          <Link2 className="h-4 w-4" />
                          فتح رابط الحصة
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : isEnded && cls.recordingLink && (
                        <a
                          href={cls.recordingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                        >
                          <Video className="h-4 w-4" />
                          مشاهدة التسجيل
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        {isScheduled && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleStatusChange(cls._id, "live")}
                            >
                              <Play className="h-3 w-3 ml-1" />
                              بدء الحصة
                            </Button>
                            <Link href={`/teacher/live-classes/${cls._id}`}>
                              <Button size="sm" variant="outline" className="text-blue-600">
                                <Eye className="h-3 w-3 ml-1" />
                                التفاصيل
                              </Button>
                            </Link>
                          </>
                        )}
                        {isLive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600"
                            onClick={() => handleStatusChange(cls._id, "ended")}
                          >
                            <CheckCircle className="h-3 w-3 ml-1" />
                            إنهاء الحصة
                          </Button>
                        )}
                        {isEnded && (
                          <Link href={`/teacher/live-classes/${cls._id}`}>
                            <Button size="sm" variant="outline" className="text-purple-600">
                              <Eye className="h-3 w-3 ml-1" />
                              عرض التسجيل
                            </Button>
                          </Link>
                        )}
                        {(isScheduled || isEnded) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDelete(cls._id)}
                            disabled={isDeleting === cls._id}
                          >
                            {isDeleting === cls._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 ml-1" />
                            )}
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}