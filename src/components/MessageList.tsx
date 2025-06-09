import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";

interface Message {
  _id: Id<"messages">;
  content: string;
  role: "user" | "assistant" | "system";
  parentId?: Id<"messages">;
  attachments?: Array<{
    type: "image" | "pdf";
    url?: string;
    storageId?: Id<"_storage">;
    name: string;
    size: number;
  }>;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
  };
  _creationTime: number;
}

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
}

export function MessageList({ messages, isGenerating }: MessageListProps) {
  const [branchingFrom, setBranchingFrom] = useState<Id<"messages"> | null>(
    null
  );
  const [branchContent, setBranchContent] = useState("");

  const branchMessage = useMutation(api.messages.branch);

  const handleBranch = async (messageId: Id<"messages">) => {
    if (!branchContent.trim()) return;

    try {
      await branchMessage({
        messageId,
        content: branchContent,
      });
      setBranchingFrom(null);
      setBranchContent("");
    } catch (error) {
      console.error("Failed to branch message:", error);
    }
  };

  const renderMessageContent = (content: string, role: string) => {
    if (role === "assistant") {
      // Render AI responses with full Markdown support
      return (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              code(props) {
                const { className, children, ...rest } = props;
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                if (props.node?.tagName === "code" && language) {
                  return (
                    <div className="relative">
                      <pre
                        className={`language-${language} rounded-lg overflow-x-auto`}
                      >
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {language}
                      </div>
                    </div>
                  );
                }
                return (
                  <code
                    className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre({ children }) {
                return <div className="my-4">{children}</div>;
              },
              h1({ children }) {
                return (
                  <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="text-xl font-semibold mt-5 mb-3">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
                );
              },
              ul({ children }) {
                return (
                  <ul className="list-disc pl-5 my-3 space-y-1">{children}</ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal pl-5 my-3 space-y-1">
                    {children}
                  </ol>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">
                    {children}
                  </blockquote>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-300 dark:border-gray-600">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                    {children}
                  </td>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    } else {
      // Render user messages as plain text with line breaks
      return <span className="whitespace-pre-wrap">{content}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {messages.map((message) => (
        <div key={message._id} className="group">
          <div
            className={`flex gap-4 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            <div
              className={`max-w-3xl ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3"
                  : "bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3"
              }`}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {attachment.type === "image" ? (
                        <img
                          src={attachment.url || ""}
                          alt={attachment.name}
                          className="max-w-xs rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-700 rounded">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-sm">{attachment.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                className={
                  message.role === "user"
                    ? "text-white"
                    : "text-gray-900 dark:text-white"
                }
              >
                {renderMessageContent(message.content, message.role)}
              </div>

              {/* {message.metadata && (
                <div className="mt-2 text-xs opacity-70">
                  {message.metadata.model && (
                    <span>{message.metadata.model}</span>
                  )}
                  {message.metadata.tokens && (
                    <span className="ml-2">
                      {message.metadata.tokens} tokens
                    </span>
                  )}
                </div>
              )} */}
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Message actions */}
          <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setBranchingFrom(message._id)}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              Branch conversation
            </button>
          </div>

          {/* Branch input */}
          {branchingFrom === message._id && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <textarea
                value={branchContent}
                onChange={(e) => setBranchContent(e.target.value)}
                placeholder="Start a new branch from here..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleBranch(message._id)}
                  disabled={!branchContent.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Create Branch
                </button>
                <button
                  onClick={() => setBranchingFrom(null)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {isGenerating && (
        <div className="flex gap-4 justify-start">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
