// app/admin/chatbox/components/ChatArea.tsx

"use client";

import { Id } from "@/convex/_generated/dataModel";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatSettings } from "./ChatSettings";
import { ChatInput } from "./ChatInput";

interface ChatAreaProps {
  chat: any;
  participants: any[];
  messages: any[];
  participantStatus: any;
  onSendMessage: (content: string, type?: string) => void;
  onDeleteMessage: (messageId: Id<"chatMessages">) => void;
  onPinMessage: (messageId: Id<"chatMessages">, pin: boolean) => void;
  onAddMembers: () => void;
  onShowDetails: () => void;
  onToggleSettings: () => void;
  showSettings: boolean;
  onKickMember: (userId: Id<"users">) => void;
  onChangeRole: (userId: Id<"users">, role: "admin" | "member") => void;
  onDeleteChat: () => void;
  onLeaveChat: () => void;
  isLoading: boolean;
  isStudent?: boolean;
  isTeacher?: boolean;
}

export function ChatArea({
  chat,
  participants,
  messages,
  participantStatus,
  onSendMessage,
  onDeleteMessage,
  onPinMessage,
  onAddMembers,
  onShowDetails,
  onToggleSettings,
  showSettings,
  onKickMember,
  onChangeRole,
  onDeleteChat,
  onLeaveChat,
  isLoading,
  isStudent = false,
  isTeacher = false,
}: ChatAreaProps) {
  const isAdmin = participantStatus?.role === "admin";

  // ✅ تحديد ما إذا كان يمكن عرض إعدادات المجموعة
  const showSettingsPanel = showSettings && isAdmin && !isStudent;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <ChatHeader
        chat={chat}
        participants={participants}
        isAdmin={isAdmin}
        onAddMembers={onAddMembers}
        onShowDetails={onShowDetails}
        onToggleSettings={onToggleSettings}
        showSettings={showSettings}
        onDeleteChat={onDeleteChat}
        onLeaveChat={onLeaveChat}
        isStudent={isStudent}
        isTeacher={isTeacher}
      />

      {/* ✅ Settings Panel - فقط للأدمن وليس للطالب */}
      {showSettingsPanel && (
        <ChatSettings
          participants={participants}
          chatCreatorId={chat.createdBy}
          currentUserId={participantStatus?.userId}
          isAdmin={isAdmin}
          onKickMember={onKickMember}
          onChangeRole={onChangeRole}
          onClose={onToggleSettings}
        />
      )}

      {/* Messages */}
      <ChatMessages
        messages={messages}
        currentUserId={participantStatus?.userId}
        isAdmin={isAdmin && !isStudent} // ✅ الطلاب ليسوا مدراء
        onDeleteMessage={onDeleteMessage}
        onPinMessage={onPinMessage}
        isLoading={isLoading}
      />

      {/* Input - متاح للجميع */}
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}