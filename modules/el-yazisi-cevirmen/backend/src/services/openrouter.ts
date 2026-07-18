import { env, isOpenRouterConfigured } from "../config/env";
import { friendlyOpenRouterError } from "../utils/openRouterErrors";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

type TextContent = { type: "text"; text: string };
type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "high" | "low" | "auto" };
};
export type MessageContent = string | Array<TextContent | ImageContent>;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

type MessagePayload = {
  content?: string | Array<{ type?: string; text?: string }> | null;
  reasoning?: string;
};

interface OpenRouterChatResponse {
  model?: string;
  choices?: Array<{
    message?: MessagePayload;
    error?: { message?: string };
    finish_reason?: string;
  }>;
  error?: { message?: string; code?: number; metadata?: Record<string, unknown> };
}

export function buildImageContent(base64: string, mimeType: string, highDetail = false): ImageContent {
  const dataUrl = base64.startsWith("data:") ? base64 : `data:${mimeType};base64,${base64}`;
  return {
    type: "image_url",
    image_url: {
      url: dataUrl,
      ...(highDetail ? { detail: "high" as const } : {}),
    },
  };
}

function extractMessageText(message?: MessagePayload): string {
  if (!message) return "";

  const { content, reasoning } = message;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  if (typeof reasoning === "string" && reasoning.trim()) {
    return reasoning.trim();
  }

  return "";
}

export async function callOpenRouterChat(params: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  context?: "ocr" | "translate";
}): Promise<{ text: string; modelUsed: string }> {
  const {
    model,
    messages,
    temperature = 0.2,
    maxTokens = 4096,
    context = "ocr",
  } = params;

  if (!isOpenRouterConfigured()) {
    throw new Error(friendlyOpenRouterError("User not found", { context }));
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const apiKey = env.OPENROUTER_API_KEY.replace(/^\uFEFF/, "").trim();
  const siteUrl = env.OPENROUTER_SITE_URL.replace(/^\uFEFF/, "").trim() || "https://el-yaz-s-okuyucu-ve-evirici.vercel.app";
  const appName = env.OPENROUTER_APP_NAME.replace(/^\uFEFF/, "").trim() || "El Yazisi Cevirmen";

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-Title": appName,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as OpenRouterChatResponse;

  if (!response.ok) {
    const rawMessage = data?.error?.message ?? `OpenRouter istegi basarisiz oldu (HTTP ${response.status})`;
    console.error(`OpenRouter ham hata (${model}):`, rawMessage);
    throw new Error(friendlyOpenRouterError(rawMessage, { context }));
  }

  const choice = data.choices?.[0];
  const choiceError = choice?.error?.message;
  if (choiceError) {
    console.error(`OpenRouter secim hatasi (${model}):`, choiceError);
    throw new Error(friendlyOpenRouterError(choiceError, { context }));
  }

  const text = extractMessageText(choice?.message);
  if (!text) {
    const finishReason = choice?.finish_reason ?? "bilinmiyor";
    console.error(`OpenRouter bos yanit (${data.model ?? model}, finish=${finishReason}):`, JSON.stringify(choice?.message));
    throw new Error(
      `Model metin dondurmedi (${data.model ?? model}). Baska bir fotograf veya mod deneyin.`
    );
  }

  return { text, modelUsed: data.model ?? model };
}

/** Modelleri tek tek dener (OpenRouter en fazla 3 model/fallback kabul eder). */
export async function callOpenRouterChatChain(params: {
  modelChain: string[];
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  context?: "ocr" | "translate";
}): Promise<{ text: string; modelUsed: string }> {
  const { modelChain, ...rest } = params;
  let lastError: Error | null = null;

  for (const model of modelChain) {
    try {
      return await callOpenRouterChat({ ...rest, model });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Istek basarisiz oldu.");
      console.error(`Model basarisiz (${model}):`, lastError.message);
    }
  }

  throw lastError ?? new Error("Hicbir model yanit vermedi.");
}
