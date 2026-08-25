import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment } from "../types";

export interface ProductAnalyzerInput {
  textOrUrl: string;
  sourceUrl?: string;
  categoryHint?: string;
}

export interface ProductAnalyzerOutput {
  title: string;
  description: string;
  price: string;
  currency: string;
  campaignMode:
    | "affiliate"
    | "ecommerce_brand"
    | "saas_app"
    | "restaurant"
    | "local_service"
    | "real_estate"
    | "home_services"
    | "professional";
  targetAudience: string;
  uniqueSellingPoints: string[];
  suggestedHooks: string[];
  keyObjections: string[];
  sourceUrl?: string;
}

const SYSTEM_INSTRUCTION = `
You are the "Product & Offer Analyzer" Skill module for Captain Echo.
Your objective: Take raw user product descriptions, landing page URLs, marketing briefs, or uploaded photos/screenshots, and extract a structured, conversion-optimized Product Offer ready for multi-channel campaigns.

Guidelines:
1. Identify the primary value proposition, pricing structure, target demographic, and campaign mode.
2. Formulate 3 distinct selling angles / hooks (Problem-Agitate, Transformation, Value-Stack).
3. Identify 2 key objections to address in downstream video scripts and ads.
4. Output strict JSON matching the schema:
{
  "title": "Clean, memorable product/service title",
  "description": "2-3 sentence punchy summary of what it is and who it helps",
  "price": "$XX.XX or Pricing model",
  "currency": "USD",
  "campaignMode": "ecommerce_brand" | "saas_app" | "affiliate" | "restaurant" | "local_service" | "real_estate" | "home_services" | "professional",
  "targetAudience": "Specific ICP description",
  "uniqueSellingPoints": ["USP 1", "USP 2", "USP 3"],
  "suggestedHooks": ["Hook 1", "Hook 2", "Hook 3"],
  "keyObjections": ["Objection 1", "Objection 2"]
}
`;

export const productAnalyzerSkill: AgentSkillModule<ProductAnalyzerInput, ProductAnalyzerOutput> = {
  id: "product_analyzer",
  name: "Product & Offer Analyzer",
  badge: "Ingestion & USPs",
  description:
    "Extracts hooks, pricing, selling angles, and campaign mode from links, text, or media.",
  iconName: "Package",
  category: "Ingestion & Research",
  triggerKeywords: [
    "product",
    "offer",
    "item",
    "store",
    "ecommerce",
    "saas",
    "service",
    "analyze link",
    "extract product",
    "ingest",
    "listing",
  ],
  samplePrompts: [
    "Analyze this product: https://example.com/glow-serum and generate selling angles",
    "I have an AI automated resume builder SaaS called ResumePilot for $29/mo",
    "Here is a photo of our bakery's artisan sourdough gift boxes",
  ],

  relevanceScore(prompt: string, attachments: AgentAttachment[] = []): number {
    const p = prompt.toLowerCase();
    if (attachments.some((a) => a.fileType === "image" || a.fileType === "document")) return 0.85;
    if (p.includes("http://") || p.includes("https://") || p.includes(".com") || p.includes(".io"))
      return 0.95;
    if (
      p.includes("product") ||
      p.includes("offer") ||
      p.includes("catalog") ||
      p.includes("selling")
    )
      return 0.8;
    return 0.3;
  },

  async execute(
    input: ProductAnalyzerInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<ProductAnalyzerOutput>> {
    const userPrompt = `
Analyze the following product/offer input:
Input: ${input.textOrUrl}
${input.sourceUrl ? `Source URL: ${input.sourceUrl}` : ""}
${input.categoryHint ? `Category Hint: ${input.categoryHint}` : ""}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<ProductAnalyzerOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-product`,
        type: "create_product",
        title: `Ingest Product: ${data.title}`,
        summary: `Save "${data.title}" (${data.campaignMode}, ${data.price}) with ${data.uniqueSellingPoints.length} USPs to your workspace catalog.`,
        status: "pending",
        payload: {
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency || "USD",
          campaign_mode: data.campaignMode,
          source_url:
            input.sourceUrl || (input.textOrUrl.startsWith("http") ? input.textOrUrl : null),
          target_audience: data.targetAudience,
          unique_selling_points: data.uniqueSellingPoints,
          suggested_hooks: data.suggestedHooks,
        },
      };

      return {
        success: true,
        skillId: "product_analyzer",
        summary: `Successfully extracted "${data.title}" with campaign mode [${data.campaignMode}] and ${data.uniqueSellingPoints.length} core selling angles.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze product";
      return {
        success: false,
        skillId: "product_analyzer",
        summary: `Error analyzing product: ${msg}`,
        data: {} as ProductAnalyzerOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
