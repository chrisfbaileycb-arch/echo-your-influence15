import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment, VideoScriptArtifact } from "../types";

export interface VideoScriptwriterInput {
  productTitle?: string;
  offerDetails?: string;
  durationSeconds?: 15 | 30;
  tone?: string;
  targetPlatform?: "tiktok" | "reels" | "shorts";
  hookStyle?: "problem_first" | "pattern_interrupt" | "bold_claim" | "social_proof";
}

export interface VideoScriptwriterOutput {
  title: string;
  hook: string;
  bodyScript: string;
  callToAction: string;
  caption: string;
  hashtags: string[];
  durationSeconds: 15 | 30;
  visualDirection: string;
  bRollCues: string[];
  audioPacing: string;
}

const SYSTEM_INSTRUCTION = `
You are the "9:16 Short-Form Scriptwriter" Skill module for Captain Echo.
Your objective: Generate high-retention, high-converting vertical video scripts engineered for TikTok, Instagram Reels, and YouTube Shorts.

Framework:
1. 0-3s: Visual & Verbal Hook (pattern interrupt, bold statement, or visceral problem).
2. 4-10s: The Mechanism / Demonstration (how the product or workflow delivers the breakthrough).
3. 11-15s (or 25-30s): Clear Low-Friction Call-to-Action with urgency.
4. Output strict JSON matching the schema:
{
  "title": "Script Title",
  "hook": "Spoken hook sentence (punchy, zero fluff)",
  "bodyScript": "Complete spoken word-for-word body monologue",
  "callToAction": "Direct CTA sentence",
  "caption": "High-converting social caption with emoji hooks",
  "hashtags": ["#marketing", "#ugc", "#viral"],
  "durationSeconds": 15 or 30,
  "visualDirection": "Framing, lighting, overlay text placement, and camera movement notes",
  "bRollCues": ["B-roll action 1", "B-roll action 2"],
  "audioPacing": "Energetic, snappy cuts with 120-140 WPM pace"
}
`;

export const videoScriptwriterSkill: AgentSkillModule<
  VideoScriptwriterInput,
  VideoScriptwriterOutput
> = {
  id: "video_scriptwriter",
  name: "9:16 Short-Form Scriptwriter",
  badge: "TikTok & Reels",
  description: "Drafts high-retention video hooks, 3-act storyboards, and burned-in captions.",
  iconName: "Video",
  category: "Production & Scripting",
  triggerKeywords: [
    "script",
    "video",
    "tiktok",
    "reels",
    "shorts",
    "hook",
    "ugc script",
    "short-form",
    "voiceover",
  ],
  samplePrompts: [
    "Write a 15-second viral TikTok hook and script for our AI marketing agency",
    "Create a 30s UGC review script with high-energy problem-first hook for a fitness app",
    "Draft 3 video scripts comparing manual scheduling vs automated calendar dispatch",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (p.includes("script") || p.includes("tiktok") || p.includes("reels") || p.includes("shorts"))
      return 0.95;
    if (p.includes("video") || p.includes("hook") || p.includes("ugc")) return 0.85;
    return 0.3;
  },

  async execute(
    input: VideoScriptwriterInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<VideoScriptwriterOutput>> {
    const userPrompt = `
Generate a 9:16 short-form video script for:
Product / Offer: ${input.productTitle || "AI Marketing Platform"}
Details: ${input.offerDetails || "Automates marketing workflows, scriptwriting, and multi-channel scheduling."}
Duration: ${input.durationSeconds || 15} seconds
Target Platform: ${input.targetPlatform || "tiktok"}
Tone: ${input.tone || "high-energy, punchy, and authentic"}
Hook Style: ${input.hookStyle || "pattern_interrupt"}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<VideoScriptwriterOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const scriptArtifact: VideoScriptArtifact = {
        title: data.title,
        hook: data.hook,
        bodyScript: data.bodyScript,
        callToAction: data.callToAction,
        caption: data.caption,
        hashtags: data.hashtags,
        durationSeconds: data.durationSeconds,
        visualDirection: data.visualDirection,
      };

      const action: AgentAction = {
        id: `act-${Date.now()}-script`,
        type: "generate_video_script",
        title: `Generate Video Script: ${data.title}`,
        summary: `Created ${data.durationSeconds}s UGC script with hook: "${data.hook.slice(0, 45)}..."`,
        status: "completed",
        payload: {
          ...data,
        },
      };

      return {
        success: true,
        skillId: "video_scriptwriter",
        summary: `Generated ${data.durationSeconds}s high-retention script: "${data.title}" with visual cues and caption.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate video script";
      return {
        success: false,
        skillId: "video_scriptwriter",
        summary: `Error generating video script: ${msg}`,
        data: {} as VideoScriptOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
