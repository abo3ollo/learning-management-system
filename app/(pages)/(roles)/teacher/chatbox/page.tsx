// app/(pages)/(roles)/teacher/chatbox/page.tsx

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
}

export default function TeacherChatBox() {
  // State
  const [selectedChat, setSelectedChat] = useState<Id<"chatGroups"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "group" | "class" | "grade" | "direct">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Queries - Teacher specific
  const teacherGroups = useQuery(api.chat.chats.getTeacherChats);
  const selectedChatData = useQuery(
    api.chat.chats.getChatById,
    selectedChat ? { chatId: selectedChat } : "skip"
  );
  const messages = useQuery(
    api.chat.messages.getMessages,
    selectedChat ? { chatId: selectedChat, limit: 50 } : "skip"
  );

  // ✅ جلب المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب مجموعات المعلم
  const teacherGroupsList = useQuery(
    api.groups.groups.getTeacherGroups,
    {}
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
    return (teacherGroups || [])
      .filter((chat): chat is NonNullable<typeof chat> => chat !== null && chat !== undefined)
      .filter((chat) => {
        if (filterType !== "all" && chat.type !== filterType) return false;
        if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [teacherGroups, filterType, searchQuery]);

  // ✅ Teacher specific: Available groups for chat creation
  const teacherAvailableGroups = useMemo(() => {
    if (!teacherGroupsList) return [];
    return teacherGroupsList.filter((group: any) => 
      group.status === "active" && group.students?.length > 0
    );
  }, [teacherGroupsList]);

  // ✅ استخراج الطلاب من teacherGroupsList
  const teacherStudentsList = useMemo(() => {
    if (!teacherGroupsList) return [];
    const studentsMap = new Map();
    teacherGroupsList.forEach((group: any) => {
      if (group.students && Array.isArray(group.students)) {
        group.students.forEach((studentId: Id<"users">) => {
          studentsMap.set(studentId, { _id: studentId, name: "جاري التحميل..." });
        });
      }
    });
    return Array.from(studentsMap.values());
  }, [teacherGroupsList]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <ChatSidebar
        chats={filteredChats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
        onCreateChat={() => setShowCreateModal(true)}
        isLoading={!teacherGroups}
      />

      {/* Main Area */}
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
        />
      ) : (
        <EmptyState 
          onCreateChat={() => setShowCreateModal(true)}
        />
      )}

      {/* ✅ Modals - بدون teacherGroups و teacherStudents */}
      <CreateChatModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateChat}
        isLoading={isLoading}
      />

      <AddMembersModal
        isOpen={showAddMembersModal}
        chatId={selectedChat || undefined}
        onClose={() => setShowAddMembersModal(false)}
        onAdd={handleAddMembers}
        isLoading={isLoading}
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