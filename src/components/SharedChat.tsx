import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MessageList } from "./MessageList";

interface SharedChatProps {
  shareId: string;
}

export function SharedChat({ shareId }: SharedChatProps) {
  const chat = useQuery(api.chats.getShared, { shareId });
  const messages = useQuery(
    api.messages.listShared,
    chat ? { chatId: chat._id } : "skip"
  ) || [];

  if (chat === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chat === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Chat Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This shared chat doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chat.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Shared chat • {chat.model}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              Read-only
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No messages yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This shared chat is empty.
              </p>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isGenerating={false} />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          This is a shared chat. You can view the conversation but cannot send messages.
        </div>
      </div>
    </div>
  );
}
