"use client";

import { useState } from "react";
import { Check, ExternalLink, X, Loader2, ChevronDown, Calendar as CalendarIcon, Clock, Users, User, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { BsYoutube } from "react-icons/bs";
import { FaFile, FaImage, FaVideo } from "react-icons/fa";

type AssignType = "grade" | "student" | "group";

export default function MediaAssignPage() {
    const router = useRouter();

    // Form state
    const [assignTo, setAssignTo] = useState<AssignType>("grade");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [alwaysAvailable, setAlwaysAvailable] = useState(true);
    const [status, setStatus] = useState<"draft" | "published">("draft");
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Queries
    const files = useQuery(api.media.mediafiles.listMediaFiles, {});
    const grades = useQuery(api.grades.grades.getActiveGrades, {});
    const students = useQuery(api.user.students.getStudents, {});
    const groups = useQuery(api.groups.groups.getGroups, {});

    // Mutation
    const createAssignment = useMutation(api.media.mediaassignments.createMediaAssignment);

    // Filtered options for dropdowns
    const filteredGrades = grades?.filter((g: any) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const filteredStudents = students?.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const filteredGroups = groups?.filter((g: any) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const toggleFile = (id: string) => {
        setSelectedFiles((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    const handleSelectGrade = (id: string) => {
        setSelectedGrade(id);
        setShowGradeDropdown(false);
        setSearchQuery("");
    };

    const handleSelectStudent = (id: string) => {
        setSelectedStudent(id);
        setShowStudentDropdown(false);
        setSearchQuery("");
    };

    const handleSelectGroup = (id: string) => {
        setSelectedGroup(id);
        setShowGroupDropdown(false);
        setSearchQuery("");
    };

    const handleSubmit = async () => {
        setError(null);

        // Validate based on assignTo type
        let targetId = "";
        let assignToType = "";

        if (assignTo === "grade" && !selectedGrade) {
            setError("يرجى اختيار الصف");
            return;
        } else if (assignTo === "grade") {
            targetId = selectedGrade;
            assignToType = "grade";
        } else if (assignTo === "student" && !selectedStudent) {
            setError("يرجى اختيار الطالب");
            return;
        } else if (assignTo === "student") {
            targetId = selectedStudent;
            assignToType = "student";
        } else if (assignTo === "group" && !selectedGroup) {
            setError("يرجى اختيار المجموعة");
            return;
        } else if (assignTo === "group") {
            targetId = selectedGroup;
            assignToType = "group";
        }

        if (!title.trim()) {
            setError("يرجى إدخال عنوان");
            return;
        }
        if (selectedFiles.length === 0) {
            setError("يرجى تحديد ملف واحد على الأقل");
            return;
        }

        setIsSubmitting(true);
        try {
            await createAssignment({
                mediaFileIds: selectedFiles as Id<"mediaFiles">[],
                assignTo: assignToType as any,
                targetId: targetId as any,
                title: title.trim(),
                description: description.trim() || undefined,
                dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
                alwaysAvailable,
                status,
                availability: alwaysAvailable ? "media.always" : "media.scheduled",
            });

            router.push("/admin/media/assignments");
        } catch (err) {
            console.error("Assignment error:", err);
            setError(err instanceof Error ? err.message : "حدث خطأ أثناء التعيين");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSelectedLabel = () => {
        if (assignTo === "grade") {
            const found = grades?.find((g: any) => g._id === selectedGrade);
            return found ? found.name : "اختر الصف";
        }
        if (assignTo === "student") {
            const found = students?.find((s: any) => s._id === selectedStudent);
            return found ? found.name : "اختر الطالب";
        }
        if (assignTo === "group") {
            const found = groups?.find((g: any) => g._id === selectedGroup);
            return found ? `${found.name} (${found.subject})` : "اختر المجموعة";
        }
        return "اختر";
    };

    const assignTypes = [
        { value: "grade", label: "الصف", icon: Layers, description: "تعيين لجميع طلاب الصف" },
        { value: "student", label: "الطالب", icon: User, description: "تعيين لطالب محدد" },
        { value: "group", label: "المجموعة", icon: BookOpen, description: "تعيين لمجموعة محددة" },
    ];

    return (
        <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
            {/* Header */}
            <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <ExternalLink className="h-5 w-5" /> تعيينات الوسائط
                        </h1>
                        <p className="text-[#a3ced6] text-sm mt-0.5">
                            تعيين ملفات الوسائط للصفوف أو الطلاب أو المجموعات
                        </p>
                    </div>
                    <Link href="/admin/media">
                        <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl border border-white/20 transition-colors">
                            <X className="h-4 w-4" /> رجوع
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Error banner */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-3 rounded-xl flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* ── Form Section ─────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f7fafa]">
                            <h2 className="text-lg font-bold text-[#001f24]">تعيين وسائط</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Assign to - Radio Buttons */}
                            <div>
                                <label className="block text-sm font-semibold text-[#001f24] mb-3">تعيين إلى</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {assignTypes.map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = assignTo === type.value;
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => {
                                                    setAssignTo(type.value as AssignType);
                                                    setSelectedGrade("");
                                                    setSelectedStudent("");
                                                    setSelectedGroup("");
                                                    setShowGradeDropdown(false);
                                                    setShowStudentDropdown(false);
                                                    setShowGroupDropdown(false);
                                                }}
                                                className={`p-3 rounded-xl border-2 transition-all text-right ${isSelected
                                                    ? "border-[#1a7a8a] bg-[#e0f5f7]"
                                                    : "border-gray-200 hover:border-[#1a7a8a]/50 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <Icon className={`h-5 w-5 mb-2 ${isSelected ? "text-[#1a7a8a]" : "text-gray-400"}`} />
                                                <p className={`font-semibold text-sm ${isSelected ? "text-[#001f24]" : "text-gray-700"}`}>
                                                    {type.label}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">{type.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Target Selector - Dynamic Dropdown */}
                            <div>
                                <label className="block text-sm font-semibold text-[#001f24] mb-2">
                                    {assignTo === "grade" ? "اختر الصف" : assignTo === "student" ? "اختر الطالب" : "اختر المجموعة"}
                                </label>

                                {/* Grade Dropdown */}
                                {assignTo === "grade" && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                                            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                                        >
                                            <span className={selectedGrade ? "text-gray-800" : "text-gray-400"}>
                                                {getSelectedLabel()}
                                            </span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${showGradeDropdown ? "rotate-180" : ""}`} />
                                        </button>

                                        {showGradeDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                                                    <input
                                                        type="text"
                                                        placeholder="بحث..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a7a8a]"
                                                    />
                                                </div>
                                                {filteredGrades.map((grade: any) => (
                                                    <div
                                                        key={grade._id}
                                                        onClick={() => handleSelectGrade(grade._id)}
                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{grade.name}</p>
                                                            <p className="text-xs text-gray-400">{grade.nameEn}</p>
                                                        </div>
                                                        {selectedGrade === grade._id && <Check className="h-4 w-4 text-[#1a7a8a]" />}
                                                    </div>
                                                ))}
                                                {filteredGrades.length === 0 && (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Student Dropdown */}
                                {assignTo === "student" && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                                            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                                        >
                                            <span className={selectedStudent ? "text-gray-800" : "text-gray-400"}>
                                                {getSelectedLabel()}
                                            </span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${showStudentDropdown ? "rotate-180" : ""}`} />
                                        </button>

                                        {showStudentDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                                                    <input
                                                        type="text"
                                                        placeholder="بحث..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a7a8a]"
                                                    />
                                                </div>
                                                {filteredStudents.map((student: any) => (
                                                    <div
                                                        key={student._id}
                                                        onClick={() => handleSelectStudent(student._id)}
                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{student.name}</p>
                                                            <p className="text-xs text-gray-400">{student.email}</p>
                                                        </div>
                                                        {selectedStudent === student._id && <Check className="h-4 w-4 text-[#1a7a8a]" />}
                                                    </div>
                                                ))}
                                                {filteredStudents.length === 0 && (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Group Dropdown */}
                                {assignTo === "group" && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                                            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                                        >
                                            <span className={selectedGroup ? "text-gray-800" : "text-gray-400"}>
                                                {getSelectedLabel()}
                                            </span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${showGroupDropdown ? "rotate-180" : ""}`} />
                                        </button>

                                        {showGroupDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                                                    <input
                                                        type="text"
                                                        placeholder="بحث..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a7a8a]"
                                                    />
                                                </div>
                                                {filteredGroups.map((group: any) => (
                                                    <div
                                                        key={group._id}
                                                        onClick={() => handleSelectGroup(group._id)}
                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{group.name}</p>
                                                            <p className="text-xs text-gray-400">{group.subject}</p>
                                                            <p className="text-xs text-gray-400">الصف: {group.gradeName || "غير معروف"}</p>
                                                        </div>
                                                        {selectedGroup === group._id && <Check className="h-4 w-4 text-[#1a7a8a]" />}
                                                    </div>
                                                ))}
                                                {filteredGroups.length === 0 && (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-[#001f24] mb-2">
                                    العنوان <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="يرجى إدخال عنوان"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-[#001f24] mb-2">الوصف</label>
                                <textarea
                                    placeholder="وصف اختياري..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-semibold text-[#001f24] mb-2">تاريخ الاستحقاق</label>
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    disabled={alwaysAvailable}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Always available toggle */}
                            <div className="flex items-center justify-between py-2">
                                <label className="text-sm font-semibold text-[#001f24]">متاح دائماً</label>
                                <button
                                    type="button"
                                    onClick={() => setAlwaysAvailable(!alwaysAvailable)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${alwaysAvailable ? "bg-[#1a7a8a]" : "bg-gray-300"
                                        }`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${alwaysAvailable ? "right-1" : "left-1"
                                        }`} />
                                </button>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-semibold text-[#001f24] mb-2">الحالة</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="draft"
                                            checked={status === "draft"}
                                            onChange={() => setStatus("draft")}
                                            className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                                        />
                                        <span className="text-sm text-gray-700">مسودة</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="published"
                                            checked={status === "published"}
                                            onChange={() => setStatus("published")}
                                            className="w-4 h-4 text-[#1a7a8a] focus:ring-[#1a7a8a]"
                                        />
                                        <span className="text-sm text-gray-700">منشور</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="px-6 pb-6">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                {isSubmitting
                                    ? <><Loader2 className="h-5 w-5 animate-spin" /> جاري التعيين...</>
                                    : <><Check className="h-5 w-5" /> تعيين المحدد</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* ── File Selector Section ────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-[#f7fafa] flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#001f24]">اختر ملفات الوسائط</h2>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                {selectedFiles.length} ملف محدد
                            </span>
                        </div>

                        {files === undefined ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                                لا توجد ملفات — قم برفع ملفات أولاً
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 max-h-125 overflow-y-auto">
                                {files.map((file: any) => {
                                    const selected = selectedFiles.includes(file._id);
                                    const isYoutube = file.fileType === "youtube" ||
                                        file.url?.includes("youtube.com") ||
                                        file.url?.includes("youtu.be");
                                    return (
                                        <div
                                            key={file._id}
                                            onClick={() => toggleFile(file._id)}
                                            className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${selected ? "bg-[#e0f5f7]" : "hover:bg-gray-50"
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-[#1a7a8a] border-[#1a7a8a]" : "border-gray-300"
                                                }`}>
                                                {selected && <Check className="h-3 w-3 text-white" />}
                                            </div>

                                            {/* File info */}
                                            <div className="flex items-center gap-3 flex-1 mx-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-2xl">
                                                    {file.type === "image" ? <FaImage />
                                                        : file.type === "youtube" ? <BsYoutube />
                                                            : file.type === "video" ? <FaVideo />
                                                                : <FaFile />}
                                                </div>
                                                <div className="text-right min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-xs text-gray-400 capitalize">
                                                            {file.name === "youtube" ? "يوتيوب" :
                                                                file.name === "image" ? "صورة" :
                                                                    file.name === "video" ? "فيديو" : "ملف"}
                                                        </p>
                                                        {file.size > 0 && (
                                                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}