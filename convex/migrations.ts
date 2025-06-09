import { internalMutation, internalQuery } from "./_generated/server";

export const findInvalidModels = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allChats = await ctx.db.query("chats").collect();
    const modelCounts: Record<string, number> = {};

    for (const chat of allChats) {
      modelCounts[chat.model] = (modelCounts[chat.model] || 0) + 1;
    }

    console.log("All models in database:", modelCounts);
    return modelCounts;
  },
});

export const migrateOldGeminiModel = internalMutation({
  args: {},
  handler: async (ctx) => {
    // First, let's see what models we have
    const allChats = await ctx.db.query("chats").collect();
    const modelCounts: Record<string, number> = {};

    for (const chat of allChats) {
      modelCounts[chat.model] = (modelCounts[chat.model] || 0) + 1;
    }

    console.log("Current models in database:", modelCounts);

    const validModels = [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "openai/gpt-4-turbo",
      "openai/gpt-3.5-turbo",
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-haiku",
      "google/gemini-flash-1.5",
      "google/gemini-pro-1.5",
      "google/gemini-2.5-flash-preview-05-20",
      "meta-llama/llama-3.1-405b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
    ];

    let totalUpdated = 0;

    for (const chat of allChats) {
      if (!validModels.includes(chat.model)) {
        console.log(
          `Found invalid model: ${chat.model}, updating to google/gemini-flash-1.5`
        );
        await ctx.db.patch(chat._id, {
          model: "google/gemini-flash-1.5",
        });
        totalUpdated++;
      }
    }

    return { updated: totalUpdated };
  },
});
