import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);

  const [defaultModel, setDefaultModel] = useState("openai/gpt-4o-mini");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [streamingEnabled, setStreamingEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setDefaultModel(settings.defaultModel || "openai/gpt-4o-mini");
      setOpenaiKey((settings as any).apiKeys?.openai || "");
      setAnthropicKey((settings as any).apiKeys?.anthropic || "");
      setGoogleKey((settings as any).apiKeys?.google || "");
      setOpenrouterKey((settings as any).apiKeys?.openrouter || "");
      setDeepseekKey((settings as any).apiKeys?.deepseek || "");
      setTheme((settings as any).preferences?.theme || "auto");
      setStreamingEnabled(settings.preferences?.streamingEnabled ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        defaultModel,
        apiKeys: {
          openai: openaiKey || undefined,
          anthropic: anthropicKey || undefined,
          google: googleKey || undefined,
          openrouter: openrouterKey || undefined,
          deepseek: deepseekKey || undefined,
        },
        preferences: {
          theme,
          streamingEnabled,
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-8">
          {/* Model Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Model Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Model
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="anthropic/claude-3.5-sonnet">
                    Claude 3.5 Sonnet
                  </option>
                  <option value="anthropic/claude-3-haiku">
                    Claude 3 Haiku
                  </option>
                  <option value="google/gemini-flash-1.5">
                    Gemini 1.5 Flash
                  </option>
                  <option value="google/gemini-pro-1.5">Gemini 1.5 Pro</option>
                  <option value="google/gemini-2.5-flash-preview-05-20">
                    Gemini 2.5 Flash Preview
                  </option>
                  <option value="meta-llama/llama-3.1-405b-instruct">
                    Llama 3.1 405B
                  </option>
                  <option value="meta-llama/llama-3.1-70b-instruct">
                    Llama 3.1 70B
                  </option>
                  <option value="meta-llama/llama-3.3-8b-instruct:free">
                    Llama 3.3 8B (Free)
                  </option>
                  <option value="deepseek/deepseek-chat-v3-0324:free">
                    DeepSeek Chat V3
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              API Keys
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Recommended. Provides access to all models through a unified
                  API.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Legacy support. Use OpenRouter API key instead.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Legacy support. Use OpenRouter API key instead.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google API Key
                </label>
                <input
                  type="password"
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Legacy support. Use OpenRouter API key instead.
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value as "light" | "dark" | "auto")
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Streaming Responses
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show responses as they're generated
                  </p>
                </div>
                <button
                  onClick={() => setStreamingEnabled(!streamingEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    streamingEnabled
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      streamingEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
