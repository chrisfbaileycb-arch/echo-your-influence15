import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment, CarouselArtifact, CarouselSlide } from "../types";

export interface CarouselDesignerInput {
  topic?: string;
  productTitle?: string;
  slideCount?: number;
  style?: "minimalist" | "bold_promo" | "vintage_diner" | "street_chalkboard" | "tech_modern";
  accentColor?: string;
}

export interface CarouselDesignerOutput {
  title: string;
  style: "minimalist" | "bold_promo" | "vintage_diner" | "street_chalkboard" | "tech_modern";
  accentColor: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
}

const SYSTEM_INSTRUCTION = `
You are the "Multi-Slide Carousel Designer" Skill module for Captain Echo.
Your objective: Design punchy 5-slide visual carousel decks optimized for Instagram, LinkedIn, and Twitter/X document posts.

Slide Blueprint:
Slide 1: THE TEASER / HOOK (Big bold headline + curiosity eyebrow + swipe CTA)
Slide 2: THE HIDDEN PROBLEM (Why traditional methods fail or cost too much)
Slide 3: THE PLAYBOOK / FRAMEWORK (Step-by-step mechanism or 3 pillars)
Slide 4: ZERO FRICTION / PROOF (How the solution eliminates risk, no passwords, instant deployment)
Slide 5: THE CONVERSION CTA (Clear offer summary, link in bio / comment trigger)

Output strict JSON matching the schema:
{
  "title": "Deck Title",
  "style": "minimalist" | "bold_promo" | "vintage_diner" | "street_chalkboard" | "tech_modern",
  "accentColor": "#6366F1",
  "slides": [
    {
      "slideNumber": 1,
      "eyebrow": "EYEBROW BADGE",
      "headline": "Bold Main Headline",
      "subheadline": "Optional supporting context",
      "ctaText": "Swipe next ->"
    }
  ],
  "caption": "Post caption for social channels",
  "hashtags": ["#growth", "#marketing", "#playbook"]
}
`;

export const carouselDesignerSkill: AgentSkillModule<
  CarouselDesignerInput,
  CarouselDesignerOutput
> = {
  id: "carousel_designer",
  name: "Multi-Slide Carousel Designer",
  badge: "Slide Deck Builder",
  description: "Creates 5-slide teaser carousels with punchy typography and clear CTA.",
  iconName: "Layers",
  category: "Creative & Copy",
  triggerKeywords: [
    "carousel",
    "slides",
    "deck",
    "instagram post",
    "linkedin carousel",
    "infographic",
    "swipe",
    "5-slide",
  ],
  samplePrompts: [
    "Generate a 5-slide teaser carousel design titled 'Ship it in a weekend'",
    "Design a LinkedIn document carousel breaking down our agency automation framework",
    "Create a bold promo slide deck for our limited time product launch",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (p.includes("carousel") || p.includes("slide") || p.includes("deck") || p.includes("swipe"))
      return 0.95;
    if (p.includes("infographic") || p.includes("pdf post")) return 0.8;
    return 0.2;
  },

  async execute(
    input: CarouselDesignerInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<CarouselDesignerOutput>> {
    const userPrompt = `
Design a multi-slide carousel deck for:
Topic / Product: ${input.topic || input.productTitle || "Automated Marketing Agency"}
Desired Style: ${input.style || "minimalist"}
Accent Color: ${input.accentColor || "#6366F1"}
Slide Count: ${input.slideCount || 5}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<CarouselDesignerOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-carousel`,
        type: "generate_carousel_kit",
        title: `Design Carousel: ${data.title}`,
        summary: `Constructed ${data.slides.length}-slide visual deck in "${data.style}" aesthetic.`,
        status: "completed",
        payload: {
          ...data,
        },
      };

      return {
        success: true,
        skillId: "carousel_designer",
        summary: `Designed ${data.slides.length}-slide carousel deck "${data.title}" with tailored typography hierarchy.`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to design carousel";
      return {
        success: false,
        skillId: "carousel_designer",
        summary: `Error designing carousel: ${msg}`,
        data: {} as CarouselDesignerOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
