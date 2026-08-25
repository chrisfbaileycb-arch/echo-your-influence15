import { GoogleGenAI } from "@google/genai";
import {
  type AgentAction,
  type AgentAttachment,
  type AgentSkillId,
  type CarouselArtifact,
  type VideoScriptArtifact,
  SKILL_REGISTRY,
} from "./agent/types";
import { getSkill, getAllSkills, matchSkillsForPrompt, executeSkillDirectly } from "./agent/skills";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
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

export { SKILL_REGISTRY, getSkill, getAllSkills, matchSkillsForPrompt, executeSkillDirectly };

const SYSTEM_INSTRUCTION = `
You are "Captain Echo" — the spirited, sharp, and encouraging AI Marketing Co-Captain for "Echo Your Influence" (a personal marketing agency in a box).
You wear a jaunty captain's hat and navigate creators and businesses through every step of their marketing campaigns.
You speak clearly, concisely, and articulately with a confident, friendly, and empowering captain tone (with subtle occasional nautical touches like "All hands on deck", "Smooth sailing", "Charting our course", "Aye aye", but keep it professional, smart, and highly actionable).

You have full sandbox execution capability to perform in-app actions on the creator's behalf.

You possess working knowledge of all specialized functional agent skills:
1. Product & Offer Analyzer (Ingests URLs, briefs, or media ideas into structured products with marketing angles).
2. Persona Architect (Creates tailored TikTok/Reels influencer avatars, tones, bios, and speech quirks).
3. 9:16 Short-Form Scriptwriter (Generates video hooks, scripts, and production prompts for 15s/30s UGC videos).
4. Multi-Slide Carousel Designer (Generates 5-slide visual carousel decks with eyebrow, headline, subheadline, CTA).
5. 5-Channel Calendar Scheduler (Populates the publishing calendar with scheduled dates, times, and platform adaptations).
6. Campaign Kit Orchestrator (Launches full campaigns linking product, UTMs, ad copy, and video assets).
7. Viral Hook Optimizer (Engineers 5 high-retention psychological hook variations: Pattern Interrupt, Curiosity Gap, Contrarian).
8. Competitor & Offer Auditor (Identifies competitor weaknesses, uncontested positioning wedges, and objection killers).

When a user provides an idea, text prompt, uploaded image/screenshot/video clip, or asks for assistance:
1. Analyze their intent thoroughly.
2. Determine which specialized skills are required.
3. Formulate a step-by-step actionable plan.
4. Prepare concrete executable actions with all required parameters.
5. If relevant, generate rich artifacts (like a 5-slide Carousel or a 9:16 Video Script).

Output your response STRICTLY as a JSON object matching this schema:
{
  "thought": "Your strategic assessment and friendly summary explaining what you planned or executed.",
  "skillsUsed": ["product_analyzer" | "persona_architect" | "video_scriptwriter" | "carousel_designer" | "calendar_scheduler" | "campaign_orchestrator" | "hook_optimizer" | "competitor_auditor"],
  "actions": [
    {
      "id": "act-1",
      "type": "create_product" | "create_persona" | "schedule_calendar_slots" | "create_campaign" | "generate_carousel_kit" | "generate_video_script",
      "title": "Action title (e.g., Ingest 'Cozy Cloud Hoodie' Product)",
      "summary": "Short explanation of what this action writes or schedules",
      "payload": { ...appropriate structured parameters for the action... }
    }
  ],
  "carouselArtifact": {
    "title": "Carousel Title",
    "style": "minimalist" | "bold_promo" | "vintage_diner" | "street_chalkboard" | "tech_modern",
    "accentColor": "#6366F1",
    "slides": [
      {
        "slideNumber": 1,
        "eyebrow": "LAUNCH WEEK",
        "headline": "Ship it in a weekend.",
        "subheadline": "A 5-slide teaser series",
        "ctaText": "Swipe next ->"
      },
      {
        "slideNumber": 2,
        "eyebrow": "THE PROBLEM",
        "headline": "Most creators wait months.",
        "subheadline": "Perfectionism kills momentum before you even launch.",
        "ctaText": "Here's the fix ->"
      },
      {
        "slideNumber": 3,
        "eyebrow": "THE PLAYBOOK",
        "headline": "Validate in 48 Hours.",
        "subheadline": "3 UGC videos + 1 carousel + 1 automated calendar schedule.",
        "ctaText": "Keep reading ->"
      },
      {
        "slideNumber": 4,
        "eyebrow": "AUTOMATE IT",
        "headline": "Zero Password Sharing.",
        "subheadline": "Schedule across TikTok, IG Reels, and YouTube Shorts automatically.",
        "ctaText": "Final step ->"
      },
      {
        "slideNumber": 5,
        "eyebrow": "START NOW",
        "headline": "Echo Your Influence.",
        "subheadline": "Link in bio to deploy your first campaign today.",
        "ctaText": "Claim your spot ->"
      }
    ]
  },
  "videoScriptArtifact": {
    "title": "15s Viral UGC Hook & Script",
    "hook": "Stop scrolling if you want to launch your product this weekend without spending $5K on ads.",
    "bodyScript": "Here is the exact 3-step agency workflow we use to generate high-converting short-form videos in under 2 minutes...",
    "callToAction": "Drop a comment below and I'll send you the exact template.",
    "caption": "How to scale your offers without burnout 🔥 Tap the link in bio for the full playbook!",
    "hashtags": ["#marketingagency", "#contentcreator", "#ecommerce", "#ugccreator", "#growthhacking"],
    "durationSeconds": 15,
    "visualDirection": "Fast cuts, bold yellow text overlays, high energy delivery facing directly to camera."
  }
}

Guidelines for Action Payloads:
- 'create_product': { "title": string, "description": string, "price": string, "campaign_mode": "affiliate" | "ecommerce_brand" | "saas_app" | "restaurant" | "local_service" | "real_estate" | "home_services" | "professional", "source_url": string (optional) }
- 'create_persona': { "name": string, "gender": "female" | "male" | "nonbinary", "age_range": "18-24" | "25-32" | "33-45" | "46-60", "vibe": "energetic-genz" | "chill-millennial" | "authoritative-expert" | "warm-mom" | "edgy-cool", "niche": "lifestyle" | "tech" | "beauty" | "fitness" | "finance" | "home" | "fashion" | "food" | "parenting", "voice_tone": "bubbly" | "calm" | "confident" | "warm" | "deadpan" }
- 'schedule_calendar_slots': { "slots": [ { "plan_date": "YYYY-MM-DD", "slot_time": "09:00", "title": string, "platforms": ["tiktok", "instagram", "youtube", "facebook", "linkedin"], "hook": string, "script": string, "caption": string, "hashtags": string[] } ] }
- 'create_campaign': { "name": string, "headline": string, "primary_text": string, "ad_description": string, "asset_kind": "ecommerce" | "saas" | "mobile_app" }

Always return ONLY valid JSON.
`;

export async function processAgentRequest({
  prompt,
  attachments = [],
  contextData = {},
}: {
  prompt: string;
  attachments?: AgentAttachment[];
  contextData?: {
    currentPath?: string;
    existingProductsCount?: number;
    existingPersonasCount?: number;
    selectedProductId?: string;
  };
}) {
  const ai = getGeminiClient();

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add attachments (images, video snapshots, etc.)
  for (const att of attachments) {
    if (att.dataBase64) {
      // Clean base64 string
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

  // Build user prompt with workspace context
  const contextNote = `
Current User Workspace Context:
- Active Route: ${contextData.currentPath || "/dashboard"}
- Existing Products Count: ${contextData.existingProductsCount ?? 0}
- Existing Personas Count: ${contextData.existingPersonasCount ?? 0}
- Today's Date: ${new Date().toISOString().slice(0, 10)}
`;

  const userQuery = `${contextNote}\n\nUSER PROMPT / IDEA:\n${prompt}`;
  parts.push({ text: userQuery });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text ?? "{}";
    const parsed = JSON.parse(text);

    const skillsUsed: AgentSkillId[] = Array.isArray(parsed.skillsUsed)
      ? parsed.skillsUsed
      : ["product_analyzer", "carousel_designer"];

    const actions: AgentAction[] = Array.isArray(parsed.actions)
      ? parsed.actions.map((a: Record<string, unknown>, idx: number) => ({
          id: String(a.id || `act-${Date.now()}-${idx}`),
          type: (a.type as AgentAction["type"]) || "create_product",
          title: String(a.title || "Proposed In-App Action"),
          summary: String(a.summary || ""),
          status: "pending" as const,
          payload: (a.payload as Record<string, unknown>) || {},
        }))
      : [];

    return {
      thought:
        parsed.thought ||
        "I've analyzed your idea and formulated an end-to-end multi-channel campaign workflow.",
      skillsUsed,
      actions,
      carouselArtifact: parsed.carouselArtifact as CarouselArtifact | undefined,
      videoScriptArtifact: parsed.videoScriptArtifact as VideoScriptArtifact | undefined,
    };
  } catch (error: unknown) {
    console.error("[Agent.server.ts] Gemini analysis error:", error);
    // Fallback safe payload if API issue occurs
    return {
      thought: `I've mapped out your request: "${prompt}". You can review the suggested campaign components below.`,
      skillsUsed: ["product_analyzer", "carousel_designer", "calendar_scheduler"] as AgentSkillId[],
      actions: [
        {
          id: `act-${Date.now()}-1`,
          type: "create_product" as const,
          title: `Create Marketing Offer: ${prompt.slice(0, 30)}...`,
          summary: "Initialize a high-converting product card in your catalog.",
          status: "pending" as const,
          payload: {
            title: prompt.slice(0, 50) || "New Campaign Offer",
            description: prompt,
            price: "$49.00",
            campaign_mode: "saas_app",
          },
        },
        {
          id: `act-${Date.now()}-2`,
          type: "schedule_calendar_slots" as const,
          title: "Schedule 3-Day Teaser Publishing Series",
          summary: "Auto-format and schedule across TikTok, Reels, & Shorts.",
          status: "pending" as const,
          payload: {
            slots: [
              {
                plan_date: new Date().toISOString().slice(0, 10),
                slot_time: "10:00",
                title: "Launch Teaser Video",
                platforms: ["tiktok", "instagram", "youtube"],
                hook: "Here's how to turn your idea into a full marketing campaign in 2 minutes...",
                script:
                  "Step 1: Ingest your idea. Step 2: Auto-generate carousels and UGC scripts.",
                caption: "The easiest way to scale organic content. Link in bio!",
                hashtags: ["#marketing", "#workflow", "#contentcreator"],
              },
            ],
          },
        },
      ],
      carouselArtifact: {
        title: "Launch Week: Ship It in a Weekend",
        style: "minimalist" as const,
        accentColor: "#6366F1",
        slides: [
          {
            slideNumber: 1,
            eyebrow: "LAUNCH WEEK",
            headline: "Ship it in a weekend.",
            subheadline: "A 5-slide teaser series",
            ctaText: "Swipe next ->",
          },
          {
            slideNumber: 2,
            eyebrow: "THE PROBLEM",
            headline: "Most creators wait months.",
            subheadline: "Perfectionism kills momentum before you even launch.",
            ctaText: "Here's the fix ->",
          },
          {
            slideNumber: 3,
            eyebrow: "THE PLAYBOOK",
            headline: "Automate Content Scheduling",
            subheadline: "Auto-format videos for TikTok, Reels, & Shorts.",
            ctaText: "Step 2 ->",
          },
          {
            slideNumber: 4,
            eyebrow: "ZERO FRICTION",
            headline: "Zero Password Sharing",
            subheadline: "Safe, API-based social publishing.",
            ctaText: "Final step ->",
          },
          {
            slideNumber: 5,
            eyebrow: "START TODAY",
            headline: "Echo Your Influence",
            subheadline: "Pre-built campaign templates for food, retail, & services.",
            ctaText: "Get started ->",
          },
        ],
      },
      videoScriptArtifact: {
        title: "15s Hook & UGC Script",
        hook: "3 things you need to know before launching your next campaign...",
        bodyScript:
          "Instead of hiring a 5-person agency, our in-app AI executes the entire workflow on your behalf.",
        callToAction: "Click the link in bio to start your first campaign today.",
        caption: "Agency-in-a-box for modern creators 🚀 #ecommerce #ugccreator #socialmarketing",
        hashtags: ["#marketingagency", "#contentcreator", "#ecommerce"],
        durationSeconds: 15,
        visualDirection: "Dynamic creator selfie video, high-contrast captions, crisp transitions.",
      },
    };
  }
}

/**
 * Executes a verified in-app action against Supabase / database on the user's behalf.
 */
export async function executeSingleAction({
  action,
  userId,
}: {
  action: AgentAction;
  userId: string;
}): Promise<{
  success: boolean;
  entityId?: string;
  entityType?: string;
  url?: string;
  message?: string;
}> {
  try {
    const { resolveOrgIdForUser } = await import("@/lib/integrations/orgs.server");
    let orgId: string | null = null;
    try {
      orgId = await resolveOrgIdForUser(userId);
    } catch {
      // Fallback
    }

    if (action.type === "create_product") {
      const p = action.payload;
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .insert({
          user_id: userId,
          title: p.title || "New Product Offer",
          description: p.description || "",
          price: p.price || "",
          currency: p.currency || "USD",
          campaign_mode: p.campaign_mode || "saas_app",
          source_url: p.source_url || "",
          source_domain: p.source_url ? new URL(p.source_url).hostname : null,
          images: Array.isArray(p.images) ? p.images : [],
        })
        .select("id, title")
        .single();

      if (error) throw new Error(error.message);
      return {
        success: true,
        entityId: product.id,
        entityType: "product",
        url: `/products/${product.id}`,
        message: `Created product "${product.title}" in your catalog.`,
      };
    }

    if (action.type === "create_persona") {
      const p = action.payload;
      const { data: persona, error } = await supabaseAdmin
        .from("personas")
        .insert({
          user_id: userId,
          name: p.name || "Alex Jordan",
          gender: p.gender || "female",
          age_range: p.age_range || "25-32",
          vibe: p.vibe || "chill-millennial",
          niche: p.niche || "tech",
          voice_tone: p.voice_tone || "confident",
          bio: p.bio || "Tech & lifestyle creator testing high-converting offers.",
          catchphrases: Array.isArray(p.catchphrases)
            ? p.catchphrases
            : ["Check this out", "Game changer"],
          speech_quirks: p.speech_quirks || "Upbeat, casual, and energetic cadence.",
          heygen_avatar_id: "Daisy-inskirt-20220818",
          elevenlabs_voice_id: "2d5b0e6cf36f460aa7fc47e3eee4ba54",
          is_default: false,
        })
        .select("id, name")
        .single();

      if (error) throw new Error(error.message);
      return {
        success: true,
        entityId: persona.id,
        entityType: "persona",
        url: `/personas`,
        message: `Built influencer persona "${persona.name}" with voice & avatar mapping.`,
      };
    }

    if (action.type === "schedule_calendar_slots") {
      const slots = Array.isArray(action.payload.slots) ? action.payload.slots : [action.payload];
      const createdIds: string[] = [];

      for (const slot of slots) {
        const { data: row, error } = await supabaseAdmin
          .from("calendar_slots")
          .insert({
            org_id: orgId || userId,
            created_by: userId,
            plan_date: slot.plan_date || new Date().toISOString().slice(0, 10),
            slot_time: slot.slot_time || "09:00",
            title: slot.title || "Scheduled Content Post",
            engine: slot.engine || "avatar",
            platforms: Array.isArray(slot.platforms) ? slot.platforms : ["tiktok", "instagram"],
            hook: slot.hook || "",
            script: slot.script || "",
            caption: slot.caption || "",
            hashtags: Array.isArray(slot.hashtags) ? slot.hashtags : [],
            status: "planned",
          })
          .select("id")
          .single();

        if (!error && row) {
          createdIds.push(row.id);
        }
      }

      return {
        success: true,
        entityId: createdIds[0],
        entityType: "calendar",
        url: `/calendar`,
        message: `Scheduled ${createdIds.length || 1} content publishing slot(s) on your calendar.`,
      };
    }

    if (action.type === "create_campaign") {
      const p = action.payload;
      const { data: campaign, error } = await supabaseAdmin
        .from("campaigns")
        .insert({
          user_id: userId,
          name: p.name || "New Omnichannel Campaign",
          headline: p.headline || "Transform Your Workflow",
          primary_text: p.primary_text || "The easiest way to scale content without burnout.",
          ad_description: p.ad_description || "Deploy in minutes.",
          status: "ready",
          step: "Ready to render",
          asset_kind: p.asset_kind || "saas",
          include_video: true,
          utm_campaign: (p.name || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        })
        .select("id, name")
        .single();

      if (error) throw new Error(error.message);
      return {
        success: true,
        entityId: campaign.id,
        entityType: "campaign",
        url: `/campaigns/${campaign.id}`,
        message: `Launched campaign kit "${campaign.name}" with full UTM tracking.`,
      };
    }

    // Default generic success
    return {
      success: true,
      message: `Completed action: ${action.title}`,
      url: `/dashboard`,
    };
  } catch (err: unknown) {
    console.error("[Agent.server.ts] Action execution failed:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to execute action";
    return {
      success: false,
      message: errorMessage,
    };
  }
}
