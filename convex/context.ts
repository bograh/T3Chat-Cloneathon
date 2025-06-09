import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getContext = internalQuery({
  args: {
    chatId: v.id("chats"),
    parentMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;

    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", chat.userId))
      .unique();

    // Get conversation history up to the parent message
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    // Build conversation thread
    const messages = [];
    let currentId: string | undefined = args.parentMessageId;

    // Trace back to find the conversation path
    const messageMap = new Map(allMessages.map(m => [m._id, m]));
    const conversationPath = [];

    while (currentId) {
      const message = messageMap.get(currentId as any);
      if (message) {
        conversationPath.unshift(message);
        currentId = message.parentId;
      } else {
        break;
      }
    }

    // Add all messages that don't have parents (root messages) and their children
    const rootMessages = allMessages.filter(m => !m.parentId);
    for (const rootMsg of rootMessages) {
      if (!conversationPath.find(m => m._id === rootMsg._id)) {
        messages.push(rootMsg);
      }
    }

    // Add the conversation path
    messages.push(...conversationPath);

    return { chat, messages, userSettings };
  },
});
