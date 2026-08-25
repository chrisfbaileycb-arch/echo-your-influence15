import {
  type AgentSkillModule,
  type SkillExecutionContext,
  type SkillResult,
  callSkillAI,
} from "./base";
import type { AgentAction, AgentAttachment, CalendarSlotPlan } from "../types";

export interface CalendarSchedulerInput {
  campaignTheme?: string;
  startDate?: string;
  numberOfDays?: number;
  platforms?: Array<"tiktok" | "instagram" | "youtube" | "facebook" | "linkedin">;
  targetProductTitle?: string;
}

export interface CalendarSchedulerOutput {
  campaignTitle: string;
  scheduleSlots: Array<{
    planDate: string; // YYYY-MM-DD
    slotTime: string; // HH:mm
    title: string;
    platforms: Array<"tiktok" | "instagram" | "youtube" | "facebook" | "linkedin">;
    engine: "avatar" | "remix" | "audio_visual" | "direct_ugc";
    hook: string;
    script: string;
    caption: string;
    hashtags: string[];
    contentType: "video" | "carousel" | "single_image" | "text_thread";
  }>;
}

const SYSTEM_INSTRUCTION = `
You are the "5-Channel Calendar Scheduler" Skill module for Captain Echo.
Your objective: Take a marketing theme or product and orchestrate an intelligent publishing calendar distributed across TikTok, Instagram Reels, YouTube Shorts, Facebook, and LinkedIn.

Guidelines:
1. Schedule high-impact posting windows (e.g. 09:00 AM, 12:30 PM, 17:30 PM, 20:00 PM).
2. Tailor platform formats: Short punchy hooks for TikTok/Shorts, professional insights for LinkedIn, vibrant visuals for Instagram.
3. Output strict JSON matching the schema:
{
  "campaignTitle": "Launch Series Title",
  "scheduleSlots": [
    {
      "planDate": "YYYY-MM-DD",
      "slotTime": "09:00",
      "title": "Teaser: The Problem Most Creators Face",
      "platforms": ["tiktok", "instagram", "youtube"],
      "engine": "avatar",
      "hook": "Spoken hook",
      "script": "Brief outline or full script",
      "caption": "Platform caption",
      "hashtags": ["#marketing", "#launch"],
      "contentType": "video"
    }
  ]
}
`;

export const calendarSchedulerSkill: AgentSkillModule<
  CalendarSchedulerInput,
  CalendarSchedulerOutput
> = {
  id: "calendar_scheduler",
  name: "5-Channel Calendar Scheduler",
  badge: "Multi-Platform Dispatch",
  description: "Schedules tailored posts across TikTok, Reels, YouTube Shorts, X, & LinkedIn.",
  iconName: "CalendarDays",
  category: "Scheduling & Distribution",
  triggerKeywords: [
    "calendar",
    "schedule",
    "queue",
    "dispatch",
    "publish",
    "timing",
    "slots",
    "post times",
    "content calendar",
  ],
  samplePrompts: [
    "Schedule a 3-day launch campaign across TikTok, Reels, and Shorts starting tomorrow",
    "Plan our next week's content calendar with 5 automated publishing slots",
    "Fill my calendar with daily UGC video drops and weekly carousels",
  ],

  relevanceScore(prompt: string): number {
    const p = prompt.toLowerCase();
    if (
      p.includes("calendar") ||
      p.includes("schedule") ||
      p.includes("publish") ||
      p.includes("slots")
    )
      return 0.95;
    if (p.includes("queue") || p.includes("timetable") || p.includes("plan dates")) return 0.85;
    return 0.25;
  },

  async execute(
    input: CalendarSchedulerInput,
    attachments: AgentAttachment[] = [],
    context?: SkillExecutionContext,
  ): Promise<SkillResult<CalendarSchedulerOutput>> {
    const today = new Date().toISOString().slice(0, 10);
    const userPrompt = `
Generate a multi-channel publishing schedule for:
Campaign Theme / Product: ${input.campaignTheme || input.targetProductTitle || "Product Launch Blitz"}
Start Date: ${input.startDate || today}
Number of Days: ${input.numberOfDays || 3}
Target Platforms: ${JSON.stringify(input.platforms || ["tiktok", "instagram", "youtube"])}
Context: ${JSON.stringify(context || {})}
`;

    try {
      const data = await callSkillAI<CalendarSchedulerOutput>(
        SYSTEM_INSTRUCTION,
        userPrompt,
        attachments,
      );

      const action: AgentAction = {
        id: `act-${Date.now()}-calendar`,
        type: "schedule_calendar_slots",
        title: `Schedule ${data.scheduleSlots.length} Publishing Slots`,
        summary: `Dispatching ${data.scheduleSlots.length} posts across [${(input.platforms || ["TikTok", "IG Reels", "Shorts"]).join(", ")}].`,
        status: "pending",
        payload: {
          slots: data.scheduleSlots.map((s) => ({
            plan_date: s.planDate,
            slot_time: s.slotTime,
            title: s.title,
            engine: s.engine || "avatar",
            platforms: s.platforms,
            hook: s.hook,
            script: s.script,
            caption: s.caption,
            hashtags: s.hashtags,
          })),
        },
      };

      return {
        success: true,
        skillId: "calendar_scheduler",
        summary: `Planned ${data.scheduleSlots.length} multi-platform slots for "${data.campaignTitle}".`,
        data,
        actions: [action],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to plan calendar schedule";
      return {
        success: false,
        skillId: "calendar_scheduler",
        summary: `Error scheduling calendar: ${msg}`,
        data: {} as CalendarSchedulerOutput,
        actions: [],
        error: msg,
      };
    }
  },
};
