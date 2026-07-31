// app/(pages)/(roles)/student/chatbox/page.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { ChatSidebar } from "@/app/_components/chat/ChatSidebar";
import { ChatArea } from "@/app/_components/chat/ChatArea";
import { EmptyState } from "@/app/_components/chat/EmptyState";
import { CreateChatModal } from "@/app/_components/chat/modals/CreateChatModal";
import { AddMembersModal } from "@/app/_components/chat/modals/AddMembersModal";
import { ChatDetailsModal } from "@/app/_components/chat/modals/ChatDetailsModal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  School,
} from "lucide-react";
import Link from "next/link";

// Types
interface ChatGroup {
  _id: Id<"chatGroups">;
  _creationTime: number;
  name: string;
  description?: string;
  type: "group" | "class" | "grade" | "direct";
  createdBy: Id<"users">;
  isPrivate: boolean;
  isActive: boolean;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  lastMessageSender?: Id<"users">;
  unreadCount?: number;
  memberCount?: number;
  isAdmin?: boolean;
  createdAt: number;
  updatedAt: number;
  groupId?: Id<"groups">;
}

export default function StudentChatBox() {
  // State
  const [selectedChat, setSelectedChat] = useState<Id<"chatGroups"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "group" | "class" | "grade" | "direct">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ جلب محادثات الطالب
  const studentChats = useQuery(api.chat.chats.getStudentChats);

  // ✅ جلب المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ إصلاح: استدعاء getStudentGroups مع studentId من نوع Id<"users">
  const studentGroups = useQuery(
    api.groups.groups.getStudentGroups,
    currentUser?._id ? { studentId: currentUser._id } : "skip"
  );

  const selectedChatData = useQuery(
    api.chat.chats.getChatById,
    selectedChat ? { chatId: selectedChat } : "skip"
  );
  const messages = useQuery(
    api.chat.messages.getMessages,
    selectedChat ? { chatId: selectedChat, limit: 50 } : "skip"
  );

  // Mutations
  const createChat = useMutation(api.chat.chats.createChat);
  const addMultipleParticipants = useMutation(api.chat.participants.addMultipleParticipants);
  const deleteChat = useMutation(api.chat.chats.deleteChat);
  const updateChat = useMutation(api.chat.chats.updateChat);
  const sendMessage = useMutation(api.chat.messages.sendMessage);
  const deleteMessage = useMutation(api.chat.messages.deleteMessage);
  const pinMessage = useMutation(api.chat.messages.pinMessage);
  const kickParticipant = useMutation(api.chat.participants.kickParticipant);
  const changeParticipantRole = useMutation(api.chat.participants.changeParticipantRole);
  const leaveChat = useMutation(api.chat.chats.leaveChat);
  const markChatAsRead = useMutation(api.chat.messages.markChatAsRead);

  // Mark chat as read when selected
  useEffect(() => {
    if (selectedChat) {
      markChatAsRead({ chatId: selectedChat });
    }
  }, [selectedChat, markChatAsRead]);

  // Handlers
  const handleCreateChat = useCallback(async (data: any): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await createChat(data);
      toast.success("تم إنشاء المحادثة بنجاح");
      setShowCreateModal(false);
      if (result?.chatId) {
        setSelectedChat(result.chatId);
      }
    } catch (error: any) {
      toast.error(error.message || "فشل في إنشاء المحادثة");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createChat]);

  const handleAddMembers = useCallback(async (userIds: Id<"users">[]): Promise<void> => {
    if (!selectedChat) return;
    setIsLoading(true);
    try {
      await addMultipleParticipants({
        chatId: selectedChat,
        userIds,
      });
      toast.success("تم إضافة الأعضاء بنجاح");
      setShowAddMembersModal(false);
    } catch (error: any) {
      toast.error(error.message || "فشل في إضافة الأعضاء");
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, addMultipleParticipants]);

  const handleSendMessage = useCallback(async (content: string, type: string = "text"): Promise<void> => {
    if (!selectedChat || !content.trim()) return;
    try {
      await sendMessage({
        chatId: selectedChat,
        content: content.trim(),
        type: type as any,
      });
    } catch (error: any) {
      toast.error(error.message || "فشل في إرسال الرسالة");
    }
  }, [selectedChat, sendMessage]);

  const handleDeleteChat = useCallback(async (): Promise<void> => {
    if (!selectedChat) return;
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة؟ هذا الإجراء لا يمكن التراجع عنه.")) return;

    try {
      await deleteChat({ chatId: selectedChat });
      toast.success("تم حذف المحادثة بنجاح");
      setSelectedChat(null);
      setShowChatDetails(false);
    } catch (error: any) {
      toast.error(error.message || "فشل في حذف المحادثة");
    }
  }, [selectedChat, deleteChat]);

  const handleDeleteMessage = useCallback(async (messageId: Id<"chatMessages">): Promise<void> => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await deleteMessage({ messageId });
      toast.success("تم حذف الرسالة");
    } catch (error: any) {
      toast.error(error.message || "فشل في حذف الرسالة");
    }
  }, [deleteMessage]);

  const handlePinMessage = useCallback(async (messageId: Id<"chatMessages">, pin: boolean): Promise<void> => {
    try {
      await pinMessage({ messageId, pin });
      toast.success(pin ? "تم تثبيت الرسالة" : "تم إلغاء تثبيت الرسالة");
    } catch (error: any) {
      toast.error(error.message || "فشل في تعديل تثبيت الرسالة");
    }
  }, [pinMessage]);

  const handleKickMember = useCallback(async (userId: Id<"users">): Promise<void> => {
    if (!selectedChat) return;
    if (!confirm("هل أنت متأكد من طرد هذا العضو؟")) return;

    try {
      await kickParticipant({ chatId: selectedChat, userId });
      toast.success("تم طرد العضو بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل في طرد العضو");
    }
  }, [selectedChat, kickParticipant]);

  const handleChangeRole = useCallback(async (userId: Id<"users">, role: "admin" | "member"): Promise<void> => {
    if (!selectedChat) return;
    try {
      await changeParticipantRole({ chatId: selectedChat, userId, role });
      toast.success("تم تغيير الدور بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل في تغيير الدور");
    }
  }, [selectedChat, changeParticipantRole]);

  const handleLeaveChat = useCallback(async (): Promise<void> => {
    if (!selectedChat) return;
    if (!confirm("هل أنت متأكد من مغادرة هذه المحادثة؟")) return;

    try {
      await leaveChat({ chatId: selectedChat });
      toast.success("تم مغادرة المحادثة");
      setSelectedChat(null);
    } catch (error: any) {
      toast.error(error.message || "فشل في مغادرة المحادثة");
    }
  }, [selectedChat, leaveChat]);

  const handleUpdateChat = useCallback(async (data: any): Promise<void> => {
    if (!selectedChat) return;
    try {
      await updateChat({ chatId: selectedChat, ...data });
      toast.success("تم تحديث المحادثة");
    } catch (error: any) {
      toast.error(error.message || "فشل في تحديث المحادثة");
      throw error;
    }
  }, [selectedChat, updateChat]);

  // Filter chats
  const filteredChats = useMemo(() => {
    return (studentChats || [])
      .filter((chat): chat is NonNullable<typeof chat> => chat !== null && chat !== undefined)
      .filter((chat) => {
        if (filterType !== "all" && chat.type !== filterType) return false;
        if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [studentChats, filterType, searchQuery]);

  // ✅ فصل المحادثات إلى مجموعات دراسية ومحادثات عادية
  const studyGroupChats = useMemo(() => {
    return filteredChats.filter((chat) => chat.groupId);
  }, [filteredChats]);

  const regularChats = useMemo(() => {
    return filteredChats.filter((chat) => !chat.groupId);
  }, [filteredChats]);

  // ✅ استخراج المجموعات الدراسية للطالب
  const studyGroups = useMemo(() => {
    if (!studentGroups) return [];
    return studentGroups;
  }, [studentGroups]);

  // ✅ حالة التحميل
  if (studentChats === undefined || studentGroups === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - بدون isStudent لأن الـ Props لا تدعمه */}
      <ChatSidebar
        chats={filteredChats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
        onCreateChat={() => setShowCreateModal(true)}
        isLoading={!studentChats}
      />

      {/* Main Area - بدون isStudent */}
      {selectedChat && selectedChatData ? (
        <ChatArea
          chat={selectedChatData.chat}
          participants={selectedChatData.participants}
          messages={messages?.messages || []}
          participantStatus={selectedChatData.participantStatus}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onPinMessage={handlePinMessage}
          onAddMembers={() => setShowAddMembersModal(true)}
          onShowDetails={() => setShowChatDetails(true)}
          onToggleSettings={() => setShowSettings(!showSettings)}
          showSettings={showSettings}
          onKickMember={handleKickMember}
          onChangeRole={handleChangeRole}
          onDeleteChat={handleDeleteChat}
          onLeaveChat={handleLeaveChat}
          isLoading={!messages}
          isStudent={true} // ✅ تمرير isStudent
        />
      ) : (
        <StudentEmptyState
          onCreateChat={() => setShowCreateModal(true)}
          studyGroups={studyGroups}
        />
      )}

      {/* ✅ AddMembersModal - مع isStudent=true */}
      <AddMembersModal
        isOpen={showAddMembersModal}
        chatId={selectedChat || undefined}
        onClose={() => setShowAddMembersModal(false)}
        onAdd={handleAddMembers}
        isLoading={isLoading}
        isStudent={true} // ✅ منع الطالب من إضافة أعضاء
      />

      {selectedChat && selectedChatData && (
        <ChatDetailsModal
          isOpen={showChatDetails}
          chat={selectedChatData.chat}
          participants={selectedChatData.participants}
          onClose={() => setShowChatDetails(false)}
          onDeleteChat={handleDeleteChat}
          onUpdateChat={handleUpdateChat}
        />
      )}
    </div>
  );
}

// ✅ مكون الحالة الفارغة للطالب
function StudentEmptyState({
  onCreateChat,
  studyGroups
}: {
  onCreateChat: () => void;
  studyGroups: any[];
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 overflow-y-auto">
      <MessageSquare size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
      <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
        مرحباً بك في المحادثات
      </h2>
      <p className="text-sm text-gray-400 mt-1">
        يمكنك التواصل مع معلميك وزملائك من هنا
      </p>

      {/* ✅ عرض المجموعات الدراسية للطالب */}
      {studyGroups && studyGroups.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-right">
            📚 مجموعاتي الدراسية
          </h3>
          <div className="space-y-2">
            {studyGroups.map((group: any) => (
              <Card key={group._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#1a7a8a]" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {group.name}
                        </h4>
                        <Badge className="bg-[#1a7a8a] text-white text-xs">
                          {group.subject}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.students?.length || 0} طالب
                        </span>
                        <span className="flex items-center gap-1">
                          <School className="h-3 w-3" />
                          {group.gradeName || "غير محدد"}
                        </span>
                        {group.supervisorName && (
                          <span className="flex items-center gap-1">
                            👨‍🏫 {group.supervisorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/student/groups/${group._id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        عرض
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {studyGroups && studyGroups.length === 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            أنت غير مسجل في أي مجموعة دراسية حالياً
          </p>
          <Button
            onClick={onCreateChat}
            className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <MessageSquare className="h-4 w-4 ml-2" />
            بدء محادثة جديدة
          </Button>
        </div>
      )}
    </div>
  );
}