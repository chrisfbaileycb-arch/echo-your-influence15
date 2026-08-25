import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment } from "../types";

export interface CampaignOrchestratorInput {
  campaignName?: string;
  productTitle?: string;
  targetGoal?: "leads" | "sales" | "brand_awareness" | "app_installs";
  assetKind?: "ecommerce" | "saas" | "mobile_app" | "local_service";
}

export interface CampaignOrchestratorOutput {
  name: string;
  headline: string;
  primaryText: string;
  adDescription: string;
  assetKind: "ecommerce" | "saas" | "mobile_app";
  utmCampaign: string;
  adAngles: Array<{
    angleName: string;
    hookHeadline: string;
    bodyCopy: string;
    ctaButton: string;
  }>;
  recommendedBudgetSplit: {
    tiktokPct: number;
    metaPct: number;
    youtubePct: number;
  };
}

const SYSTEM_INSTRUCTION = `
You are the "Campaign Kit Orchestrator" Skill module for Captain Echo.
Your objective: Formulate an end-to-end launch package uniting ad copy, UTM campaign parameters, creative angle variations, and asset distribution specs.

Guidelines:
1. Provide a cohesive campaign headline, ad descriptions, and 3 high-converting creative angles.
2. Generate clean URL-safe UTM parameters.
3. Output strict JSON matching the schema:
{
  "name": "Campaign Name",
  "headline": "Main Marketing Headline",
  "primaryText": "Compelling ad primary text (3-4 sentences)",
  "adDescription": "Subheadline / news feed link description",
  "assetKind": "ecommerce" | "saas" | "mobile_app",
  "utmCampaign": "campaign_slug_name",
  "adAngles": [
    {
      "angleName": "Direct Pain Point",
      "hookHeadline": "Headline text",
      "bodyCopy": "Body text",
      "ctaButton": "Claim Offer"
    }
  ],
  "recommendedBudgetSplit": {
    "tiktokPct": 40,
    "metaPct": 40,
    "youtubePct": 20
  }
}
`;

export const campaignOrchestratorSkill: AgentSkillModule<
  CampaignOrchestratorInput,
  CampaignOrchestratorOutput
> = {
  id: "campaign_orchestrator",
  name: "Campaign Kit Orchestrator",
  badge: "End-to-End Launch",
  description: "Wires up UTM tracking, ad copy angles, and comprehensive asset bundles.",
  iconName: "Route",
  category: "Campaign Operations",
  triggerKeywords: [
    "campaign",
    "orchestrate",
    "launch kit",
    "utm",
    "ad angles",
    "ad copy",
    "omnichannel",
    "bundle",
    "full launch",
  ],
  samplePrompts: [
    "Plan and orchestrate a multi-platform launch campaign for our new feature drop",
    "Generate an omnichannel ad kit with UTM tracking and 3 copy angle variations",
    "Build a complete campaign bundle ready for paid & organic distribution",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (p.includes("campaign") || p.includes("launch kit") || p.includes("ad copy")) return 0.95;
    if (p.includes("orchestrate") || p.includes("omnichannel") || p.includes("utm")) return 0.9;
    return 0.3;
  },

  async execute(
    input: CampaignOrchestratorInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<CampaignOrchestratorOutput>> {
    const userPrompt = `
Orchestrate a complete campaign launch kit for:
Campaign / Offer Name: ${input.campaignName || input.productTitle || "Growth Acceleration Launch"}
Target Goal: ${input.targetGoal || "sales"}
Asset Kind: ${input.assetKind || "saas"}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<CampaignOrchestratorOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-campaign`,
        type: "create_campaign",
        title: `Launch Campaign Kit: ${data.name}`,
        summary: `Configured campaign with UTM [${data.utmCampaign}], ${data.adAngles.length} creative angles, and distribution settings.`,
        status: "pending",
        payload: {
          name: data.name,
          headline: data.headline,
          primary_text: data.primaryText,
          ad_description: data.adDescription,
          asset_kind: data.assetKind,
          utm_campaign: data.utmCampaign,
          ad_angles: data.adAngles,
        },
      };

      return {
        success: true,
        skillId: "campaign_orchestrator",
        summary: `Orchestrated campaign kit "${data.name}" with ${data.adAngles.length} conversion angles and UTM parameter bindings.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to orchestrate campaign";
      return {
        success: false,
        skillId: "campaign_orchestrator",
        summary: `Error orchestrating campaign: ${msg}`,
        data: {} as CampaignOrchestratorOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
