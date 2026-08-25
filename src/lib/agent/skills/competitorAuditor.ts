import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment } from "../types";

export interface CompetitorAuditorInput {
  productOrNiche?: string;
  knownCompetitors?: string[];
  pricingRange?: string;
}

export interface CompetitorAuditorOutput {
  marketOverview: string;
  competitorWeaknesses: string[];
  unclaimedPositioningAngles: string[];
  pricingStrategy: {
    recommendedPositioning: "Value Leader" | "Premium Authority" | "Disruptive Accessible";
    suggestedPrice: string;
    rationale: string;
  };
  keyObjectionKillers: Array<{
    objection: string;
    counterProof: string;
  }>;
}

const SYSTEM_INSTRUCTION = `
You are the "Competitor & Offer Auditor" Skill module for Captain Echo.
Your objective: Analyze competitive landscapes, identify saturated claims in the market, and extract clear, uncontested positioning wedges and objection handlers.

Guidelines:
1. Identify what competitors are doing poorly (e.g. complex setup, high retainers, password sharing, slow turnaround).
2. Formulate 3 distinct positioning angles that make competitors look outdated.
3. Build direct objection-killer pairs to include in ad copy.
4. Output strict JSON matching the schema:
{
  "marketOverview": "1-2 sentence landscape summary",
  "competitorWeaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "unclaimedPositioningAngles": ["Angle 1", "Angle 2", "Angle 3"],
  "pricingStrategy": {
    "recommendedPositioning": "Value Leader" | "Premium Authority" | "Disruptive Accessible",
    "suggestedPrice": "$XX or $XX/mo",
    "rationale": "Why this price point maximizes conversion velocity"
  },
  "keyObjectionKillers": [
    {
      "objection": "Common customer hesitation",
      "counterProof": "Direct persuasive counter-statement"
    }
  ]
}
`;

export const competitorAuditorSkill: AgentSkillModule<
  CompetitorAuditorInput,
  CompetitorAuditorOutput
> = {
  id: "competitor_auditor",
  name: "Competitor & Offer Auditor",
  badge: "Market Intel",
  description:
    "Analyzes competitor positioning, price points, and friction-free objection handlers.",
  iconName: "Search",
  category: "Ingestion & Research",
  triggerKeywords: [
    "competitor",
    "market audit",
    "positioning",
    "objections",
    "differentiation",
    "pricing strategy",
    "swot",
    "market research",
  ],
  samplePrompts: [
    "Audit competitor marketing angles for our AI short-form video tool",
    "How can we differentiate our marketing agency offer from typical monthly retainer firms?",
    "Find positioning gaps and objection killers for an organic coffee subscription",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (p.includes("competitor") || p.includes("positioning") || p.includes("differentiat"))
      return 0.95;
    if (p.includes("market") || p.includes("pricing") || p.includes("objection")) return 0.75;
    return 0.2;
  },

  async execute(
    input: CompetitorAuditorInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<CompetitorAuditorOutput>> {
    const userPrompt = `
Perform a competitor & market positioning audit for:
Product / Niche: ${input.productOrNiche || "Automated marketing agency & content scheduling tool"}
Known Competitors: ${JSON.stringify(input.knownCompetitors || ["Traditional creative agencies", "Generic social schedulers"])}
Pricing Range: ${input.pricingRange || "$29 - $199/mo"}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<CompetitorAuditorOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-audit`,
        type: "generate_video_script",
        title: `Market Audit: ${input.productOrNiche || "Competitive Positioning"}`,
        summary: `Identified ${data.unclaimedPositioningAngles.length} unique market angles and ${data.keyObjectionKillers.length} objection killers.`,
        status: "completed",
        payload: {
          ...data,
        },
      };

      return {
        success: true,
        skillId: "competitor_auditor",
        summary: `Identified ${data.competitorWeaknesses.length} competitor weaknesses and mapped ${data.unclaimedPositioningAngles.length} uncontested positioning angles.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to perform competitor audit";
      return {
        success: false,
        skillId: "competitor_auditor",
        summary: `Error auditing market: ${msg}`,
        data: {} as CompetitorAuditorOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
