import type { AgentSkillId, AgentAttachment } from "../types";
import { type AgentSkillModule, type SkillExecutionContext, type SkillResult } from "./base";
import { productAnalyzerSkill } from "./productAnalyzer";
import { personaArchitectSkill } from "./personaArchitect";
import { videoScriptwriterSkill } from "./videoScriptwriter";
import { carouselDesignerSkill } from "./carouselDesigner";
import { calendarSchedulerSkill } from "./calendarScheduler";
import { campaignOrchestratorSkill } from "./campaignOrchestrator";
import { hookOptimizerSkill } from "./hookOptimizer";
import { competitorAuditorSkill } from "./competitorAuditor";

export type AnyAgentSkillModule = AgentSkillModule<Record<string, unknown>, unknown>;

export const SKILL_MODULES: AnyAgentSkillModule[] = [
  productAnalyzerSkill as unknown as AnyAgentSkillModule,
  personaArchitectSkill as unknown as AnyAgentSkillModule,
  videoScriptwriterSkill as unknown as AnyAgentSkillModule,
  carouselDesignerSkill as unknown as AnyAgentSkillModule,
  calendarSchedulerSkill as unknown as AnyAgentSkillModule,
  campaignOrchestratorSkill as unknown as AnyAgentSkillModule,
  hookOptimizerSkill as unknown as AnyAgentSkillModule,
  competitorAuditorSkill as unknown as AnyAgentSkillModule,
];

export const SKILLS_BY_ID: Record<AgentSkillId, AnyAgentSkillModule> = {
  product_analyzer: productAnalyzerSkill as unknown as AnyAgentSkillModule,
  persona_architect: personaArchitectSkill as unknown as AnyAgentSkillModule,
  video_scriptwriter: videoScriptwriterSkill as unknown as AnyAgentSkillModule,
  carousel_designer: carouselDesignerSkill as unknown as AnyAgentSkillModule,
  calendar_scheduler: calendarSchedulerSkill as unknown as AnyAgentSkillModule,
  campaign_orchestrator: campaignOrchestratorSkill as unknown as AnyAgentSkillModule,
  hook_optimizer: hookOptimizerSkill as unknown as AnyAgentSkillModule,
  competitor_auditor: competitorAuditorSkill as unknown as AnyAgentSkillModule,
};

/**
 * Returns a registered skill module by its ID
 */
export function getSkill(skillId: AgentSkillId): AnyAgentSkillModule | undefined {
  return SKILLS_BY_ID[skillId];
}

/**
 * Returns all registered skill modules
 */
export function getAllSkills(): AnyAgentSkillModule[] {
  return SKILL_MODULES;
}

/**
 * Scans a user prompt and attachments to score and return the most relevant skills
 */
export function matchSkillsForPrompt(
  prompt: string,
  attachments: AgentAttachment[] = [],
  minScore = 0.5,
): AnyAgentSkillModule[] {
  return SKILL_MODULES.map((skill) => ({
    skill,
    score: skill.relevanceScore(prompt, attachments),
  }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.skill);
}

/**
 * Executes a skill directly with typed input parameters
 */
export async function executeSkillDirectly<TInput = Record<string, unknown>, TOutput = unknown>(
  skillId: AgentSkillId,
  input: TInput,
  attachments: AgentAttachment[] = [],
  context?: SkillExecutionContext,
): Promise<SkillResult<TOutput>> {
  const skill = getSkill(skillId);
  if (!skill) {
    throw new Error(`Skill "${skillId}" is not registered.`);
  }
  return (await skill.execute(
    input as Record<string, unknown>,
    attachments,
    context,
  )) as SkillResult<TOutput>;
}
