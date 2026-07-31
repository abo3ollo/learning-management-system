// app/admin/chatbox/components/ChatInput.tsx

"use client";

import { useState, useRef } from "react";
import { Send, Image, Paperclip, Mic, Smile, X } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (content: string, type?: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim(), "text");
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (file: File, type: "image" | "file") => {
    // TODO: Implement file upload to R2
    // For now, just show a toast
    toast.info(`جاري رفع ${type === "image" ? "الصورة" : "الملف"}...`);
    
    // Simulate upload
    setTimeout(() => {
      toast.success("تم الرفع بنجاح");
      // Send message with media URL
      // onSendMessage("", type, mediaUrl);
    }, 2000);
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
      {/* Typing indicator placeholder */}
      {isTyping && (
        <div className="text-xs text-gray-400 mb-2 text-right">
          جاري الكتابة...
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Attachments */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="إرفاق صورة"
          >
            <Image size={20} />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, "image");
              e.target.value = "";
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="إرفاق ملف"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, "file");
              e.target.value = "";
            }}
          />
        </div>

        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder="اكتب رسالتك..."
            rows={1}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-10.5 max-h-30"
            style={{ height: "auto" }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
          title="إرسال"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}