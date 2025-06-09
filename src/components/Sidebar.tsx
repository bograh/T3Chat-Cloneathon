import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ProfileButton } from "./ProfileButton";

interface Chat {
  _id: Id<"chats">;
  title: string;
  lastMessageAt: number;
  model: string;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: Id<"chats"> | null;
  onChatSelect: (chatId: Id<"chats">) => void;
  onNewChat: () => void;
  onShowSettings: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onShowSettings,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<Id<"chats"> | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const updateTitle = useMutation(api.chats.updateTitle);
  const removeChat = useMutation(api.chats.remove);

  const handleEditStart = (chat: Chat) => {
    setEditingId(chat._id);
    setEditTitle(chat.title);
  };

  const handleEditSave = async () => {
    if (editingId && editTitle.trim()) {
      await updateTitle({ chatId: editingId, title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = async (chatId: Id<"chats">) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      await removeChat({ chatId });
      if (currentChatId === chatId) {
        onNewChat();
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="w-12 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <button
          onClick={onToggle}
          className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Open sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex-1"></div>

        <div className="p-2">
          <ProfileButton onShowSettings={onShowSettings} isCollapsed={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Chat
          </h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Close sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
              currentChatId === chat._id
                ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            onClick={() => onChatSelect(chat._id)}
          >
            {editingId === chat._id ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave();
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="w-full bg-transparent border-none outline-none text-sm font-medium"
                autoFocus
              />
            ) : (
              <>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {chat.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {/* {chat.model} • */}{" "}
                  {new Date(chat.lastMessageAt).toLocaleDateString()}
                </div>
              </>
            )}

            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditStart(chat);
                }}
                className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                title="Edit title"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(chat._id);
                }}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded text-red-600"
                title="Delete chat"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <ProfileButton onShowSettings={onShowSettings} isCollapsed={false} />
      </div>
    </div>
  );
}
