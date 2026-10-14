/**
 * Every data-tour attribute that a workflow step will target.
 * Derived from ARCHITECTURE.md section 7 (workflow steps).
 * Each entry: [selector, route where it should exist]
 */
export const REQUIRED_TOUR_TARGETS: Array<{ selector: string; route: string; description: string }> = [
  // wf-first-campaign (hero workflow)
  { selector: "[data-tour='setup-channel-accordion']", route: '/', description: 'Setup a channel accordion' },
  { selector: "[data-tour='whatsapp-channel-tile']", route: '/', description: 'WhatsApp channel tile in Setup a channel' },
  { selector: "[data-tour='build-audience-accordion']", route: '/', description: 'Build an audience accordion' },
  { selector: "[data-tour='csv-upload-tile']", route: '/', description: 'CSV File tile in Build an audience' },
  { selector: "[data-tour='create-content-accordion']", route: '/', description: 'Create content accordion' },
  { selector: "[data-tour='new-campaign-btn']", route: '/', description: 'New campaign button on home card' },
  { selector: "[data-tour='campaign-name']", route: '/', description: 'Campaign name input in New Campaign modal' },
  { selector: "[data-tour='campaign-label']", route: '/', description: 'Share campaign to label dropdown' },
  { selector: "[data-tour='campaign-segment']", route: '/', description: 'Select contact segment dropdown' },
  { selector: "[data-tour='channel-email']", route: '/', description: 'Email checkbox in Choose Channels' },
  { selector: "[data-tour='channel-sms']", route: '/', description: 'SMS checkbox in Choose Channels' },
  { selector: "[data-tour='channel-whatsapp']", route: '/', description: 'WhatsApp checkbox in Choose Channels' },
  { selector: "[data-tour='credit-summary']", route: '/', description: 'Credit Required vs Available summary' },
  { selector: "[data-tour='campaign-next-btn']", route: '/', description: 'Next button in New Campaign modal' },

  // wf-connect-whatsapp
  { selector: "[data-tour='channels-page']", route: '/channels', description: 'Channels settings page' },
  { selector: "[data-tour='whatsapp-connect-btn']", route: '/channels', description: 'WhatsApp connect button' },

  // wf-create-template
  { selector: "[data-tour='templates-page']", route: '/templates', description: 'Templates page' },
  { selector: "[data-tour='create-template-btn']", route: '/templates', description: 'Create new template button' },
  { selector: "[data-tour='template-name-input']", route: '/templates', description: 'Template name input' },
  { selector: "[data-tour='template-body-input']", route: '/templates', description: 'Template body textarea' },

  // wf-template-rejected
  { selector: "[data-tour='rejected-template-row']", route: '/templates', description: 'Rejected template row' },
  { selector: "[data-tour='template-edit-btn']", route: '/templates', description: 'Edit template button' },

  // wf-chatbot-flow
  { selector: "[data-tour='workflows-page']", route: '/workflows', description: 'Workflows page' },
  { selector: "[data-tour='workflow-create-btn']", route: '/workflows', description: 'Create workflow button' },

  // wf-connect-shopify
  { selector: "[data-tour='integrations-page']", route: '/integrations', description: 'Integrations page' },
  { selector: "[data-tour='shopify-connect-btn']", route: '/integrations', description: 'Shopify connect button' },

  // Shared navigation
  { selector: "[data-tour='sidebar-home']", route: '/', description: 'Home sidebar nav item' },
  { selector: "[data-tour='sidebar-contacts']", route: '/', description: 'Contacts sidebar nav item' },
  { selector: "[data-tour='sidebar-campaigns']", route: '/', description: 'Campaigns sidebar nav item' },
  { selector: "[data-tour='sidebar-analytics']", route: '/', description: 'Analytics sidebar nav item' },
  { selector: "[data-tour='sidebar-inbox']", route: '/', description: 'Inbox sidebar nav item' },
  { selector: "[data-tour='sidebar-automation']", route: '/', description: 'Automation sidebar nav item' },
  { selector: "[data-tour='sidebar-email']", route: '/', description: 'Email sidebar nav item' },
  { selector: "[data-tour='sidebar-integrations']", route: '/', description: 'Integrations sidebar nav item' },
  { selector: "[data-tour='sidebar-workflows']", route: '/', description: 'Workflows sidebar nav item' },
  { selector: "[data-tour='support-view-btn']", route: '/', description: 'Support View button in top bar' },
  { selector: "[data-tour='ask-me-anything']", route: '/', description: 'Ask me anything pill in top bar' },
];
