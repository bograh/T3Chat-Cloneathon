interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const MODELS = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash",
    provider: "Google",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini 1.5 Pro",
    provider: "Google",
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash Preview",
    provider: "Google",
  },
  {
    id: "meta-llama/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B",
    provider: "Meta",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "Meta",
  },
  {
    id: "meta-llama/llama-3.3-8b-instruct:free",
    name: "Llama 3.3 8B (Free)",
    provider: "Meta",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek Chat V3",
    provider: "DeepSeek",
  },
  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek R1",
    provider: "DeepSeek",
  },
  {
    id: "qwen/qwen3-235b-a22b-07-25:free",
    name: "Qwen 3.2 235B",
    provider: "Qwen",
  },
];

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  const selectedModelInfo = MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
      >
        {MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.provider})
          </option>
        ))}
      </select>
    </div>
  );
}
