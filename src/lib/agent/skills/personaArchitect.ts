import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment } from "../types";

export interface PersonaArchitectInput {
  nicheOrTarget?: string;
  desiredVibe?: string;
  brandTone?: string;
  genderPreference?: "female" | "male" | "nonbinary" | "any";
  ageRange?: string;
}

export interface PersonaArchitectOutput {
  name: string;
  gender: "female" | "male" | "nonbinary";
  ageRange: "18-24" | "25-32" | "33-45" | "46-60";
  vibe: "energetic-genz" | "chill-millennial" | "authoritative-expert" | "warm-mom" | "edgy-cool";
  niche:
    | "lifestyle"
    | "tech"
    | "beauty"
    | "fitness"
    | "finance"
    | "home"
    | "fashion"
    | "food"
    | "parenting";
  voiceTone: "bubbly" | "calm" | "confident" | "warm" | "deadpan";
  bio: string;
  catchphrases: string[];
  speechQuirks: string;
  heygenAvatarId: string;
  elevenlabsVoiceId: string;
  bestFitProducts: string[];
}

const SYSTEM_INSTRUCTION = `
You are the "Influencer Persona Architect" Skill module for Captain Echo.
Your objective: Create realistic, high-converting AI influencer and UGC creator personas mapped to HeyGen visual avatars and ElevenLabs voice models.

Guidelines:
1. Design an authentic creator persona with distinct personality traits, speech rhythm, catchphrases, and visual energy.
2. Select appropriate HeyGen avatar IDs (e.g. "Daisy-inskirt-20220818", "josh_lite3_20230714", "Wayne_20240111", "Mona_20231012") and matching ElevenLabs voice IDs.
3. Output strict JSON matching the schema:
{
  "name": "Full Creator Name (e.g. Maya Chen)",
  "gender": "female" | "male" | "nonbinary",
  "ageRange": "18-24" | "25-32" | "33-45" | "46-60",
  "vibe": "energetic-genz" | "chill-millennial" | "authoritative-expert" | "warm-mom" | "edgy-cool",
  "niche": "lifestyle" | "tech" | "beauty" | "fitness" | "finance" | "home" | "fashion" | "food" | "parenting",
  "voiceTone": "bubbly" | "calm" | "confident" | "warm" | "deadpan",
  "bio": "2-sentence creator bio and audience demographic focus",
  "catchphrases": ["Catchphrase 1", "Catchphrase 2", "Catchphrase 3"],
  "speechQuirks": "Description of speaking cadence, energy, and inflection",
  "heygenAvatarId": "Avatar ID string",
  "elevenlabsVoiceId": "Voice ID string",
  "bestFitProducts": ["Product Category 1", "Product Category 2"]
}
`;

export const personaArchitectSkill: AgentSkillModule<
  PersonaArchitectInput,
  PersonaArchitectOutput
> = {
  id: "persona_architect",
  name: "Influencer Persona Architect",
  badge: "UGC Avatar & Voice",
  description: "Builds high-converting influencer personas with tuned voice and catchphrases.",
  iconName: "Users",
  category: "Creative & Copy",
  triggerKeywords: [
    "persona",
    "avatar",
    "creator",
    "influencer",
    "voice",
    "character",
    "host",
    "ugc creator",
    "spokesperson",
  ],
  samplePrompts: [
    "Build a bubbly Gen-Z beauty creator persona named Chloe who reviews skincare",
    "Create an authoritative B2B SaaS founder persona for technical demos",
    "I need a fitness coach avatar who speaks with energetic, direct encouragement",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (
      p.includes("persona") ||
      p.includes("avatar") ||
      p.includes("influencer") ||
      p.includes("creator")
    )
      return 0.95;
    if (p.includes("voice") || p.includes("spokesperson") || p.includes("host")) return 0.8;
    return 0.2;
  },

  async execute(
    input: PersonaArchitectInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<PersonaArchitectOutput>> {
    const userPrompt = `
Generate an influencer persona matching these parameters:
Niche / Target: ${input.nicheOrTarget || "tech & productivity SaaS"}
Desired Vibe: ${input.desiredVibe || "energetic and modern"}
Brand Tone: ${input.brandTone || "friendly & confident"}
Gender Preference: ${input.genderPreference || "any"}
Age Range: ${input.ageRange || "25-32"}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<PersonaArchitectOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-persona`,
        type: "create_persona",
        title: `Create Persona: ${data.name}`,
        summary: `Deploy "${data.name}" (${data.vibe}, ${data.voiceTone} voice) to your avatar fleet.`,
        status: "pending",
        payload: {
          name: data.name,
          gender: data.gender,
          age_range: data.ageRange,
          vibe: data.vibe,
          niche: data.niche,
          voice_tone: data.voiceTone,
          bio: data.bio,
          catchphrases: data.catchphrases,
          speech_quirks: data.speechQuirks,
          heygen_avatar_id: data.heygenAvatarId || "Daisy-inskirt-20220818",
          elevenlabs_voice_id: data.elevenlabsVoiceId || "2d5b0e6cf36f460aa7fc47e3eee4ba54",
        },
      };

      return {
        success: true,
        skillId: "persona_architect",
        summary: `Created influencer persona "${data.name}" (${data.niche}, ${data.vibe}) with configured avatar and voice bindings.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create persona";
      return {
        success: false,
        skillId: "persona_architect",
        summary: `Error creating persona: ${msg}`,
        data: {} as PersonaArchitectOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
