export interface Channel {
  id: string;
  name: string;
  connected: boolean;
  installTime: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  labels: string[];
}

export interface Template {
  id: string;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: 'utility' | 'marketing';
  body: string;
  rejectionReason?: string;
}

export interface Label {
  id: string;
  name: string;
  contactCount: number;
}

export interface Segment {
  id: string;
  name: string;
  contactCount: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  eventType: string;
  createdAt: string;
  lastUpdated: string;
  active: boolean;
}

export interface Credits {
  email: number;
  sms: number;
  whatsapp: number;
}

export interface MockAccount {
  credits: Credits;
  channels: Channel[];
  contacts: Contact[];
  labels: Label[];
  segments: Segment[];
  templates: Template[];
  workflows: WorkflowItem[];
}

export const defaultMockAccount: MockAccount = {
  credits: {
    email: 20,
    sms: 29,
    whatsapp: 1284,
  },

  channels: [
    { id: 'ch-whatsapp', name: 'WhatsApp', connected: true, installTime: 'few minutes' },
    { id: 'ch-email', name: 'Email', connected: true, installTime: 'few seconds' },
    { id: 'ch-sms', name: 'SMS', connected: true, installTime: 'few hours' },
    { id: 'ch-facebook', name: 'Facebook', connected: true, installTime: 'few seconds' },
  ],

  contacts: [
    { id: 'ct-1', name: 'Rahul Sharma', phone: '+919876543210', email: 'rahul@demo.com', labels: ['VIP', 'Active'] },
    { id: 'ct-2', name: 'Priya Patel', phone: '+919876543211', email: 'priya@demo.com', labels: ['New'] },
    { id: 'ct-3', name: 'Amit Singh', phone: '+919876543212', email: 'amit@demo.com', labels: ['Active'] },
    { id: 'ct-4', name: 'Sneha Gupta', phone: '+919876543213', email: 'sneha@demo.com', labels: ['VIP'] },
    { id: 'ct-5', name: 'Vikram Kumar', phone: '+919876543214', email: 'vikram@demo.com', labels: ['New', 'Active'] },
  ],

  labels: [
    { id: 'lb-1', name: 'VIP', contactCount: 2 },
    { id: 'lb-2', name: 'Active', contactCount: 3 },
    { id: 'lb-3', name: 'New', contactCount: 2 },
  ],

  segments: [
    { id: 'sg-1', name: 'All Contacts', contactCount: 5 },
    { id: 'sg-2', name: 'test new 1st apr', contactCount: 3 },
    { id: 'sg-3', name: 'WhatsApp Subscribers', contactCount: 4 },
  ],

  templates: [
    {
      id: 'tpl-1',
      name: 'Welcome Message',
      status: 'APPROVED',
      category: 'utility',
      body: 'Hi {{1}}, welcome to {{2}}! We\'re glad to have you. Reply HELP for support.',
    },
    {
      id: 'tpl-2',
      name: 'Diwali Sale Promo',
      status: 'REJECTED',
      category: 'utility',
      body: 'BIG DIWALI SALE! Get 50% OFF on everything! Shop now at {{1}} — Limited time only! 🎉🎆',
      rejectionReason: 'Promotional content is not allowed in a utility template. This template contains marketing language ("BIG SALE", "50% OFF", "Limited time"). Please resubmit as a marketing template or remove promotional wording.',
    },
    {
      id: 'tpl-3',
      name: 'Order Confirmation',
      status: 'PENDING',
      category: 'utility',
      body: 'Hi {{1}}, your order #{{2}} has been confirmed. Expected delivery: {{3}}.',
    },
  ],

  workflows: [
    { id: 'wfl-1', name: 'Flow 1 : Text response Cheerio (Dont Delete)', eventType: 'incomingWA', createdAt: '2023-11-30', lastUpdated: '2024-03-11', active: true },
    { id: 'wfl-2', name: 'Flow 2 : Template response', eventType: 'incomingWA', createdAt: '2023-11-30', lastUpdated: '2024-01-16', active: false },
    { id: 'wfl-3', name: 'Appointment booking', eventType: 'incomingWA', createdAt: '2023-12-05', lastUpdated: '2024-01-11', active: false },
    { id: 'wfl-4', name: 'COD Flow', eventType: 'incomingWA', createdAt: '2023-12-08', lastUpdated: '2023-12-08', active: false },
    { id: 'wfl-5', name: 'PDF check', eventType: 'incomingWA', createdAt: '2023-12-15', lastUpdated: '2023-12-15', active: false },
    { id: 'wfl-6', name: 'Time Delay Directly', eventType: 'incomingWA', createdAt: '2023-12-19', lastUpdated: '2023-12-19', active: false },
    { id: 'wfl-7', name: 'TEST TTB', eventType: 'Shopify undefined', createdAt: '2023-12-19', lastUpdated: '2023-12-19', active: false },
    { id: 'wfl-8', name: 'Darwin chatbot', eventType: 'incomingWA', createdAt: '2024-01-08', lastUpdated: '2024-01-22', active: false },
  ],
};
