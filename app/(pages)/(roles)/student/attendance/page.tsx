// app/(pages)/(roles)/student/attendance/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Video,
  ArrowRight,
  Search,
  Filter,
  Eye,
  PlayCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "live":
      return <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">مباشرة الآن</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">مجدولة</Badge>;
    case "ended":
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">انتهت</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function StudentAttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب سجل الحضور
  const attendanceHistory = useQuery(
    api.liveClasses.liveClasses.getStudentAttendance,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // ✅ جلب الحصص القادمة
  const upcomingClasses = useQuery(
    api.liveClasses.liveClasses.getStudentLiveClasses,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  if (!currentUser || attendanceHistory === undefined || upcomingClasses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ تصفية سجل الحضور
  const filteredHistory = attendanceHistory?.filter((item: any) => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedStatus === "attended") return true;
    return true;
  });

  const stats = {
    total: attendanceHistory?.length || 0,
    upcoming: upcomingClasses?.length || 0,
    live: upcomingClasses?.filter((c: any) => c.status === "live").length || 0,
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001f24] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#1a7a8a]" />
            حضوري
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            سجل حضورك في الحصص المباشرة
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#1a7a8a]">{stats.total}</p>
              <p className="text-xs text-gray-500">إجمالي الحصص المحضورة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              <p className="text-xs text-gray-500">حصص قادمة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600 animate-pulse">{stats.live}</p>
              <p className="text-xs text-gray-500">مباشرة الآن</p>
            </CardContent>
          </Card>
        </div>

        {/* الحصص القادمة */}
        {upcomingClasses && upcomingClasses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#001f24] mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-[#1a7a8a]" />
              الحصص القادمة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingClasses.slice(0, 4).map((cls: any) => (
                <Card key={cls._id} className={`border ${cls.status === "live" ? "border-green-500 border-2" : "border-[#c0c8c9]"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#001f24] truncate">{cls.title}</p>
                          <StatusBadge status={cls.status} />
                        </div>
                        <p className="text-sm text-gray-500">{cls.groupName}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(cls.startTime), "dd MMM yyyy", { locale: ar })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(cls.startTime), "HH:mm", { locale: ar })}
                          </span>
                        </div>
                      </div>
                      <a
                        href={cls.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          size="sm"
                          className={`gap-2 ${cls.status === "live" ? "bg-green-600 hover:bg-green-700" : "bg-[#1a7a8a] hover:bg-[#15707e]"}`}
                        >
                          {cls.status === "live" ? (
                            <>
                              <PlayCircle className="h-4 w-4" />
                              انضم الآن
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              عرض
                            </>
                          )}
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* سجل الحضور */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#001f24] flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#1a7a8a]" />
              سجل الحضور
              <Badge className="bg-[#1a7a8a] text-white">
                {attendanceHistory?.length || 0} حصة
              </Badge>
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن حصة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-10 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>
          </div>

          {/* Attendance List */}
          {attendanceHistory?.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">لا يوجد سجل حضور</p>
              <p className="text-sm text-gray-400">لم تحضر أي حصة مباشرة بعد</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredHistory?.map((item: any) => (
                <Card key={item._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#001f24]">{item.title}</p>
                          <Badge className="bg-gray-100 text-gray-600">{item.groupName}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(item.startTime), "dd MMM yyyy", { locale: ar })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.startTime), "HH:mm", { locale: ar })}
                          </span>
                          {item.duration && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              {item.duration} دقيقة
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.recordingLink && (
                          <a
                            href={item.recordingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                          >
                            <Video className="h-4 w-4" />
                            تسجيل
                          </a>
                        )}
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          حضرت
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}