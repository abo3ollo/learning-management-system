// app/admin/chatbox/components/ChatMessages.tsx

"use client";

import { useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Pin,
  Trash2,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";

interface ChatMessagesProps {
  messages: any[];
  currentUserId: Id<"users">;
  isAdmin: boolean;
  onDeleteMessage: (messageId: Id<"chatMessages">) => void;
  onPinMessage: (messageId: Id<"chatMessages">, pin: boolean) => void;
  isLoading: boolean;
}

export function ChatMessages({
  messages,
  currentUserId,
  isAdmin,
  onDeleteMessage,
  onPinMessage,
  isLoading,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), "hh:mm a", { locale: arSA });
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd MMM yyyy", { locale: arSA });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={16} />;
      case "file":
        return <FileText size={16} />;
      case "voice":
        return <Mic size={16} />;
      case "video":
        return <Video size={16} />;
      default:
        return null;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message: any) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <MessageSquare size={48} className="mb-2" />
          <p>لا توجد رسائل بعد</p>
          <p className="text-sm">كن أول من يرسل رسالة</p>
        </div>
      ) : (
        Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex justify-center my-4">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full text-gray-500 dark:text-gray-400">
                {date}
              </span>
            </div>

            {/* Messages */}
            {dateMessages.map((message: any) => (
              <div
                key={message._id}
                className={`flex ${message.senderId === currentUserId ? "justify-start" : "justify-end"} group`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.type === "system"
                      ? "w-full text-center"
                      : message.senderId === currentUserId
                      ? "bg-blue-600 text-white rounded-l-lg rounded-br-lg"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-r-lg rounded-bl-lg shadow-sm"
                  } p-3`}
                >
                  {/* System Message */}
                  {message.type === "system" && (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
                      {message.content}
                    </div>
                  )}

                  {/* Regular Message */}
                  {message.type !== "system" && (
                    <>
                      {/* Sender Name */}
                      {message.senderId !== currentUserId && message.sender && (
                        <p className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">
                          {message.sender.name}
                        </p>
                      )}

                      {/* Deleted Message */}
                      {message.isDeleted ? (
                        <p className="text-sm italic text-gray-400">تم حذف هذه الرسالة</p>
                      ) : (
                        <>
                          {/* Text Content */}
                          {message.type === "text" && (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}

                          {/* Media Content */}
                          {message.mediaUrl && message.type !== "text" && (
                            <div className="mt-1">
                              {message.type === "image" && (
                                <Image
                                  src={message.mediaUrl}
                                  alt="صورة"
                                  width={200}
                                  height={200}
                                  className="rounded-lg max-h-60 object-cover"
                                />
                              )}
                              {message.type === "file" && (
                                <a
                                  href={message.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-500 hover:underline"
                                >
                                  <FileText size={16} />
                                  <span>تحميل الملف</span>
                                </a>
                              )}
                              {message.content && (
                                <p className="text-sm mt-1">{message.content}</p>
                              )}
                            </div>
                          )}

                          {/* Pinned Badge */}
                          {message.isPinned && (
                            <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                              <Pin size={12} />
                              <span>مثبت</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Message Footer */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.createdAt)}
                        </span>

                        {/* Read Receipt - Only for sent messages */}
                        {message.senderId === currentUserId && !message.isDeleted && (
                          <span className="text-xs">
                            {message.readBy?.length > 1 ? (
                              <CheckCheck size={14} className="text-blue-400" />
                            ) : (
                              <Check size={14} className="text-gray-400" />
                            )}
                          </span>
                        )}

                        {/* Actions - Hover */}
                        {!message.isDeleted && message.type !== "system" && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Delete - Only sender or admin */}
                            {(message.senderId === currentUserId || isAdmin) && (
                              <button
                                onClick={() => onDeleteMessage(message._id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                            {/* Pin - Admin only */}
                            {isAdmin && (
                              <button
                                onClick={() => onPinMessage(message._id, !message.isPinned)}
                                className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ${
                                  message.isPinned ? "text-yellow-500" : ""
                                }`}
                                title={message.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                              >
                                <Pin size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}