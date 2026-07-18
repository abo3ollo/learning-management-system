// app/(pages)/aptitude/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
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

// بيانات تجريبية للمعلمين (سيتم استبدالها بـ Convex لاحقاً)
const teachersData = [
  {
    id: 1,
    name: "أحمد محمد",
    nameEn: "Ahmed Mohamed",
    subjects: ["رياضيات", "فيزياء"],
    experience: 8,
    rating: 4.9,
    students: 156,
    price: 120,
    pricePerHour: 150,
    image: "/images/teacher1.jpg",
    bio: "خبير في تدريس الرياضيات والفيزياء مع 8 سنوات من الخبرة في المدارس الدولية",
    bioEn: "Expert in teaching Mathematics and Physics with 8 years of experience in international schools",
    qualifications: ["ماجستير في الرياضيات", "بكالوريوس في الفيزياء"],
    specialties: ["الرياضيات المتقدمة", "الفيزياء الكلاسيكية", "التحصيل الدراسي"],
    available: true,
    materials: {
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
    },
  },
  {
    id: 2,
    name: "سارة علي",
    nameEn: "Sara Ali",
    subjects: ["لغة عربية", "لغة إنجليزية"],
    experience: 6,
    rating: 4.8,
    students: 120,
    price: 100,
    pricePerHour: 130,
    image: "/images/teacher2.jpg",
    bio: "متخصصة في تدريس اللغات مع خبرة في المدارس الأمريكية والبريطانية",
    bioEn: "Specialized in teaching languages with experience in American and British schools",
    qualifications: ["ماجستير في اللغة الإنجليزية", "بكالوريوس في اللغة العربية"],
    specialties: ["القواعد النحوية", "المحادثة", "الكتابة الأكاديمية"],
    available: true,
    materials: {
      pdfs: [
        { id: 3, title: "قواعد اللغة العربية", size: "3.2 MB", url: "#" },
        { id: 4, title: "English Grammar", size: "2.1 MB", url: "#" },
      ],
      videos: [
        { id: 3, title: "شرح القواعد النحوية", duration: "18:20", url: "#" },
        { id: 4, title: "English Conversation", duration: "25:00", url: "#" },
      ],
      exams: [
        { id: 3, title: "اختبار لغة عربية", questions: 25, time: "50 دقيقة", url: "#" },
      ],
      assignments: [
        { id: 3, title: "واجب قواعد", deadline: "2024-02-18", url: "#" },
      ],
      revisions: [
        { id: 3, title: "مراجعة لغة عربية", url: "#" },
      ],
    },
  },
  {
    id: 3,
    name: "محمد خالد",
    nameEn: "Mohamed Khaled",
    subjects: ["كيمياء", "أحياء"],
    experience: 10,
    rating: 4.9,
    students: 200,
    price: 140,
    pricePerHour: 170,
    image: "/images/teacher3.jpg",
    bio: "خبير في العلوم مع 10 سنوات من الخبرة في الجامعات والمدارس",
    bioEn: "Expert in sciences with 10 years of experience in universities and schools",
    qualifications: ["دكتوراه في الكيمياء", "ماجستير في الأحياء"],
    specialties: ["الكيمياء العضوية", "الأحياء الجزيئية", "التحصيل العلمي"],
    available: true,
    materials: {
      pdfs: [
        { id: 5, title: "ملخص كيمياء عضوية", size: "4.5 MB", url: "#" },
        { id: 6, title: "مراجعة أحياء", size: "3.8 MB", url: "#" },
      ],
      videos: [
        { id: 5, title: "شرح التفاعلات الكيميائية", duration: "20:15", url: "#" },
        { id: 6, title: "الخلية والأنسجة", duration: "28:30", url: "#" },
      ],
      exams: [
        { id: 5, title: "اختبار كيمياء", questions: 30, time: "60 دقيقة", url: "#" },
        { id: 6, title: "اختبار أحياء", questions: 25, time: "50 دقيقة", url: "#" },
      ],
      assignments: [
        { id: 5, title: "واجب كيمياء", deadline: "2024-02-22", url: "#" },
        { id: 6, title: "واجب أحياء", deadline: "2024-02-25", url: "#" },
      ],
      revisions: [
        { id: 5, title: "مراجعة كيمياء", url: "#" },
        { id: 6, title: "مراجعة أحياء", url: "#" },
      ],
    },
  },
  {
    id: 4,
    name: "نورة عبدالله",
    nameEn: "Nora Abdullah",
    subjects: ["رياضيات", "فيزياء", "كيمياء"],
    experience: 5,
    rating: 4.7,
    students: 98,
    price: 110,
    pricePerHour: 140,
    image: "/images/teacher4.jpg",
    bio: "معلمة متخصصة في المواد العلمية مع خبرة في المدارس الثانوية",
    bioEn: "Teacher specialized in scientific subjects with experience in high schools",
    qualifications: ["ماجستير في الفيزياء", "بكالوريوس في الرياضيات"],
    specialties: ["الرياضيات التطبيقية", "الفيزياء الحديثة"],
    available: true,
    materials: {
      pdfs: [
        { id: 7, title: "ملخص رياضيات", size: "2.8 MB", url: "#" },
      ],
      videos: [
        { id: 7, title: "شرح التفاضل", duration: "19:45", url: "#" },
      ],
      exams: [
        { id: 7, title: "اختبار رياضيات", questions: 20, time: "45 دقيقة", url: "#" },
      ],
      assignments: [
        { id: 7, title: "واجب رياضيات", deadline: "2024-02-28", url: "#" },
      ],
      revisions: [
        { id: 7, title: "مراجعة فيزياء", url: "#" },
      ],
    },
  },
];

// صفحة القدرات الرئيسية
export default function AptitudePage() {
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // فلترة المعلمين حسب البحث
  const filteredTeachers = teachersData.filter((teacher) => {
    const search = searchQuery.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(search) ||
      teacher.nameEn.toLowerCase().includes(search) ||
      teacher.subjects.some((s) => s.toLowerCase().includes(search)) ||
      teacher.bio.toLowerCase().includes(search) ||
      teacher.bioEn.toLowerCase().includes(search)
    );
  });

  // اختيار معلم
  const selectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setSelectedSubjects(teacher.subjects);
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

    const materials = selectedTeacher.materials;

    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#001f24] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {lang === "ar" ? selectedTeacher.name : selectedTeacher.nameEn}
              </h2>
              <p className="text-[#a3ced6] text-sm">
                {lang === "ar" ? "المواد التعليمية" : "Educational Materials"}
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
                      <span>{exam.questions} سؤال</span>
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
                    <p className="text-[#a3ced6] text-sm">تسليم: {assignment.deadline}</p>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 bg-white">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#1a7a8a]">
                      {teacher.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#0a2540] text-lg">
                      {lang === "ar" ? teacher.name : teacher.nameEn}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span>{teacher.rating}</span>
                      <span>•</span>
                      <span>{teacher.students} {lang === "ar" ? "طالب" : "students"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject) => (
                      <Badge key={subject} className="bg-[#1a7a8a]/10 text-[#1a7a8a] border-none">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {lang === "ar" ? teacher.bio : teacher.bioEn}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{teacher.experience} {lang === "ar" ? "سنوات خبرة" : "years experience"}</span>
                  </div>
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

        {filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {lang === "ar" ? "لا توجد نتائج مطابقة للبحث" : "No results match your search"}
            </p>
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
                      {selectedTeacher.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540]">
                      {lang === "ar" ? selectedTeacher.name : selectedTeacher.nameEn}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedTeacher.subjects.join(" • ")}
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
                  <span className="font-semibold">{selectedTeacher.price} ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {lang === "ar" ? "رسوم الخدمة" : "Service Fee"}
                  </span>
                  <span className="font-semibold">20 ر.س</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                  <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
                  <span className="text-[#1a7a8a]">{selectedTeacher.price + 20} ر.س</span>
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