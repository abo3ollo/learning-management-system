// app/(pages)/(roles)/teacher/live-classes/create/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  Link2,
  Loader2,
  Users,
  Video,
} from "lucide-react";
import { format } from "date-fns";

const PLATFORMS = [
  { value: "zoom", label: "Zoom", icon: "🔵" },
  { value: "google_meet", label: "Google Meet", icon: "🟢" },
  { value: "youtube", label: "YouTube Live", icon: "🔴" },
  { value: "teams", label: "Microsoft Teams", icon: "🟣" },
  { value: "other", label: "أخرى", icon: "📎" },
];

export default function CreateLiveClassPage() {
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const teacherGroups = useQuery(api.groups.groups.getTeacherGroups, {});

  const createLiveClass = useMutation(api.liveClasses.liveClasses.createLiveClass);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    groupId: "",
    platform: "zoom" as "zoom" | "google_meet" | "youtube" | "teams" | "other",
    link: "",
    meetingId: "",
    password: "",
    startTime: "",
    endTime: "",
    maxStudents: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ التحقق من صحة النموذج
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "عنوان الحصة مطلوب";
    }
    if (!formData.groupId) {
      newErrors.groupId = "يرجى اختيار المجموعة";
    }
    if (!formData.link.trim()) {
      newErrors.link = "رابط الحصة مطلوب";
    } else if (!formData.link.startsWith("http://") && !formData.link.startsWith("https://")) {
      newErrors.link = "الرابط يجب أن يبدأ بـ http:// أو https://";
    }
    if (!formData.startTime) {
      newErrors.startTime = "تاريخ ووقت البداية مطلوب";
    }
    if (!formData.endTime) {
      newErrors.endTime = "تاريخ ووقت النهاية مطلوب";
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "وقت النهاية يجب أن يكون بعد وقت البداية";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ معالجة تغيير المجموعة
  const handleGroupChange = (value: string | null) => {
    setFormData({ ...formData, groupId: value || "" });
  };

  // ✅ معالجة تغيير المنصة
  const handlePlatformChange = (value: string | null) => {
    if (value) {
      setFormData({ ...formData, platform: value as any });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await createLiveClass({
        title: formData.title.trim(),
        description: formData.description || undefined,
        groupId: formData.groupId as any,
        platform: formData.platform,
        link: formData.link.trim(),
        meetingId: formData.meetingId || undefined,
        password: formData.password || undefined,
        startTime: new Date(formData.startTime).getTime(),
        endTime: new Date(formData.endTime).getTime(),
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
      });

      router.push(`/teacher/live-classes/${result.liveClassId}`);
    } catch (error: any) {
      setErrors({ submit: error.message || "حدث خطأ أثناء إنشاء الحصة" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGroup = teacherGroups?.find((g: any) => g._id === formData.groupId);

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001f24] flex items-center gap-2">
            <Video className="h-6 w-6 text-[#1a7a8a]" />
            إنشاء حصة مباشرة جديدة
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أدخل تفاصيل الحصة المباشرة ورابط الاجتماع
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">تفاصيل الحصة</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* العنوان */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1">
                  عنوان الحصة <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: شرح درس الرياضيات - الفصل الأول"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* الوصف */}
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                  rows={3}
                  placeholder="وصف الحصة..."
                />
              </div>

              {/* المجموعة */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-[#1a7a8a]" />
                  المجموعة <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.groupId}
                  onValueChange={handleGroupChange}
                >
                  <SelectTrigger className={errors.groupId ? "border-red-500" : ""}>
                    <SelectValue placeholder="اختر المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherGroups?.map((group: any) => (
                      <SelectItem key={group._id} value={group._id}>
                        {group.name} - {group.subject} ({group.gradeName || "بدون صف"})
                      </SelectItem>
                    ))}
                    {(!teacherGroups || teacherGroups.length === 0) && (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        لا توجد مجموعات متاحة
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.groupId && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.groupId}
                  </p>
                )}
                {selectedGroup && (
                  <p className="text-xs text-gray-400">
                    عدد الطلاب في المجموعة: {selectedGroup.students?.length || 0} طالب
                  </p>
                )}
              </div>

              {/* المنصة */}
              <div className="space-y-2">
                <Label>المنصة <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: p.value as any })}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        formData.platform === p.value
                          ? "border-[#1a7a8a] bg-[#e0f5f7] text-[#1a7a8a]"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <div className="text-lg">{p.icon}</div>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* رابط الحصة */}
              <div className="space-y-2">
                <Label htmlFor="link" className="flex items-center gap-1">
                  <Link2 className="h-4 w-4 text-[#1a7a8a]" />
                  رابط الحصة <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://zoom.us/j/1234567890"
                  className={errors.link ? "border-red-500" : ""}
                />
                {errors.link && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.link}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  أدخل رابط الحصة من Zoom, Google Meet, YouTube, إلخ.
                </p>
              </div>

              {/* معرف الاجتماع وكلمة المرور (لـ Zoom) */}
              {formData.platform === "zoom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meetingId">معرف الاجتماع (اختياري)</Label>
                    <Input
                      id="meetingId"
                      value={formData.meetingId}
                      onChange={(e) => setFormData({ ...formData, meetingId: e.target.value })}
                      placeholder="123-456-789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور (اختياري)</Label>
                    <Input
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="********"
                    />
                  </div>
                </div>
              )}

              {/* الوقت */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[#1a7a8a]" />
                    تاريخ ووقت البداية <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={errors.startTime ? "border-red-500" : ""}
                  />
                  {errors.startTime && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.startTime}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-[#1a7a8a]" />
                    تاريخ ووقت النهاية <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={errors.endTime ? "border-red-500" : ""}
                  />
                  {errors.endTime && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.endTime}
                    </p>
                  )}
                </div>
              </div>

              {/* الحد الأقصى للطلاب */}
              <div className="space-y-2">
                <Label htmlFor="maxStudents">الحد الأقصى للطلاب (اختياري)</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                  placeholder="اترك فارغاً لغير محدود"
                />
              </div>

              {/* خطأ عام */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.submit}
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#001f24] hover:bg-[#03363d] text-white flex-1 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      إنشاء الحصة
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}