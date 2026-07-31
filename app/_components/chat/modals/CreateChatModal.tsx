// app/_components/chat/modals/CreateChatModal.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Users,
  GraduationCap,
  User,
  Search,
  UserPlus,
  Check,
  UserCheck,
  UsersRound,
} from "lucide-react";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  isLoading: boolean;
}

type ChatType = "grade" | "group" | "teachers" | "parents" | "direct";

export function CreateChatModal({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: CreateChatModalProps) {
  // State hooks
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [chatType, setChatType] = useState<ChatType>("grade");
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "student" | "teacher" | "parent" | "admin">("all");

  // ✅ Query hooks - استخدم المسارات الصحيحة
  const grades = useQuery(api.grades.grades.getActiveGrades);
  const groups = useQuery(api.groups.groups.getAllActiveGroups);
  
  // ✅ جلب جميع المستخدمين (وليس فقط المستخدم الحالي)
  const allUsers = useQuery(api.user.auth.getCurrentUser);

  // ✅ 2. useMemo hooks
  const filteredGroups = useMemo(() => {
    if (!groups || !selectedGradeId) return [];
    return groups.filter((group: any) => group.gradeId === selectedGradeId);
  }, [groups, selectedGradeId]);

  // ✅ 3. تصفية المستخدمين
  const filteredUsers = useMemo(() => {
    // ✅ التأكد من أن allUsers هو مصفوفة
    if (!allUsers || !Array.isArray(allUsers)) return [];

    let users = allUsers.filter((user: any) => user.status === "active");

    // Filter by user type for direct chat
    if (chatType === "direct" && userTypeFilter !== "all") {
      users = users.filter((user: any) => user.role === userTypeFilter);
    }

    // Filter by search
    if (userSearch.trim()) {
      const searchLower = userSearch.toLowerCase();
      users = users.filter((user: any) => {
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const studentIdMatch = user.studentId?.toLowerCase().includes(searchLower);
        const teacherIdMatch = user.teacherId?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch || studentIdMatch || teacherIdMatch;
      });
    }

    return users;
  }, [allUsers, chatType, userTypeFilter, userSearch]);

  // ✅ 4. useCallback hooks
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      type: chatType === "direct" ? "direct" : "group",
      isPrivate,
      participants: selectedUsers,
      isGroupChat: chatType !== "direct",
    };

    if (chatType === "grade" && selectedGradeId) {
      data.addGradeId = selectedGradeId;
    }

    if (chatType === "group" && selectedGroupId) {
      data.addGroupId = selectedGroupId;
    }

    if (chatType === "teachers") {
      data.addAllTeachers = true;
    }

    if (chatType === "parents") {
      data.addAllParents = true;
    }

    await onCreate(data);
  }, [name, description, chatType, isPrivate, selectedUsers, selectedGradeId, selectedGroupId, onCreate]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const resetForm = useCallback(() => {
    setStep(1);
    setName("");
    setDescription("");
    setChatType("grade");
    setIsPrivate(true);
    setSelectedGradeId("");
    setSelectedGroupId("");
    setSelectedUsers([]);
    setUserSearch("");
    setUserTypeFilter("all");
  }, []);

  // ✅ 5. useEffect hooks
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // ✅ 6. Memoized helper functions
  const getRoleLabel = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return "مشرف";
      case "teacher":
        return "معلم";
      case "student":
        return "طالب";
      case "parent":
        return "ولي أمر";
      default:
        return role;
    }
  }, []);

  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case "admin":
        return "text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      case "teacher":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "student":
        return "text-green-500 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "parent":
        return "text-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
    }
  }, []);

  const getChatTypeLabel = useCallback((type: ChatType) => {
    switch (type) {
      case "grade":
        return "صف";
      case "group":
        return "مجموعة";
      case "teachers":
        return "معلمين";
      case "parents":
        return "أولياء أمور";
      case "direct":
        return "مباشر";
      default:
        return "";
    }
  }, []);

  const getChatTypeIcon = useCallback((type: ChatType) => {
    switch (type) {
      case "grade":
        return <GraduationCap size={24} />;
      case "group":
        return <Users size={24} />;
      case "teachers":
        return <UserCheck size={24} />;
      case "parents":
        return <UsersRound size={24} />;
      case "direct":
        return <User size={24} />;
      default:
        return <Users size={24} />;
    }
  }, []);

  // ✅ 7. Early return after ALL hooks
  if (!isOpen) return null;

  // Render functions
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نوع المحادثة
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { value: "grade", label: "صف", icon: GraduationCap },
            { value: "group", label: "مجموعة", icon: Users },
            { value: "teachers", label: "معلمين", icon: UserCheck },
            { value: "parents", label: "أولياء أمور", icon: UsersRound },
            { value: "direct", label: "مباشر", icon: User },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setChatType(option.value as ChatType);
                setSelectedUsers([]);
                setSelectedGradeId("");
                setSelectedGroupId("");
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                chatType === option.value
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <option.icon className="mx-auto mb-1" size={24} />
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {chatType === "grade" && "إضافة جميع طلاب ومعلمي الصف"}
          {chatType === "group" && "إضافة طلاب ومعلمي مجموعة محددة"}
          {chatType === "teachers" && "إضافة جميع المعلمين"}
          {chatType === "parents" && "إضافة جميع أولياء الأمور"}
          {chatType === "direct" && "اختيار أعضاء بشكل فردي"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          اسم المحادثة <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="أدخل اسم المحادثة"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          الوصف (اختياري)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="وصف المحادثة"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">
          محادثة خاصة (الدعوة فقط)
        </label>
      </div>

      <button
        type="button"
        onClick={() => setStep(2)}
        disabled={!name.trim()}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <UserPlus size={18} />
        التالي: إضافة أعضاء
      </button>
    </div>
  );

  const renderStep2 = () => {
    const isGradeOrGroup = chatType === "grade" || chatType === "group";
    const isTeachers = chatType === "teachers";
    const isParents = chatType === "parents";
    const isDirect = chatType === "direct";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {getChatTypeIcon(chatType)}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getChatTypeLabel(chatType)}
          </span>
          <span className="text-xs text-gray-400 mr-auto">
            {selectedUsers.length} عضو مختار
          </span>
        </div>

        {isGradeOrGroup && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اختيار الصف
            </label>
            <select
              value={selectedGradeId}
              onChange={(e) => {
                setSelectedGradeId(e.target.value);
                setSelectedGroupId("");
              }}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر صفاً</option>
              {grades?.map((grade: any) => (
                <option key={grade._id} value={grade._id}>
                  {grade.name} ({grade.gradeLevel})
                </option>
              ))}
            </select>
          </div>
        )}

        {chatType === "group" && selectedGradeId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اختيار المجموعة
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر مجموعة</option>
              {filteredGroups.map((group: any) => (
                <option key={group._id} value={group._id}>
                  {group.name} ({group.subject}) - {group.students?.length || 0} طالب
                </option>
              ))}
            </select>
            {filteredGroups.length === 0 && selectedGradeId && (
              <p className="text-xs text-yellow-500 mt-1">
                لا توجد مجموعات في هذا الصف
              </p>
            )}
          </div>
        )}

        {isGradeOrGroup && selectedGradeId && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Check className="inline-block ml-1" size={16} />
              سيتم إضافة جميع طلاب ومعلمي 
              {chatType === "grade" ? " الصف" : " المجموعة"} المختارة
            </p>
          </div>
        )}

        {isTeachers && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Check className="inline-block ml-1" size={16} />
              سيتم إضافة جميع المعلمين النشطين
            </p>
          </div>
        )}

        {isParents && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Check className="inline-block ml-1" size={16} />
              سيتم إضافة جميع أولياء الأمور النشطين
            </p>
          </div>
        )}

        {isDirect && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اختيار الأعضاء
            </label>
            
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث عن مستخدم..."
                  className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">الكل</option>
                <option value="student">طلاب</option>
                <option value="teacher">معلمين</option>
                <option value="parent">أولياء أمور</option>
                <option value="admin">مشرفين</option>
              </select>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="mx-auto mb-2" size={32} />
                  <p className="text-sm">
                    {userSearch.trim() ? "لا يوجد نتائج للبحث" : "لا يوجد مستخدمين متاحين"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user: any) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => toggleUserSelection(user._id)}
                    className={`w-full px-3 py-2 text-right rounded-lg flex items-center justify-between transition-colors ${
                      selectedUsers.includes(user._id)
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {user.name?.charAt(0) || "?"}
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                          {user.studentId && (
                            <span className="text-xs text-gray-400">{user.studentId}</span>
                          )}
                          {user.teacherId && (
                            <span className="text-xs text-gray-400">{user.teacherId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedUsers.includes(user._id) && (
                      <Check size={18} className="text-blue-600 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {selectedUsers.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                تم اختيار {selectedUsers.length} مستخدم
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            رجوع
          </button>
          <button
            type="submit"
            disabled={isLoading || (chatType === "direct" && selectedUsers.length === 0)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                إنشاء المحادثة
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus size={24} className="text-blue-600" />
            إنشاء محادثة جديدة
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? renderStep1() : renderStep2()}
        </form>
      </div>
    </div>
  );
}