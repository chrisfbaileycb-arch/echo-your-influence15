import { GoogleGenAI } from "@google/genai";
import type { AgentAction, AgentAttachment, AgentSkillId } from "../types";

export interface SkillExecutionContext {
  userId?: string;
  orgId?: string;
  currentPath?: string;
  selectedProductId?: string;
  existingProductsCount?: number;
  existingPersonasCount?: number;
}

export interface SkillResult<T = unknown> {
  success: boolean;
  skillId: AgentSkillId;
  summary: string;
  data: T;
  actions: AgentAction[];
  error?: string;
}

export interface AgentSkillModule<TInput = Record<string, unknown>, TOutput = unknown> {
  id: AgentSkillId;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  category:
    | "Ingestion & Research"
    | "Creative & Copy"
    | "Production & Scripting"
    | "Scheduling & Distribution"
    | "Campaign Operations"
    | "Optimization";
  triggerKeywords: string[];
  systemInstruction: string;
  samplePrompts: string[];

  /**
   * Evaluates how relevant this skill is to a user prompt (0.0 to 1.0)
   */
  relevanceScore: (prompt: string, attachments?: AgentAttachment[]) => number;

  /**
   * Directly executes this specialized skill module using Gemini and backend integrations
   */
  execute: (
    input: TInput,
    attachments?: AgentAttachment[],
    context?: SkillExecutionContext,
  ) => Promise<SkillResult<TOutput>>;
}

let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

/**
 * Helper to safely call Gemini with JSON schema output
 */
export async function callSkillAI<T>(
  systemPrompt: string,
  userPrompt: string,
  attachments: AgentAttachment[] = [],
): Promise<T> {
  const ai = getGeminiClient();
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  for (const att of attachments) {
    if (att.dataBase64) {
      const rawBase64 = att.dataBase64.includes(",")
        ? att.dataBase64.split(",")[1]
        : att.dataBase64;
      parts.push({
        inlineData: {
          mimeType: att.mimeType || "image/jpeg",
          data: rawBase64,
        },
      });
    }
  }

  parts.push({ text: userPrompt });

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: { parts },
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = response.text ?? "{}";
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[Agent Skill] Failed to parse JSON response:", text, err);
    throw new Error("AI skill output was not valid JSON.");
  }
}
