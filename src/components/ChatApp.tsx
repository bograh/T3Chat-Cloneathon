import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { ChatInterface } from "./ChatInterface";
import { Settings } from "./Settings";
import { Id } from "../../convex/_generated/dataModel";

export function ChatApp() {
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const chats = useQuery(api.chats.list) || [];
  const currentChat = useQuery(
    api.chats.get,
    currentChatId ? { chatId: currentChatId } : "skip"
  );

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={() => setCurrentChatId(null)}
        onShowSettings={() => setShowSettings(true)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col">
        {showSettings ? (
          <Settings onClose={() => setShowSettings(false)} />
        ) : (
          <ChatInterface
            chatId={currentChatId}
            chat={currentChat}
            onChatCreated={setCurrentChatId}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
      </div>
    </div>
  );
}
