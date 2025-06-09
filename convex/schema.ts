import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  chats: defineTable({
    title: v.string(),
    userId: v.id("users"),
    model: v.string(),
    isShared: v.optional(v.boolean()),
    shareId: v.optional(v.string()),
    lastMessageAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_share_id", ["shareId"])
    .index("by_user_last_message", ["userId", "lastMessageAt"]),

  messages: defineTable({
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
  })
    .index("by_chat", ["chatId"])
    .index("by_parent", ["parentId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    defaultModel: v.string(),
    apiKeys: v.optional(
      v.object({
        openai: v.optional(v.string()),
        anthropic: v.optional(v.string()),
        google: v.optional(v.string()),
        openrouter: v.optional(v.string()),
      })
    ),
    preferences: v.optional(
      v.object({
        theme: v.optional(
          v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))
        ),
        codeTheme: v.optional(v.string()),
        streamingEnabled: v.optional(v.boolean()),
      })
    ),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
