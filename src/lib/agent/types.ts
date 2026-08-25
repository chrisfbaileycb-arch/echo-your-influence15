export type AgentSkillId =
  | "product_analyzer"
  | "persona_architect"
  | "video_scriptwriter"
  | "carousel_designer"
  | "calendar_scheduler"
  | "campaign_orchestrator"
  | "hook_optimizer"
  | "competitor_auditor";

export interface AgentSkill {
  id: AgentSkillId;
  name: string;
  badge: string;
  description: string;
  iconName: string;
}

export type ActionType =
  | "create_product"
  | "create_persona"
  | "schedule_calendar_slots"
  | "create_campaign"
  | "generate_carousel_kit"
  | "generate_video_script";

export type ActionStatus = "pending" | "approved" | "executing" | "completed" | "error";

export interface CarouselSlide {
  slideNumber: number;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  ctaText?: string;
  notes?: string;
}

export interface CarouselArtifact {
  title: string;
  style: "minimalist" | "bold_promo" | "vintage_diner" | "street_chalkboard" | "tech_modern";
  accentColor: string;
  slides: CarouselSlide[];
}

export interface VideoScriptArtifact {
  title: string;
  hook: string;
  bodyScript: string;
  callToAction: string;
  caption: string;
  hashtags: string[];
  durationSeconds: 15 | 30;
  visualDirection: string;
}

export interface CalendarSlotPlan {
  planDate: string; // YYYY-MM-DD
  slotTime: string; // HH:mm
  title: string;
  platforms: Array<"tiktok" | "instagram" | "youtube" | "facebook" | "linkedin">;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
}

export interface AgentAction {
  id: string;
  type: ActionType;
  title: string;
  summary: string;
  status: ActionStatus;
  payload: Record<string, unknown>;
  result?: {
    entityId?: string;
    entityType?: string;
    url?: string;
    message?: string;
  };
  errorMessage?: string;
}

export interface AgentAttachment {
  name: string;
  mimeType: string;
  dataBase64: string; // Base64 data without prefix or full data URI
  previewUrl?: string;
  fileType: "image" | "video" | "document" | "other";
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  attachments?: AgentAttachment[];
  skillsUsed?: AgentSkillId[];
  actions?: AgentAction[];
  carouselArtifact?: CarouselArtifact;
  videoScriptArtifact?: VideoScriptArtifact;
}

export interface AgentExecutionMode {
  requireApproval: boolean; // true = require manual click before DB execution, false = auto-execute
}

export const SKILL_REGISTRY: Record<
  AgentSkillId,
  { name: string; badge: string; description: string; iconName: string }
> = {
  product_analyzer: {
    id: "product_analyzer",
    name: "Product & Offer Analyzer",
    badge: "Ingestion & USPs",
    description: "Extracts hooks, pricing, selling angles, and campaign mode from links or media.",
    iconName: "Package",
  },
  persona_architect: {
    id: "persona_architect",
    name: "Influencer Persona Architect",
    badge: "UGC Avatar & Voice",
    description: "Builds high-converting influencer personas with tuned voice and catchphrases.",
    iconName: "Users",
  },
  video_scriptwriter: {
    id: "video_scriptwriter",
    name: "9:16 Short-Form Scriptwriter",
    badge: "TikTok & Reels",
    description: "Drafts high-retention video hooks, 3-act storyboards, and burned-in captions.",
    iconName: "Video",
  },
  carousel_designer: {
    id: "carousel_designer",
    name: "Multi-Slide Carousel Designer",
    badge: "Slide Deck Builder",
    description: "Creates 5-slide teaser carousels with punchy typography and clear CTA.",
    iconName: "Layers",
  },
  calendar_scheduler: {
    id: "calendar_scheduler",
    name: "5-Channel Calendar Scheduler",
    badge: "Multi-Platform Dispatch",
    description: "Schedules tailored posts across TikTok, Reels, YouTube Shorts, X, & LinkedIn.",
    iconName: "CalendarDays",
  },
  campaign_orchestrator: {
    id: "campaign_orchestrator",
    name: "Campaign Kit Orchestrator",
    badge: "End-to-End Launch",
    description: "Wires up UTM tracking, ad copy angles, and comprehensive asset bundles.",
    iconName: "Route",
  },
  hook_optimizer: {
    id: "hook_optimizer",
    name: "Viral Hook Optimizer",
    badge: "Attention Engineering",
    description:
      "Generates high-retention psychological hook variations (Pattern Interrupt, Curiosity, Contrarian).",
    iconName: "Zap",
  },
  competitor_auditor: {
    id: "competitor_auditor",
    name: "Competitor & Offer Auditor",
    badge: "Market Intel",
    description:
      "Analyzes competitor positioning, price points, and friction-free objection handlers.",
    iconName: "Search",
  },
};
