import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ModelSelector } from "./ModelSelector";

interface ChatInterfaceProps {
  chatId: Id<"chats"> | null;
  chat: any;
  onChatCreated: (chatId: Id<"chats">) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatInterface({
  chatId,
  chat,
  onChatCreated,
  sidebarOpen,
  onToggleSidebar,
}: ChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messages = useQuery(
    api.messages.list,
    chatId ? { chatId } : "skip"
  ) || [];
  
  const settings = useQuery(api.settings.get);
  const createChat = useMutation(api.chats.create);
  const sendMessage = useAction(api.messages.sendMessage);
  const shareChat = useMutation(api.chats.share);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings?.defaultModel) {
      setSelectedModel(settings.defaultModel);
    }
  }, [settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!content.trim()) return;

    setIsGenerating(true);
    try {
      let currentChatId = chatId;
      
      if (!currentChatId) {
        // Create new chat
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        currentChatId = await createChat({
          title,
          model: selectedModel,
        });
        onChatCreated(currentChatId);
      }

      await sendMessage({
        chatId: currentChatId,
        content,
        attachments,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!chatId) return;
    
    try {
      const shareId = await shareChat({ chatId });
      const shareUrl = `${window.location.origin}?share=${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to share chat:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Open sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chat?.title || "New Chat"}
              </h1>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={!!chatId}
              />
            </div>
          </div>

          {chatId && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ask me anything! I can help with coding, writing, analysis, and more.
              </p>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isGenerating={isGenerating} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isGenerating}
          placeholder={`Message ${selectedModel}...`}
        />
      </div>
    </div>
  );
}
