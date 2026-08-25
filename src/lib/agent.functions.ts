import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/lib/cloud/auth-middleware";
import type { AgentAction, AgentAttachment } from "./agent/types";

const AttachmentSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  dataBase64: z.string(),
  previewUrl: z.string().optional(),
  fileType: z.enum(["image", "video", "document", "other"]),
});

const AgentPromptInput = z.object({
  prompt: z.string().min(1).max(10000),
  attachments: z.array(AttachmentSchema).optional().default([]),
  contextData: z
    .object({
      currentPath: z.string().optional(),
      existingProductsCount: z.number().optional(),
      existingPersonasCount: z.number().optional(),
      selectedProductId: z.string().optional(),
    })
    .optional()
    .default({}),
});

const ExecuteActionInput = z.object({
  action: z.object({
    id: z.string(),
    type: z.enum([
      "create_product",
      "create_persona",
      "schedule_calendar_slots",
      "create_campaign",
      "generate_carousel_kit",
      "generate_video_script",
    ]),
    title: z.string(),
    summary: z.string(),
    status: z.enum(["pending", "approved", "executing", "completed", "error"]),
    payload: z.record(z.any()),
  }),
});

export const runAgentPrompt = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) => AgentPromptInput.parse(d))
  .handler(async ({ data }) => {
    const { processAgentRequest } = await import("@/lib/agent.server");
    const result = await processAgentRequest({
      prompt: data.prompt,
      attachments: data.attachments as AgentAttachment[],
      contextData: data.contextData,
    });
    return result;
  });

export const executeAgentActionFn = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) => ExecuteActionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { executeSingleAction } = await import("@/lib/agent.server");
    const result = await executeSingleAction({
      action: data.action as AgentAction,
      userId: context.userId,
    });
    return result;
  });

const ExecuteSkillInput = z.object({
  skillId: z.enum([
    "product_analyzer",
    "persona_architect",
    "video_scriptwriter",
    "carousel_designer",
    "calendar_scheduler",
    "campaign_orchestrator",
    "hook_optimizer",
    "competitor_auditor",
  ]),
  inputPayload: z.record(z.any()),
  attachments: z.array(AttachmentSchema).optional().default([]),
  contextData: z
    .object({
      currentPath: z.string().optional(),
      selectedProductId: z.string().optional(),
    })
    .optional()
    .default({}),
});

export const executeAgentSkillFn = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((d: unknown) => ExecuteSkillInput.parse(d))
  .handler(async ({ data, context }) => {
    const { executeSkillDirectly } = await import("@/lib/agent.server");
    const result = await executeSkillDirectly(
      data.skillId,
      data.inputPayload,
      data.attachments as AgentAttachment[],
      {
        userId: context.userId,
        currentPath: data.contextData.currentPath,
        selectedProductId: data.contextData.selectedProductId,
      },
    );
    return result;
  });

export const getAgentSkillsCatalogFn = createServerFn({ method: "GET" })
  .middleware([requireCloudAuth])
  .handler(async () => {
    const { getAllSkills } = await import("@/lib/agent.server");
    const skills = getAllSkills().map((s) => ({
      id: s.id,
      name: s.name,
      badge: s.badge,
      description: s.description,
      iconName: s.iconName,
      category: s.category,
      triggerKeywords: s.triggerKeywords,
      samplePrompts: s.samplePrompts,
    }));
    return { skills };
  });
