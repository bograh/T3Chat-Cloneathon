import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return (
      settings || {
        userId,
        defaultModel: "openai/gpt-4o-mini",
        preferences: {
          theme: "auto",
          codeTheme: "github-dark",
          streamingEnabled: true,
        },
      }
    );
  },
});

export const update = mutation({
  args: {
    defaultModel: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const updateData = {
      userId,
      ...(args.defaultModel && { defaultModel: args.defaultModel }),
      ...(args.apiKeys && { apiKeys: args.apiKeys }),
      ...(args.preferences && { preferences: args.preferences }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    } else {
      return await ctx.db.insert("userSettings", {
        userId,
        defaultModel: args.defaultModel || "openai/gpt-4o-mini",
        apiKeys: args.apiKeys,
        preferences: args.preferences || {
          theme: "auto",
          codeTheme: "github-dark",
          streamingEnabled: true,
        },
      });
    }
  },
});
