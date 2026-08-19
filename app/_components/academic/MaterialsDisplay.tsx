// app/_components/academic/MaterialsDisplay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  X,
  FileText,
  Video,
  BookOpen,
  CheckCircle,
  Download,
  Play,
  Eye,
  Loader2,
  Calendar,
  File,
  Image,
  Film,
  User,
  GraduationCap,
  Clock,
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
        if (material.fileUrl && typeof material.fileUrl === 'string') {
          try {
            if (material.fileUrl.startsWith('storage:')) {
              // يمكن استخدام API لجلب الرابط
            } else {
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
    materialsCount: lang === "ar" ? "مادة" : "materials",
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
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-16 w-16 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t.noMaterials}</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item: any) => {
          const title = lang === "ar" ? item.titleAr || item.title : item.title;
          const fileUrl = getFileUrl(item);
          const FileIcon = getFileIcon(item.type, fileUrl);

          switch (type) {
            case "pdf":
              return (
                <div
                  key={item._id}
                  className="bg-white/5 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-all border border-white/10 hover:border-[#1a7a8a]/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1a7a8a]/20 flex items-center justify-center shrink-0">
                        <FileIcon className="h-5 w-5 text-[#1a7a8a]" />
                      </div>
                      <div>
                        <p className="text-white font-medium truncate">{title}</p>
                        <p className="text-[#a3ced6] text-sm">{item.fileSize || "2.5 MB"}</p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-[#a3ced6] text-xs mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 ml-4"
                    >
                      <Button
                        variant="outline"
                        className="border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#1a7a8a] hover:text-white transition-all"
                      >
                        <Download className="h-4 w-4 ml-2" />
                        {t.download}
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "video":
              return (
                <div
                  key={item._id}
                  className="bg-white/5 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-all border border-white/10 hover:border-[#1a7a8a]/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Film className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium truncate">{title}</p>
                        <p className="text-[#a3ced6] text-sm">{item.duration || "15:30"}</p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-[#a3ced6] text-xs mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 ml-4"
                    >
                      <Button
                        variant="outline"
                        className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Play className="h-4 w-4 ml-2" />
                        {t.watch}
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "exam":
              return (
                <div
                  key={item._id}
                  className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-all border border-white/10 hover:border-purple-500/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{title}</p>
                      <div className="flex items-center gap-3 text-[#a3ced6] text-sm">
                        <span>{item.questions || 20} {t.questions}</span>
                        <span>•</span>
                        <span>{item.duration || "45 دقيقة"}</span>
                      </div>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-[#a3ced6] text-xs mt-2 line-clamp-2">{item.description}</p>
                  )}
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white transition-all">
                        {t.startExam}
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "assignment":
              return (
                <div
                  key={item._id}
                  className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-all border border-white/10 hover:border-green-500/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{title}</p>
                      <p className="text-[#a3ced6] text-sm">
                        {t.deadline}: {item.deadline ? new Date(item.deadline).toLocaleDateString("ar-EG") : "2024-02-15"}
                      </p>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-[#a3ced6] text-xs mt-2 line-clamp-2">{item.description}</p>
                  )}
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white transition-all">
                        {t.submitAssignment}
                      </Button>
                    </a>
                  )}
                </div>
              );

            case "revision":
              return (
                <div
                  key={item._id}
                  className="bg-white/5 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-all border border-white/10 hover:border-amber-500/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Eye className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium truncate">{title}</p>
                        {item.description && (
                          <p className="text-[#a3ced6] text-xs mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 ml-4"
                    >
                      <Button
                        variant="outline"
                        className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white transition-all"
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        {t.view}
                      </Button>
                    </a>
                  )}
                </div>
              );

            default:
              return (
                <div
                  key={item._id}
                  className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <p className="text-white font-medium">{title}</p>
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-3 w-full bg-[#1a7a8a] hover:bg-[#15707e] text-white transition-all">
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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1a7a8a]/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#1a7a8a]">
                {teacher.name?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{teacher.name}</h2>
              <p className="text-[#a3ced6] text-sm">
                {teacher.specialization || teacher.subjects?.join(" • ")}
              </p>
              <p className="text-xs text-[#a3ced6] mt-1">
                {materials.length} {t.materialsCount}
              </p>
            </div>
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
            <p className="text-[#a3ced6] text-xs flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              {t.experience}
            </p>
            <p className="text-white font-bold">{teacher.experience || 0} {lang === "ar" ? "سنوات" : "y"}</p>
          </div>
          <div className="text-center">
            <p className="text-[#a3ced6] text-xs flex items-center justify-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {t.qualification}
            </p>
            <p className="text-white font-bold text-sm truncate">
              {teacher.qualification || "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#a3ced6] text-xs flex items-center justify-center gap-1">
              <User className="h-3 w-3" />
              {t.specialization}
            </p>
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
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-[#a3ced6]">
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
              <BookOpen className="h-4 w-4 ml-2" />
              {t.exams}
              {groupedMaterials.exams.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.exams.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <CheckCircle className="h-4 w-4 ml-2" />
              {t.assignments}
              {groupedMaterials.assignments.length > 0 && (
                <Badge className="ml-1 bg-[#1a7a8a]/30 text-white text-xs">
                  {groupedMaterials.assignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="revisions" className="data-[state=active]:bg-[#1a7a8a] data-[state=active]:text-white">
              <Eye className="h-4 w-4 ml-2" />
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