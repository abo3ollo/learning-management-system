"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  X, FileText, Video, BookOpen, CheckCircle, 
  Download, Play, Eye, Loader2, Calendar, File, Image, Film 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MaterialsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  materials: any[];
  lang: "en" | "ar";
}

export function MaterialsDisplay({
  isOpen,
  onClose,
  teacher,
  materials,
  lang,
}: MaterialsDisplayProps) {
  const [activeTab, setActiveTab] = useState("pdfs");
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);

  // ✅ جلب روابط الملفات المخزنة في Convex
  useEffect(() => {
    const fetchFileUrls = async () => {
      if (!materials || materials.length === 0) return;
      
      setIsLoadingUrls(true);
      const urls: Record<string, string> = {};
      
      for (const material of materials) {
        // إذا كان fileUrl يبدو كـ storageId (يبدأ بـ "storage:")
        if (material.fileUrl && typeof material.fileUrl === 'string') {
          try {
            // محاولة جلب الرابط من Convex Storage
            // ملاحظة: هذا يعتمد على كيفية تخزين الملفات
            // إذا كان storageId، استخدم الدالة المناسبة
            if (material.fileUrl.startsWith('storage:')) {
              // يمكن استخدام API لجلب الرابط
              // const url = await api.teacherMaterials.teacherMaterials.getMaterialFileUrl({ storageId: material.fileUrl });
              // urls[material._id] = url;
            } else {
              // إذا كان رابط مباشر
              urls[material._id] = material.fileUrl;
            }
          } catch (error) {
            console.error("Error fetching file URL:", error);
          }
        }
      }
      
      setFileUrls(urls);
      setIsLoadingUrls(false);
    };

    fetchFileUrls();
  }, [materials]);

  if (!isOpen || !teacher) return null;

  // ✅ تجميع المواد حسب النوع
  const groupedMaterials = {
    pdfs: materials.filter((m) => m.type === "pdf"),
    videos: materials.filter((m) => m.type === "video"),
    exams: materials.filter((m) => m.type === "exam"),
    assignments: materials.filter((m) => m.type === "assignment"),
    revisions: materials.filter((m) => m.type === "revision"),
  };

  const t = {
    close: lang === "ar" ? "إغلاق" : "Close",
    experience: lang === "ar" ? "سنوات خبرة" : "Years Experience",
    qualification: lang === "ar" ? "المؤهل" : "Qualification",
    specialization: lang === "ar" ? "التخصص" : "Specialization",
    status: lang === "ar" ? "الحالة" : "Status",
    active: lang === "ar" ? "نشط" : "Active",
    inactive: lang === "ar" ? "غير نشط" : "Inactive",
    pdfs: lang === "ar" ? "ملفات PDF" : "PDFs",
    videos: lang === "ar" ? "فيديوهات" : "Videos",
    exams: lang === "ar" ? "امتحانات" : "Exams",
    assignments: lang === "ar" ? "واجبات" : "Assignments",
    revisions: lang === "ar" ? "مراجعات" : "Revisions",
    startExam: lang === "ar" ? "بدء الاختبار" : "Start Exam",
    submitAssignment: lang === "ar" ? "تقديم الواجب" : "Submit Assignment",
    view: lang === "ar" ? "عرض" : "View",
    download: lang === "ar" ? "تحميل" : "Download",
    watch: lang === "ar" ? "مشاهدة" : "Watch",
    questions: lang === "ar" ? "سؤال" : "questions",
    deadline: lang === "ar" ? "تسليم" : "Deadline",
    noMaterials: lang === "ar" ? "لا توجد مواد متاحة حالياً" : "No materials available",
    loading: lang === "ar" ? "جاري التحميل..." : "Loading...",
  };

  // ✅ الحصول على رابط الملف
  const getFileUrl = (material: any) => {
    if (fileUrls[material._id]) {
      return fileUrls[material._id];
    }
    return material.fileUrl || null;
  };

  // ✅ الحصول على أيقونة الملف حسب النوع
  const getFileIcon = (type: string, fileUrl?: string) => {
    if (type === "pdf") return FileText;
    if (type === "video") return Film;
    if (fileUrl) {
      const ext = fileUrl.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return Image;
      if (['doc', 'docx'].includes(ext || '')) return FileText;
    }
    return File;
  };

  const renderMaterialsList = (items: any[], type: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>{t.noMaterials}</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((item: any) => {
          const title = lang === "ar" ? item.titleAr || item.title : item.title;
          const fileUrl = getFileUrl(item);
          const FileIcon = getFileIcon(item.type, fileUrl);
          const isStorageFile = fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('storage:');

          switch (type) {
            case "pdf":
              return (
                <div key={item._id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5 text-[#1a7a8a] shrink-0" />
                      <p className="text-white font-medium truncate">{title}</p>
                    </div>
                    <p className="text-[#a3ced6] text-sm mt-1">{item.fileSize || "2.5 MB"}</p>
                    {item.description && (
                      <p className="text-[#a3ced6] text-xs mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  {fileUrl && (
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="shrink-0 ml-3"
                    >
                      <Button variant="outline" className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "video":
              return (
                <div key={item._id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Film className="h-5 w-5 text-[#1a7a8a] shrink-0" />
                      <p className="text-white font-medium truncate">{title}</p>
                    </div>
                    <p className="text-[#a3ced6] text-sm mt-1">{item.duration || "15:30"}</p>
                    {item.description && (
                      <p className="text-[#a3ced6] text-xs mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  {fileUrl && (
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="shrink-0 ml-3"
                    >
                      <Button variant="outline" className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white">
                        <Play className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "exam":
              return (
                <div key={item._id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all border border-white/10">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#1a7a8a] shrink-0" />
                    <p className="text-white font-medium">{title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[#a3ced6] text-sm mt-1">
                    <span>{item.questions || 20} {t.questions}</span>
                    <span>•</span>
                    <span>{item.duration || "45 دقيقة"}</span>
                  </div>
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-2 w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                        {t.startExam}
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "assignment":
              return (
                <div key={item._id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all border border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#1a7a8a] shrink-0" />
                    <p className="text-white font-medium">{title}</p>
                  </div>
                  <p className="text-[#a3ced6] text-sm mt-1">
                    {t.deadline}: {item.deadline ? new Date(item.deadline).toLocaleDateString("ar-EG") : "2024-02-15"}
                  </p>
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-2 w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                        {t.submitAssignment}
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "revision":
              return (
                <div key={item._id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all border border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-[#1a7a8a] shrink-0" />
                      <p className="text-white font-medium truncate">{title}</p>
                    </div>
                    {item.description && (
                      <p className="text-[#a3ced6] text-xs mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  {fileUrl && (
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="shrink-0 ml-3"
                    >
                      <Button variant="outline" className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              );

            default:
              return (
                <div key={item._id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all border border-white/10">
                  <p className="text-white font-medium">{title}</p>
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-2 w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white">
                        {t.view}
                      </Button>
                    </a>
                  )}
                </div>
              );
          }
        })}
      </div>
    );
  };

  // ✅ عرض حالة التحميل
  if (isLoadingUrls) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="bg-[#001f24] rounded-2xl p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1a7a8a] mx-auto mb-4" />
          <p className="text-white">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#001f24] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#001f24] z-10 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">{teacher.name}</h2>
            <p className="text-[#a3ced6] text-sm">
              {teacher.specialization || teacher.subjects?.join(" • ")}
            </p>
            {/* ✅ عرض عدد المواد */}
            <p className="text-xs text-[#a3ced6] mt-1">
              {materials.length} {lang === "ar" ? "مادة" : "materials"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-3xl p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Teacher Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-white/5 rounded-xl">
          <div className="text-center">
            <p className="text-[#a3ced6] text-xs">{t.experience}</p>
            <p className="text-white font-bold">{teacher.experience || 0} {lang === "ar" ? "سنوات" : "y"}</p>
          </div>
          <div className="text-center">
            <p className="text-[#a3ced6] text-xs">{t.qualification}</p>
            <p className="text-white font-bold text-sm truncate">
              {teacher.qualification || "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#a3ced6] text-xs">{t.specialization}</p>
            <p className="text-white font-bold text-sm truncate">
              {teacher.specialization || "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#a3ced6] text-xs">{t.status}</p>
            <Badge className={teacher.status === "active" ? "bg-green-500" : "bg-gray-500"}>
              {teacher.status === "active" ? t.active : t.inactive}
            </Badge>
          </div>
        </div>

        {/* ✅ عرض إجمالي عدد المواد في كل تبويب */}
        <div className="flex gap-4 mb-4 text-sm text-[#a3ced6]">
          <span>📄 PDF: {groupedMaterials.pdfs.length}</span>
          <span>🎬 فيديو: {groupedMaterials.videos.length}</span>
          <span>📝 امتحانات: {groupedMaterials.exams.length}</span>
          <span>📋 واجبات: {groupedMaterials.assignments.length}</span>
          <span>🔄 مراجعات: {groupedMaterials.revisions.length}</span>
        </div>

        {/* Materials Tabs */}
        <Tabs defaultValue="pdfs" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 gap-2 bg-white/5 p-1 rounded-xl">
            <TabsTrigger value="pdfs" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <FileText className="h-4 w-4 ml-2" />
              {t.pdfs}
              {groupedMaterials.pdfs.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.pdfs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <Video className="h-4 w-4 ml-2" />
              {t.videos}
              {groupedMaterials.videos.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.videos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <FileText className="h-4 w-4 ml-2" />
              {t.exams}
              {groupedMaterials.exams.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.exams.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 ml-2" />
              {t.assignments}
              {groupedMaterials.assignments.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.assignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="revisions" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <CheckCircle className="h-4 w-4 ml-2" />
              {t.revisions}
              {groupedMaterials.revisions.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.revisions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdfs" className="mt-4">
            {renderMaterialsList(groupedMaterials.pdfs, "pdf")}
          </TabsContent>
          <TabsContent value="videos" className="mt-4">
            {renderMaterialsList(groupedMaterials.videos, "video")}
          </TabsContent>
          <TabsContent value="exams" className="mt-4">
            {renderMaterialsList(groupedMaterials.exams, "exam")}
          </TabsContent>
          <TabsContent value="assignments" className="mt-4">
            {renderMaterialsList(groupedMaterials.assignments, "assignment")}
          </TabsContent>
          <TabsContent value="revisions" className="mt-4">
            {renderMaterialsList(groupedMaterials.revisions, "revision")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}