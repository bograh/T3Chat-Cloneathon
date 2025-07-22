"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const MODELS = {
  "openai/gpt-4o": { name: "GPT-4o" },
  "openai/gpt-4o-mini": { name: "GPT-4o Mini" },
  "openai/gpt-4-turbo": { name: "GPT-4 Turbo" },
  "openai/gpt-3.5-turbo": { name: "GPT-3.5 Turbo" },
  "anthropic/claude-3.5-sonnet": { name: "Claude 3.5 Sonnet" },
  "anthropic/claude-3-haiku": { name: "Claude 3 Haiku" },
  "google/gemini-flash-1.5": { name: "Gemini 1.5 Flash" },
  "google/gemini-pro-1.5": { name: "Gemini 1.5 Pro" },
  "google/gemini-2.5-flash-preview-05-20": {
    name: "Gemini 2.5 Flash Preview",
  },
  "meta-llama/llama-3.1-405b-instruct": { name: "Llama 3.1 405B" },
  "meta-llama/llama-3.1-70b-instruct": { name: "Llama 3.1 70B" },
  "meta-llama/llama-3.3-8b-instruct:free": { name: "Llama 3.3 8B (Free)" },
  "deepseek/deepseek-chat-v3-0324:free": { name: "DeepSeek Chat V3" },
  "deepseek/deepseek-r1-0528:free": { name: "DeepSeek R1" },
  "qwen/qwen3-235b-a22b-07-25:free": { name: " Qwen 3.2 235B" },
};

export const generateResponse = internalAction({
  args: {
    chatId: v.id("chats"),
    parentMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.context.getContext, {
      chatId: args.chatId,
      parentMessageId: args.parentMessageId,
    });

    if (!context) throw new Error("Context not found");

    const { chat, messages, userSettings } = context;
    const model = MODELS[chat.model as keyof typeof MODELS];

    if (!model) {
      console.error(
        `Unsupported model: ${chat.model}. Available models: ${Object.keys(MODELS).join(", ")}`
      );

      // Fallback to a default model instead of throwing an error
      const fallbackModel = "deepseek/deepseek-chat-v3-0324:free";
      console.log(`Falling back to default model: ${fallbackModel}`);

      // Update the chat to use the fallback model
      await ctx.runMutation(internal.chats.updateModel, {
        chatId: args.chatId,
        model: fallbackModel,
      });

      // Use the fallback model for this request
      chat.model = fallbackModel;
    }

    let response: string;
    let metadata: any = { model: chat.model };

    try {
      const apiKey =
        userSettings?.apiKeys?.openrouter || process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error("OpenRouter API key not found");
      }

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
      });

      const completion = await openai.chat.completions.create({
        model: chat.model,
        messages: messages.map((msg: any) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        max_tokens: 4000,
        temperature: 0.7,
        stream: false,
      });

      response =
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response.";

      metadata.tokens = completion.usage?.total_tokens;
      metadata.finishReason = completion.choices[0]?.finish_reason;
    } catch (error) {
      console.error("Error generating AI response:", error);
      response =
        "I apologize, but I encountered an error while generating a response. Please try again.";
      metadata.error = error instanceof Error ? error.message : "Unknown error";
    }

    // Add AI response
    await ctx.runMutation(internal.messages.addInternal, {
      chatId: args.chatId,
      content: response,
      role: "assistant",
      parentId: args.parentMessageId,
      metadata,
    });
  },
});

export const testTitleGeneration = internalAction({
  args: {
    testMessage: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    try {
      console.log("Testing title generation with message:", args.testMessage);

      const apiKey = process.env.OPENROUTER_API_KEY;
      console.log("API key available:", !!apiKey);

      if (!apiKey) {
        return "No API key found";
      }

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
      });

      console.log("Calling OpenRouter API...");

      const completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          {
            role: "system",
            content:
              "Generate a concise, descriptive title (2-6 words) for a chat conversation based on the user's first message. Return only the title, no quotes or additional text.",
          },
          {
            role: "user",
            content: args.testMessage,
          },
        ],
        max_tokens: 20,
        temperature: 0.7,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() || "New Chat";
      console.log("Generated title:", title);

      return title;
    } catch (error) {
      console.error("Error in test title generation:", error);
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

export const generateChatTitle = internalAction({
  args: {
    chatId: v.id("chats"),
    firstUserMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log(`Starting title generation for chat ${args.chatId}`);

      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        console.log("No OpenRouter API key found, skipping title generation");
        return null;
      }

      console.log("API key found, proceeding with title generation");

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
      });

      console.log("Calling OpenRouter API for title generation...");

      const completion = await openai.chat.completions.create({
        model: "qwen/qwen3-235b-a22b-07-25:free",
        messages: [
          {
            role: "system",
            content:
              "Generate a concise, descriptive title (2-6 words) for a chat conversation based on the user's first message. Return only the title, no quotes or additional text.",
          },
          {
            role: "user",
            content: args.firstUserMessage,
          },
        ],
        max_tokens: 20,
        temperature: 0.7,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() || "New Chat";

      console.log(`Generated title: "${title}"`);

      // Update the chat with the generated title
      await ctx.runMutation(internal.chats.updateTitleInternal, {
        chatId: args.chatId,
        title,
      });

      console.log(
        `Successfully updated chat ${args.chatId} with title: "${title}"`
      );
    } catch (error) {
      console.error("Error generating chat title:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.stack : "Unknown error"
      );
      // Don't throw error - title generation is not critical
    }

    return null;
  },
});

export const generateStreamingResponse = internalAction({
  args: {
    chatId: v.id("chats"),
    parentMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.context.getContext, {
      chatId: args.chatId,
      parentMessageId: args.parentMessageId,
    });

    if (!context) throw new Error("Context not found");

    const { chat, messages, userSettings } = context;
    const model = MODELS[chat.model as keyof typeof MODELS];

    if (!model) {
      console.error(
        `Unsupported model: ${chat.model}. Available models: ${Object.keys(MODELS).join(", ")}`
      );

      // Fallback to a default model instead of throwing an error
      const fallbackModel = "deepseek/deepseek-chat-v3-0324:free";
      console.log(`Falling back to default model: ${fallbackModel}`);

      // Update the chat to use the fallback model
      await ctx.runMutation(internal.chats.updateModel, {
        chatId: args.chatId,
        model: fallbackModel,
      });

      // Use the fallback model for this request
      chat.model = fallbackModel;
    }

    let metadata: any = { model: chat.model };
    let assistantMessageId: any = null;

    try {
      const apiKey =
        userSettings?.apiKeys?.openrouter || process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error("OpenRouter API key not found");
      }

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
      });

      // Create an empty assistant message to stream into
      assistantMessageId = await ctx.runMutation(
        internal.messages.addInternal,
        {
          chatId: args.chatId,
          content: "",
          role: "assistant",
          parentId: args.parentMessageId,
          metadata,
        }
      );

      console.log(
        `Created assistant message ${assistantMessageId} for streaming`
      );

      const completion = await openai.chat.completions.create({
        model: chat.model,
        messages: messages.map((msg: any) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        max_tokens: 4000,
        temperature: 0.7,
        stream: true,
      });

      let fullContent = "";
      let chunkCount = 0;

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          chunkCount++;

          // Update the message with accumulated content (batch updates every few chunks for efficiency)
          if (chunkCount % 3 === 0 || content.includes("\n")) {
            await ctx.runMutation(internal.messages.updateContent, {
              messageId: assistantMessageId,
              content: fullContent,
            });
          }
        }

        // Update metadata if available
        if (chunk.usage) {
          metadata.tokens = chunk.usage.total_tokens;
        }
        if (chunk.choices[0]?.finish_reason) {
          metadata.finishReason = chunk.choices[0].finish_reason;
        }
      }

      // Final content and metadata update
      await ctx.runMutation(internal.messages.updateContent, {
        messageId: assistantMessageId,
        content: fullContent,
      });

      await ctx.runMutation(internal.messages.updateMetadata, {
        messageId: assistantMessageId,
        metadata,
      });

      console.log(`Streaming completed for message ${assistantMessageId}`);
    } catch (error) {
      console.error("Error generating streaming AI response:", error);

      if (assistantMessageId) {
        // Update the existing message with error content
        await ctx.runMutation(internal.messages.updateContent, {
          messageId: assistantMessageId,
          content:
            "I apologize, but I encountered an error while generating a response. Please try again.",
        });

        await ctx.runMutation(internal.messages.updateMetadata, {
          messageId: assistantMessageId,
          metadata: {
            ...metadata,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      } else {
        // Create error message if we couldn't create the assistant message
        await ctx.runMutation(internal.messages.addInternal, {
          chatId: args.chatId,
          content:
            "I apologize, but I encountered an error while generating a response. Please try again.",
          role: "assistant",
          parentId: args.parentMessageId,
          metadata: {
            ...metadata,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  },
});
