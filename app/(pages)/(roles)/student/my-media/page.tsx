// app/(pages)/(roles)/student/my-media/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Search,
  Grid3X3,
  List,
  FolderOpen,
  FileText,
  Image,
  Video,
  Music,
  FileArchive,
  Calendar,
  Clock,
  ExternalLink,
  
  Play,
  Loader2,
  X,
  Download,
  Eye,
} from "lucide-react";
import { BsYoutube } from "react-icons/bs";

// ─── Helpers ────────────────────────────────────────────────────
function formatBytes(bytes?: number) {
  if (!bytes || bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const videoId = getYouTubeId(url);
  if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return null;
}

function FileIcon({ file, className }: { file: any; className?: string }) {
  const cls = className || "h-12 w-12 mx-auto mb-3";
  
  if (file.type === "youtube") {
    const thumbnail = getYouTubeThumbnail(file.url);
    if (thumbnail) {
      return (
        <div className="relative w-full h-full">
          <img 
            src={thumbnail} 
            alt={file.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      );
    }
    return <BsYoutube className={`${cls} text-red-500`} />;
  }
  
  if (file.type === "image") return <Image className={`${cls} text-blue-400`} />;
  if (file.type === "video") return <Video className={`${cls} text-purple-400`} />;
  if (file.type === "pdf") return <FileText className={`${cls} text-red-400`} />;
  if (file.type === "audio") return <Music className={`${cls} text-green-400`} />;
  return <FileArchive className={`${cls} text-gray-400`} />;
}

// ─── Media Player Modal ─────────────────────────────────────────
function MediaPlayerModal({ file, onClose }: { file: any; onClose: () => void }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!file) return null;

  const isYoutube = file.type === "youtube";
  const isImage = file.type === "image";
  const isVideo = file.type === "video";
  const isPdf = file.type === "pdf";
  const isAudio = file.type === "audio";

  const youtubeId = isYoutube ? getYouTubeId(file.url) : null;
  const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <FileIcon file={file} className="h-8 w-8" />
            <div>
              <h2 className="text-lg font-bold">{file.name}</h2>
              <p className="text-xs text-[#a3ced6]">
                {file.type === "youtube" ? "يوتيوب" : 
                 file.type === "image" ? "صورة" : 
                 file.type === "video" ? "فيديو" : 
                 file.type === "pdf" ? "PDF" : "ملف"}
                {file.size > 0 && ` • ${formatBytes(file.size)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* YouTube */}
          {isYoutube && embedUrl && (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {showVideo ? (
                <iframe
                  src={embedUrl}
                  title={file.name}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <div 
                  className="relative w-full h-full cursor-pointer group"
                  onClick={() => setShowVideo(true)}
                >
                  <img
                    src={getYouTubeThumbnail(file.url) || ""}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white mr-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image */}
          {isImage && (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 max-h-125 overflow-hidden">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-125 object-contain rounded-lg"
              />
            </div>
          )}

          {/* Video */}
          {isVideo && (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={file.url}
                controls
                className="w-full h-full"
                poster={file.thumbnailUrl}
              />
            </div>
          )}

          {/* Audio */}
          {isAudio && (
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="text-center">
                <Music className="h-20 w-20 mx-auto text-[#1a7a8a] mb-4" />
                <h3 className="text-lg font-semibold text-[#001f24]">{file.name}</h3>
                <audio
                  src={file.url}
                  controls
                  className="w-full mt-4"
                />
              </div>
            </div>
          )}

          {/* PDF */}
          {isPdf && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FileText className="h-20 w-20 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-[#001f24] mb-2">{file.name}</h3>
              <p className="text-sm text-gray-500 mb-4">📄 مستند PDF</p>
              <div className="flex justify-center gap-3">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#001f24] hover:bg-[#03363d] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  عرض المستند
                </a>
                <a
                  href={file.url}
                  download
                  className="flex items-center gap-2 border border-[#c0c8c9] hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  تحميل
                </a>
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-[#f7fafa] rounded-lg p-3">
              <p className="text-xs text-gray-500">اسم الملف</p>
              <p className="font-medium text-[#001f24]">{file.name}</p>
            </div>
            <div className="bg-[#f7fafa] rounded-lg p-3">
              <p className="text-xs text-gray-500">النوع</p>
              <p className="font-medium text-[#001f24] capitalize">
                {file.type === "youtube" ? "يوتيوب" : file.type}
              </p>
            </div>
            {file.size > 0 && (
              <div className="bg-[#f7fafa] rounded-lg p-3">
                <p className="text-xs text-gray-500">الحجم</p>
                <p className="font-medium text-[#001f24]">{formatBytes(file.size)}</p>
              </div>
            )}
            <div className="bg-[#f7fafa] rounded-lg p-3">
              <p className="text-xs text-gray-500">تاريخ الرفع</p>
              <p className="font-medium text-[#001f24]">{formatDate(file.uploadedAt)}</p>
            </div>
            {file.assignmentTitle && (
              <div className="bg-[#f7fafa] rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500">التعيين</p>
                <p className="font-medium text-[#001f24]">{file.assignmentTitle}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-[#c0c8c9] hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              فتح في نافذة جديدة
            </a>
            <a
              href={file.url}
              download
              className="flex items-center gap-2 bg-[#001f24] hover:bg-[#03363d] text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              تحميل
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function StudentMediaPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  const studentMedia = useQuery(api.media.mediaassignments.getStudentMedia,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser?.role !== "student") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser || currentUser.role !== "student") {
    return (
      <div className="flex items-center justify-center h-full bg-[#f7fafa]">
        <Loader2 className="h-12 w-12 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  const isLoading = studentMedia === undefined;
  const mediaFiles = studentMedia?.mediaFiles || [];
  const assignments = studentMedia?.assignments || [];

  const filteredFiles = mediaFiles.filter((file: any) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: filteredFiles.length,
    images: filteredFiles.filter((f: any) => f.type === "image").length,
    videos: filteredFiles.filter((f: any) => f.type === "video" || f.type === "youtube").length,
    documents: filteredFiles.filter((f: any) => f.type === "pdf" || f.type === "audio").length,
  };

  return (
    <div className="min-h-full bg-[#f7fafa] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#001f24]">وسائطي</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              جميع الملفات والوسائط المتاحة لك
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {mediaFiles.length} ملف
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.total}</p>
                <p className="text-xs text-gray-500">إجمالي الملفات</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.images}</p>
                <p className="text-xs text-gray-500">صور</p>
              </div>
              <Image className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.videos}</p>
                <p className="text-xs text-gray-500">فيديو / يوتيوب</p>
              </div>
              <Video className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.documents}</p>
                <p className="text-xs text-gray-500">مستندات</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث باسم الملف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>

            <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#1a7a8a] text-white" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#1a7a8a] text-white" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#1a7a8a]" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#c0c8c9] p-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery ? "لا توجد ملفات تطابق البحث" : "لا توجد ملفات متاحة لك حالياً"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              سيتم عرض الملفات والوسائط التي يخصصها لك المعلمون هنا
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map((file: any) => (
              <div
                key={file._id}
                onClick={() => setSelectedFile(file)}
                className="bg-white border border-[#c0c8c9] rounded-xl overflow-hidden cursor-pointer hover:border-[#1a7a8a] hover:shadow-md transition-all group"
              >
                {file.type === "youtube" ? (
                  <div className="relative w-full aspect-video bg-gray-900">
                    {(() => {
                      const thumbnail = getYouTubeThumbnail(file.url);
                      return thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                              <Play className="h-5 w-5 text-white mr-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BsYoutube className="h-12 w-12 text-red-500" />
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-[#f7fafa] group-hover:bg-[#e0f5f7] transition-colors">
                    <FileIcon file={file} className="h-14 w-14" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs text-[#001f24] font-medium text-center truncate w-full">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-0.5">
                    {file.type === "youtube" ? "يوتيوب" : formatBytes(file.size)}
                  </p>
                  {file.assignmentTitle && (
                    <p className="text-[10px] text-[#1a7a8a] text-center truncate mt-1">
                      📚 {file.assignmentTitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الملف</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحجم</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التعيين</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاريخ الرفع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredFiles.map((file: any) => (
                    <tr key={file._id} className="hover:bg-[#f7fafa] cursor-pointer" onClick={() => setSelectedFile(file)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded flex items-center justify-center">
                            <FileIcon file={file} className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#001f24]">{file.name}</p>
                            {file.type === "youtube" && (
                              <p className="text-xs text-red-500">يوتيوب</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {file.type === "image" ? "صورة" : 
                         file.type === "youtube" ? "يوتيوب" : 
                         file.type === "video" ? "فيديو" : 
                         file.type === "pdf" ? "PDF" : file.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {file.type === "youtube" ? "—" : formatBytes(file.size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {file.assignmentTitle || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(file.uploadedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-gray-100 rounded-lg">
                          <Play className="h-4 w-4 text-[#1a7a8a]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        {filteredFiles.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-400">
            عرض {filteredFiles.length} من {mediaFiles.length} ملف
          </div>
        )}
      </div>

      {/* Media Player Modal */}
      {selectedFile && (
        <MediaPlayerModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}