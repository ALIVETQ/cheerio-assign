/**
 * Server-side workflow allow-list loader.
 * Loads id, title, description, keywords, examplePhrases and estimatedMinutes
 * from the real workflow JSON files in src/workflows/.
 * The dev sample is intentionally excluded.
 */

// Static imports work in both Vitest (TS) and Vercel Node (after compilation)
import wfFirstCampaign from '../../src/workflows/wf-first-campaign.json';
import wfTemplateRejected from '../../src/workflows/wf-template-rejected.json';
import wfConnectWhatsapp from '../../src/workflows/wf-connect-whatsapp.json';
import wfCreateTemplate from '../../src/workflows/wf-create-template.json';
import wfChatbotFlow from '../../src/workflows/wf-chatbot-flow.json';
import wfConnectShopify from '../../src/workflows/wf-connect-shopify.json';

export interface WorkflowMeta {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  examplePhrases: string[];
  estimatedMinutes: number;
}

const RAW = [
  wfFirstCampaign,
  wfTemplateRejected,
  wfConnectWhatsapp,
  wfCreateTemplate,
  wfChatbotFlow,
  wfConnectShopify,
] as const;

export const WORKFLOW_LIBRARY: WorkflowMeta[] = RAW.map((w) => ({
  id: w.id,
  title: w.title,
  description: w.description,
  keywords: (w as any).keywords ?? [],
  examplePhrases: (w as any).examplePhrases ?? [],
  estimatedMinutes: w.estimatedMinutes,
}));

export const ALLOWED_IDS = new Set(WORKFLOW_LIBRARY.map((w) => w.id));

export function isAllowedWorkflowId(id: string): boolean {
  return ALLOWED_IDS.has(id);
}
