// app/(pages)/aptitude/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  BookOpen,
  Video,
  FileText,
  CheckCircle,
  Clock,
  User,
  GraduationCap,
  Award,
  Search,
  Loader2,
  Globe,
  MessageCircle,
  Shield,
  Home,
  Plane,
  Sparkles,
  Target,
  Check,
  X,
  Eye,
  Download,
  Play,
  Calendar,
  Users,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "@/convex/_generated/dataModel";

// بيانات تجريبية للمواد (سيتم جلبها من Convex لاحقاً)
const mockMaterials = {
  pdfs: [
    { id: 1, title: "ملخص رياضيات 1", size: "2.5 MB", url: "#" },
    { id: 2, title: "مراجعة فيزياء 2", size: "1.8 MB", url: "#" },
  ],
  videos: [
    { id: 1, title: "شرح المعادلات الخطية", duration: "15:30", url: "#" },
    { id: 2, title: "حل مسائل الفيزياء", duration: "22:45", url: "#" },
  ],
  exams: [
    { id: 1, title: "اختبار رياضيات 1", questions: 20, time: "45 دقيقة", url: "#" },
    { id: 2, title: "اختبار فيزياء 2", questions: 15, time: "30 دقيقة", url: "#" },
  ],
  assignments: [
    { id: 1, title: "واجب رياضيات 1", deadline: "2024-02-15", url: "#" },
    { id: 2, title: "واجب فيزياء 2", deadline: "2024-02-20", url: "#" },
  ],
  revisions: [
    { id: 1, title: "مراجعة نهائية رياضيات", url: "#" },
    { id: 2, title: "مراجعة فيزياء", url: "#" },
  ],
};

export default function AptitudePage() {
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // ✅ جلب بيانات المعلمين من Convex
  const teachersData = useQuery(api.user.teachers.getPublicTeachers, {});

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // حالة التحميل
  if (teachersData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // فلترة المعلمين حسب البحث
  const filteredTeachers = teachersData.filter((teacher: any) => {
    const search = searchQuery.toLowerCase();
    return (
      teacher.name?.toLowerCase().includes(search) ||
      teacher.email?.toLowerCase().includes(search) ||
      teacher.specialization?.toLowerCase().includes(search) ||
      teacher.subjects?.some((s: string) => s.toLowerCase().includes(search))
    );
  });
  console.log(filteredTeachers);

  // اختيار معلم
  const selectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsCheckoutOpen(true);
    setIsPaid(false);
  };

  // معالجة الدفع
  const handlePayment = () => {
    setIsProcessingPayment(true);
    // محاكاة عملية الدفع
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaid(true);
      setIsCheckoutOpen(false);
    }, 2000);
  };

  // دالة عرض المواد بعد الدفع
  const renderMaterials = () => {
    if (!selectedTeacher) return null;

    // استخدام مواد افتراضية أو يمكن جلبها من Convex
    const materials = mockMaterials;

    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#001f24] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedTeacher.name}
              </h2>
              <p className="text-[#a3ced6] text-sm">
                {selectedTeacher.specialization || selectedTeacher.subjects?.join(" • ")}
              </p>
            </div>
            <button
              onClick={() => {
                setIsPaid(false);
                setSelectedTeacher(null);
              }}
              className="text-white/80 hover:text-white text-3xl"
            >
              ✕
            </button>
          </div>

          {/* معلومات المعلم */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-white/5 rounded-xl">
            <div className="text-center">
              <p className="text-[#a3ced6] text-xs">{lang === "ar" ? "الخبرة" : "Experience"}</p>
              <p className="text-white font-bold">{selectedTeacher.experience || 0} {lang === "ar" ? "سنوات" : "years"}</p>
            </div>
            <div className="text-center">
              <p className="text-[#a3ced6] text-xs">{lang === "ar" ? "المؤهل" : "Qualification"}</p>
              <p className="text-white font-bold text-sm truncate">
                {selectedTeacher.qualification || "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[#a3ced6] text-xs">{lang === "ar" ? "التخصص" : "Specialization"}</p>
              <p className="text-white font-bold text-sm truncate">
                {selectedTeacher.specialization || "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[#a3ced6] text-xs">{lang === "ar" ? "الحالة" : "Status"}</p>
              <Badge className={selectedTeacher.status === "active" ? "bg-green-500" : "bg-gray-500"}>
                {selectedTeacher.status === "active" ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "غير نشط" : "Inactive")}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="pdfs" className="w-full">
            <TabsList className="grid grid-cols-5 gap-2 bg-white/5 p-1 rounded-xl">
              <TabsTrigger value="pdfs" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
                <FileText className="h-4 w-4 ml-2" />
                {lang === "ar" ? "ملفات PDF" : "PDFs"}
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
                <Video className="h-4 w-4 ml-2" />
                {lang === "ar" ? "فيديوهات" : "Videos"}
              </TabsTrigger>
              <TabsTrigger value="exams" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
                <FileText className="h-4 w-4 ml-2" />
                {lang === "ar" ? "امتحانات" : "Exams"}
              </TabsTrigger>
              <TabsTrigger value="assignments" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
                <BookOpen className="h-4 w-4 ml-2" />
                {lang === "ar" ? "واجبات" : "Assignments"}
              </TabsTrigger>
              <TabsTrigger value="revisions" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
                <CheckCircle className="h-4 w-4 ml-2" />
                {lang === "ar" ? "مراجعات" : "Revisions"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdfs" className="mt-4">
              <div className="grid md:grid-cols-2 gap-3">
                {materials.pdfs.map((pdf: any) => (
                  <div key={pdf.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                    <div>
                      <p className="text-white font-medium">{pdf.title}</p>
                      <p className="text-[#a3ced6] text-sm">{pdf.size}</p>
                    </div>
                    <Button variant="outline" className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-4">
              <div className="grid md:grid-cols-2 gap-3">
                {materials.videos.map((video: any) => (
                  <div key={video.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                    <div>
                      <p className="text-white font-medium">{video.title}</p>
                      <p className="text-[#a3ced6] text-sm">{video.duration}</p>
                    </div>
                    <Button variant="outline" className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="exams" className="mt-4">
              <div className="grid md:grid-cols-2 gap-3">
                {materials.exams.map((exam: any) => (
                  <div key={exam.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                    <p className="text-white font-medium">{exam.title}</p>
                    <div className="flex items-center gap-3 text-[#a3ced6] text-sm mt-1">
                      <span>{exam.questions} {lang === "ar" ? "سؤال" : "questions"}</span>
                      <span>•</span>
                      <span>{exam.time}</span>
                    </div>
                    <Button className="mt-2 w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                      {lang === "ar" ? "بدء الاختبار" : "Start Exam"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              <div className="grid md:grid-cols-2 gap-3">
                {materials.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                    <p className="text-white font-medium">{assignment.title}</p>
                    <p className="text-[#a3ced6] text-sm">{lang === "ar" ? "تسليم" : "Deadline"}: {assignment.deadline}</p>
                    <Button className="mt-2 w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                      {lang === "ar" ? "تقديم الواجب" : "Submit Assignment"}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="revisions" className="mt-4">
              <div className="grid md:grid-cols-2 gap-3">
                {materials.revisions.map((revision: any) => (
                  <div key={revision.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                    <p className="text-white font-medium">{revision.title}</p>
                    <Button variant="outline" className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {lang === "ar" ? "برامج القدرات" : "Aptitude Programs"}
              </h1>
              <p className="text-[#a3ced6] text-sm">
                {lang === "ar" 
                  ? "استعد لاختبارات القدرات مع أفضل المعلمين" 
                  : "Prepare for aptitude tests with the best teachers"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Globe className="h-4 w-4" />
            {lang === "en" ? "AR" : "EN"}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-[#1a7a8a]">{teachersData.length}</p>
            <p className="text-xs text-gray-500">{lang === "ar" ? "إجمالي المعلمين" : "Total Teachers"}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-green-500">
              {teachersData.filter((t: any) => t.status === "active").length}
            </p>
            <p className="text-xs text-gray-500">{lang === "ar" ? "معلمين نشطين" : "Active Teachers"}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-amber-500">
              {teachersData.reduce((acc: number, t: any) => acc + (t.experience || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">{lang === "ar" ? "إجمالي سنوات الخبرة" : "Total Experience Years"}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-purple-500">
              {new Set(teachersData.flatMap((t: any) => t.subjects || [])).size}
            </p>
            <p className="text-xs text-gray-500">{lang === "ar" ? "مواد متنوعة" : "Diverse Subjects"}</p>
          </div>
        </div> */}

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={lang === "ar" ? "ابحث عن معلم..." : "Search for a teacher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 border-gray-200 focus-visible:ring-[#03363d]/20"
            />
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {lang === "ar" ? "لا توجد نتائج مطابقة للبحث" : "No results match your search"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher: any) => (
              <Card key={teacher._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 bg-white">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#1a7a8a]">
                        {teacher.name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#0a2540] text-lg line-clamp-1">
                        {teacher.name}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {teacher.specialization || teacher.subjects?.join(" • ")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects?.slice(0, 3).map((subject: string) => (
                        <Badge key={subject} className="bg-[#1a7a8a]/10 text-[#1a7a8a] border-none text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {teacher.subjects?.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-500 border-none text-xs">
                          +{teacher.subjects.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{teacher.experience || 0} {lang === "ar" ? "سنوات خبرة" : "years experience"}</span>
                    </div>
                    {teacher.qualification && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <GraduationCap className="h-4 w-4" />
                        <span className="line-clamp-1">{teacher.qualification}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-4 bg-[#0a2540] hover:bg-[#1a3a5c] text-white"
                    onClick={() => selectTeacher(teacher)}
                  >
                    {lang === "ar" ? "عرض المواد" : "View Materials"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0a2540]">
              {lang === "ar" ? "الدفع والاشتراك" : "Payment & Subscription"}
            </DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-4 py-4">
              <div className="bg-[#f7fafa] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                    <span className="text-lg font-bold text-[#1a7a8a]">
                      {selectedTeacher.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540]">
                      {selectedTeacher.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedTeacher.specialization || selectedTeacher.subjects?.join(" • ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#0a2540]">
                  {lang === "ar" ? "تفاصيل الدفع" : "Payment Details"}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {lang === "ar" ? "سعر المواد" : "Materials Price"}
                  </span>
                  <span className="font-semibold">150 ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {lang === "ar" ? "رسوم الخدمة" : "Service Fee"}
                  </span>
                  <span className="font-semibold">20 ر.س</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                  <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                  <span className="text-[#1a7a8a]">170 ر.س</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  {lang === "ar"
                    ? "بعد الدفع ستحصل على جميع المواد التعليمية للمعلم"
                    : "After payment you will get all educational materials for the teacher"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="bg-[#1a7a8a] hover:bg-[#15707e] text-white"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {lang === "ar" ? "جاري المعالجة..." : "Processing..."}
                </>
              ) : (
                <>
                  {lang === "ar" ? "ادفع الآن" : "Pay Now"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Materials Display After Payment */}
      {isPaid && renderMaterials()}
    </div>
  );
}