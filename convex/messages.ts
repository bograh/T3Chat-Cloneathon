import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

export const list = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    // Enhance messages with attachment URLs
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments) {
          const attachmentsWithUrls = await Promise.all(
            message.attachments.map(async (attachment) => ({
              ...attachment,
              url: await ctx.storage.getUrl(attachment.storageId),
            }))
          );
          return { ...message, attachments: attachmentsWithUrls };
        }
        return message;
      })
    );

    return enhancedMessages;
  },
});

export const listShared = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.isShared) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    // Enhance messages with attachment URLs
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments) {
          const attachmentsWithUrls = await Promise.all(
            message.attachments.map(async (attachment) => ({
              ...attachment,
              url: await ctx.storage.getUrl(attachment.storageId),
            }))
          );
          return { ...message, attachments: attachmentsWithUrls };
        }
        return message;
      })
    );

    return enhancedMessages;
  },
});

export const add = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    parentId: v.optional(v.id("messages")),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("pdf")),
          storageId: v.id("_storage"),
          name: v.string(),
          size: v.number(),
        })
      )
    ),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokens: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        error: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: args.role,
      parentId: args.parentId,
      attachments: args.attachments,
      metadata: args.metadata,
    });

    // Update chat's last message time
    await ctx.db.patch(args.chatId, { lastMessageAt: Date.now() });

    return messageId;
  },
});

export const addInternal = internalMutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    parentId: v.optional(v.id("messages")),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("pdf")),
          storageId: v.id("_storage"),
          name: v.string(),
          size: v.number(),
        })
      )
    ),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokens: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        error: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: args.role,
      parentId: args.parentId,
      attachments: args.attachments,
      metadata: args.metadata,
    });

    // Update chat's last message time
    await ctx.db.patch(args.chatId, { lastMessageAt: Date.now() });

    return messageId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const sendMessage = action({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("pdf")),
          storageId: v.id("_storage"),
          name: v.string(),
          size: v.number(),
        })
      )
    ),
    parentId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log(
      `SendMessage called for chat ${args.chatId} with content: "${args.content}"`
    );

    // Check if this is the first user message in the chat
    const existingMessages = await ctx.runQuery(api.messages.list, {
      chatId: args.chatId,
    });

    console.log(`Found ${existingMessages.length} existing messages`);

    const userMessages = existingMessages.filter((msg) => msg.role === "user");
    console.log(`Found ${userMessages.length} existing user messages`);

    const isFirstUserMessage = userMessages.length === 0;
    console.log(`Is first user message: ${isFirstUserMessage}`);

    // Add user message
    const userMessageId: any = await ctx.runMutation(api.messages.add, {
      chatId: args.chatId,
      content: args.content,
      role: "user",
      attachments: args.attachments,
      parentId: args.parentId,
    });

    console.log(`Added user message with ID: ${userMessageId}`);

    // Generate chat title for the first user message
    if (isFirstUserMessage) {
      console.log("Triggering title generation...");
      await ctx.runAction(internal.ai.generateChatTitle, {
        chatId: args.chatId,
        firstUserMessage: args.content,
      });
    } else {
      console.log("Skipping title generation - not first user message");
    }

    // Generate AI response with streaming
    console.log("Triggering streaming AI response generation...");
    await ctx.runAction(internal.ai.generateStreamingResponse, {
      chatId: args.chatId,
      parentMessageId: userMessageId,
    });

    return userMessageId;
  },
});

export const branch = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const originalMessage = await ctx.db.get(args.messageId);
    if (!originalMessage) throw new Error("Message not found");

    const chat = await ctx.db.get(originalMessage.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    // Create a new branch from the parent of the original message
    const branchId = await ctx.db.insert("messages", {
      chatId: originalMessage.chatId,
      content: args.content,
      role: "user",
      parentId: originalMessage.parentId,
    });

    return branchId;
  },
});

export const updateContent = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

export const updateMetadata = internalMutation({
  args: {
    messageId: v.id("messages"),
    metadata: v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      finishReason: v.optional(v.string()),
      error: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      metadata: args.metadata,
    });
  },
});
