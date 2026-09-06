/** 弹窗里可选的模型；id 必须与 workers/index.js 的目录一致 */
export interface AssistantModel {
  id: string;
  label: string;
  hint: string;
}

export const ASSISTANT_MODELS: AssistantModel[] = [
  {
    id: "qwen3",
    label: "Qwen3 30B",
    hint: "中文更好，Workers AI 免费额度",
  },
  {
    id: "glm-flash",
    label: "GLM-4.7 Flash",
    hint: "更快，适合短答",
  },
  {
    id: "llama-8b",
    label: "Llama 3.1 8B",
    hint: "更省额度，中文一般",
  },
  {
    id: "llama-70b",
    label: "Llama 3.3 70B",
    hint: "更强，稍慢",
  },
  {
    id: "openai",
    label: "自定义（OpenAI 兼容）",
    hint: "需在 Cloudflare 配置 OPENAI_API_KEY",
  },
];

export const DEFAULT_ASSISTANT_MODEL = "qwen3";
