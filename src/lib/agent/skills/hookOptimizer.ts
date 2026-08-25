import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment } from "../types";

export interface HookOptimizerInput {
  baseIdeaOrScript?: string;
  niche?: string;
  targetEmotion?: "curiosity" | "fear_of_missing_out" | "relief" | "excitement" | "greed";
}

export interface HookOptimizerOutput {
  concept: string;
  hookVariations: Array<{
    category:
      | "Pattern Interrupt"
      | "Curiosity Gap"
      | "Bold Contrarian"
      | "Negative Constraint"
      | "Immediate Proof";
    hookText: string;
    psychologicalTrigger: string;
    retentionPotential: "High" | "Extremely High" | "Viral Tier";
    firstThreeSecondsVisualPrompt: string;
  }>;
}

const SYSTEM_INSTRUCTION = `
You are the "Viral Hook Optimizer" Skill module for Captain Echo.
Your objective: Take any standard or dry marketing statement and engineer 5 psychologically potent short-form hooks designed to stop thumb scrolling within 1.5 seconds.

Frameworks to generate:
1. Pattern Interrupt: Breaks expectational flow ("Stop doing X if you want Y").
2. Curiosity Gap: Withholds key information ("The 1 setting that increased our conversions by 312%").
3. Bold Contrarian: Challenges popular consensus ("Why most marketing agencies are charging for busywork").
4. Negative Constraint: Frames through avoidance of pain ("How to build your pipeline without sending 500 cold DMs").
5. Immediate Proof: Lead with visceral result ("I tested 10 marketing tools this week so you don't have to").

Output strict JSON matching the schema:
{
  "concept": "Core marketing message summary",
  "hookVariations": [
    {
      "category": "Pattern Interrupt" | "Curiosity Gap" | "Bold Contrarian" | "Negative Constraint" | "Immediate Proof",
      "hookText": "Exact hook line",
      "psychologicalTrigger": "Why this works",
      "retentionPotential": "High" | "Extremely High" | "Viral Tier",
      "firstThreeSecondsVisualPrompt": "Action for avatar/creator"
    }
  ]
}
`;

export const hookOptimizerSkill: AgentSkillModule<HookOptimizerInput, HookOptimizerOutput> = {
  id: "hook_optimizer",
  name: "Viral Hook Optimizer",
  badge: "Attention Engineering",
  description:
    "Generates high-retention psychological hook variations (Pattern Interrupt, Curiosity, Contrarian).",
  iconName: "Zap",
  category: "Optimization",
  triggerKeywords: [
    "hook",
    "attention",
    "retention",
    "stop scrolling",
    "viral hook",
    "first 3 seconds",
    "headline test",
    "ctr",
  ],
  samplePrompts: [
    "Optimize this boring hook: 'We have an automated marketing app for creators'",
    "Give me 5 viral pattern-interrupt hooks for our ecommerce apparel drop",
    "Generate high-retention video intros for our SaaS demo",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (p.includes("hook") || p.includes("scroll") || p.includes("pattern interrupt")) return 0.95;
    if (p.includes("attention") || p.includes("retention") || p.includes("catchy")) return 0.8;
    return 0.2;
  },

  async execute(
    input: HookOptimizerInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<HookOptimizerOutput>> {
    const userPrompt = `
Generate 5 viral hook variations for:
Base Idea / Script: ${input.baseIdeaOrScript || "Automated marketing agency in a box"}
Niche: ${input.niche || "Creators & E-commerce"}
Target Emotion: ${input.targetEmotion || "curiosity"}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<HookOptimizerOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-hook-opt`,
        type: "generate_video_script",
        title: `Engineered ${data.hookVariations.length} Viral Hooks`,
        summary: `Top hook [${data.hookVariations[0]?.category}]: "${data.hookVariations[0]?.hookText}"`,
        status: "completed",
        payload: {
          ...data,
        },
      };

      return {
        success: true,
        skillId: "hook_optimizer",
        summary: `Engineered ${data.hookVariations.length} psychological hook variations spanning pattern interrupts, curiosity gaps, and contrarian angles.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to optimize hooks";
      return {
        success: false,
        skillId: "hook_optimizer",
        summary: `Error optimizing hooks: ${msg}`,
        data: {} as HookOptimizerOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
