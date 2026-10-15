/**
 * Workflow registry — imports and validates all real workflow JSON files,
 * then registers them in the loader's in-memory map.
 *
 * Import this file once at app startup (src/main.tsx).
 * The dev sample (wf-dev-sample) is intentionally excluded.
 */
import { validateWorkflow, registerWorkflow } from './loader';

import wfFirstCampaignRaw from './wf-first-campaign.json';
import wfTemplateRejectedRaw from './wf-template-rejected.json';
import wfConnectWhatsappRaw from './wf-connect-whatsapp.json';
import wfCreateTemplateRaw from './wf-create-template.json';
import wfChatbotFlowRaw from './wf-chatbot-flow.json';
import wfConnectShopifyRaw from './wf-connect-shopify.json';
import wfAddContactsRaw from './wf-add-contacts.json';

const rawWorkflows = [
  wfFirstCampaignRaw,
  wfTemplateRejectedRaw,
  wfConnectWhatsappRaw,
  wfCreateTemplateRaw,
  wfChatbotFlowRaw,
  wfConnectShopifyRaw,
  wfAddContactsRaw,
];

rawWorkflows.forEach((raw) => {
  const wf = validateWorkflow(raw);
  registerWorkflow(wf);
});
