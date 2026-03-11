'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import jsPDF from 'jspdf';

type TokenMigrationEntry = {
  id: string;
  psp: string;
  tokenCount: string;
};

type QuestionField = {
  type: string;
  field: string;
  label?: string;
  title?: string;
  placeholder?: string;
  options?: string[] | { value: string; label: string }[];
  otherField?: string;
  otherPlaceholder?: string;
  required?: boolean;
  width?: string;
  conditional?: {
    when: string;
    show: QuestionField[];
  };
  fields?: QuestionField[]; // For repeatable fields
  addButtonLabel?: string;
};

type SchemaSection = {
  type: string;
  field: string;
  label?: string;
  title?: string;
  options?: any[];
  otherField?: string;
  otherPlaceholder?: string;
  conditional?: any;
  fields?: any[];
  addButtonLabel?: string;
  placeholder?: string;
  width?: string;
};

type SchemaStep = {
  id: string;
  label: string;
  sections: SchemaSection[];
  notesField: string | null;
  docLink: {
    url: string;
    label: string;
  } | null;
};

type QuestionnaireSchema = {
  version: string;
  title: string;
  description: string;
  steps: SchemaStep[];
};

// Gandalf Questionnaire Types
type GandalfAnswer = {
  id: string;
  questionId?: string;
  text: string;
  referenceUrl?: string | null;
  nextQuestionId?: string | null;
  orderIndex: number;
};

type GandalfQuestion = {
  id: string;
  questionnaireId?: string;
  text: string;
  supportingDetail?: string | null;
  questionType: 'TEXT_INPUT' | 'EXCLUSIVE_SELECT' | 'MULTI_SELECT';
  orderIndex: number;
  scopeId?: string | null;
  isRequired: boolean;
  answers?: GandalfAnswer[];
};

type GandalfQuestionnaire = {
  id: string;
  title: string;
  description?: string | null;
  version: number;
  isPublished: boolean;
  parentQuestionnaireId?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  questions: GandalfQuestion[];
};

type SOWData = {
  goLiveDate: string;
  currentPaymentMethods: string[];
  currentPaymentMethodsOther: string;
  newPaymentMethods: string[];
  newPaymentMethodsOther: string;
  currentPSPs: string[];
  currentPSPsOther: string;
  newPSPs: string[];
  newPSPsOther: string;
  // Legacy fields for backward compatibility
  paymentMethods: string[];
  paymentMethodsOther: string;
  psps: string[];
  pspsOther: string;
  has3DSStrategy: string;
  threeDSStrategy: string;
  threeDSStrategyOther: string;
  channels: string[];
  transactionFlows: string[];
  recurringPayments: string;
  subscriptionPlatform: string;
  tokenMigrationRequired: string;
  tokenMigrationEntries: TokenMigrationEntry[];
  // Additional notes for each section
  goLiveDateNotes: string;
  paymentMethodsNotes: string;
  pspsNotes: string;
  threeDSNotes: string;
  channelsNotes: string;
  tokenMigrationNotes: string;
};

const CATEGORIES = [
  { id: 'goLiveDate', label: 'Go Live Date', type: 'date' },
  { id: 'currentPaymentMethodsAndPSPs', label: 'Current Payment Methods & PSPs', type: 'current-payment-methods-psps' },
  { id: 'newPaymentMethodsAndPSPs', label: 'Add Payment Methods & PSPs', type: 'new-payment-methods-psps' },
  { id: '3dsStrategy', label: '3DS Strategies', type: '3ds' },
  { id: 'purchaseChannels', label: 'Purchase Channels & Flows', type: 'channels' },
  { id: 'tokenMigration', label: 'Token Migration', type: 'token' },
];

const PAYMENT_METHODS = [
  'Card',
  'ACH',
  'Afterpay',
  'Alipay',
  'Alipay+',
  'Alma',
  'Apple Pay',
  'Atome',
  'Bancontact',
  'Bancontact Payconiq',
  'Bank Transfer',
  'Blik',
  'Carte Cadeau',
  'Cetelem',
  'Chèque Fidélité',
  'Clearpay',
  'Coinbase',
  'Confo+',
  'CPay',
  'Dana',
  'EPS',
  'Fintecture Smart Transfer',
  'Fintecture Transfer',
  'Google Pay',
  'GrabPay',
  'iDEAL',
  'Illicado',
  'Kaartdirect',
  'Klarna',
  'MBWay',
  'Mobilepay',
  'Multibanco',
  'Netaxept',
  'Nets Easy',
  'nol Pay',
  'Ovo',
  'P24',
  'Payconiq',
  'PayNow',
  'PayPal',
  'Paytrail',
  'PromptPay',
  'ShopBack',
  'Shopeepay',
  'Spirit of Cadeau',
  'Swish',
  'TripleA',
  'TrueMoney',
  'Trustly',
  'Twint',
  'Venmo',
  'Vipps',
  'WeChat Pay',
];

const PSPS = [
  '2C2P',
  'Adyen',
  'Airwallex',
  'Aliant',
  'Braintree',
  'Buckaroo',
  'Checkout.com',
  'Cybersource',
  'dLocal',
  'emerchantpay',
  'EveryPay',
  'Fat Zebra',
  'Fiserv',
  'iPay88',
  'Iyzico',
  'JPMC',
  'Mastercard Gateway',
  'Merchant Warrior',
  'Mollie',
  'Monext',
  'Nets Easy',
  'Nexi',
  'Nuvei',
  'Omise',
  'Onerway',
  'Pacypay',
  'Pay.',
  'Paygent',
  'PayPal',
  'PayPlug',
  'PayU LATAM',
  'Rapyd',
  'Shift4',
  'Stripe',
  'Thunes',
  'Trust Payments',
  'Unlimint',
  'Worldline',
  'Worldline Connect',
  'Worldline Sips',
  'WorldPay',
  'WorldPay VAP',
  'Xendit',
];

type UserRole = 'merchant' | 'bdr-bdm' | 'se' | null;

// ─── Onboarding Guide Types ───────────────────────────────────────────────────
type GuideSectionCustomization = {
  isVisible?: boolean;
  customContent?: string;
};

type GuideCustomizations = {
  [sectionId: string]: GuideSectionCustomization;
};

type GuideCtx = {
  merchantName: string;
  seContact: string;
  seEmail: string;
};

type GuideSectionDef = {
  id: string;
  title: string;
  defaultContent: (data: SOWData, ctx: GuideCtx) => string;
  showByDefault: (data: SOWData) => boolean;
};

type SandboxIntroSectionDef = {
  id: string;
  title: string;
  defaultContent: (merchantName: string) => string;
};

// ─── PSP / APM helpers ────────────────────────────────────────────────────────
const getPSPCredentials = (psp: string): string => {
  const creds: Record<string, string> = {
    'Adyen': 'API Key, Merchant Account ID, Client Key, HMAC Key (webhooks)',
    'Stripe': 'Secret Key, Publishable Key',
    'Checkout.com': 'Secret Key, Public Key',
    'Braintree': 'Merchant ID, Public Key, Private Key',
    'Nuvei': 'Merchant ID, Merchant Site ID, Secret Key',
    'WorldPay': 'Merchant Code, XML Username, XML Password',
    'WorldPay VAP': 'Merchant Code, XML Username, XML Password',
    'Cybersource': 'Merchant ID, API Key ID, Secret Key',
    'Shift4': 'API Key, Merchant Account ID',
    'Rapyd': 'Access Key, Secret Key',
    'Mollie': 'API Key',
    'Unlimint': 'Terminal ID, Password',
    'Fiserv': 'API Key, API Secret, Merchant ID',
    'JPMC': 'Merchant ID, API Key, API Secret',
    'Nexi': 'Terminal ID, API Key',
    'Nets Easy': 'Secret Key, Checkout Key',
    'Monext': 'Access Key, Merchant ID',
    'emerchantpay': 'Username, Password, Terminal Token',
    'dLocal': 'API Key, Secret Key',
    'Airwallex': 'Client ID, API Key',
    'PayU LATAM': 'API Key, Merchant ID',
    'Xendit': 'Secret Key',
    'Fat Zebra': 'Username, Token',
    'Iyzico': 'API Key, Secret Key',
    'Omise': 'Secret Key, Public Key',
  };
  return creds[psp] || 'API credentials (contact your provider for sandbox details)';
};

const getAPMSetupNote = (pm: string): string => {
  const notes: Record<string, string> = {
    'PayPal': "Client ID and Client Secret from your PayPal developer account.",
    'Apple Pay': "Apple Pay merchant certificate — upload in Primer under Integrations.",
    'Google Pay': "Google Pay Merchant ID — configure in Primer under Integrations.",
    'Klarna': "Klarna API Key. Klarna supports auth-then-capture for physical goods.",
    'Afterpay': "Afterpay Merchant ID and Secret Key.",
    'Clearpay': "Clearpay Merchant ID and Secret Key.",
    'ACH': "ACH requires additional KYC. Contact your Primer SE to enable.",
    'iDEAL': "Routed through your card processor (if supported) or connected directly.",
    'Bancontact': "Connect via your card processor or directly through Integrations.",
    'Alipay': "Contact your Primer SE for setup guidance.",
    'Alipay+': "Contact your Primer SE for setup guidance.",
    'WeChat Pay': "Contact your Primer SE for setup guidance.",
    'Trustly': "Trustly merchant credentials from your Trustly account.",
    'Swish': "Requires a Swish merchant agreement.",
    'Twint': "Twint merchant credentials.",
    'Vipps': "Vipps merchant credentials.",
    'Mobilepay': "MobilePay merchant credentials.",
    'P24': "P24 Merchant ID and API key.",
    'EPS': "Routed through your card processor (if supported).",
    'Bancontact Payconiq': "Merchant credentials from Payconiq.",
    'Venmo': "Connected via PayPal integration — enable in PayPal settings.",
  };
  return notes[pm] || "Connect via Integrations → search for the payment method and follow the setup steps.";
};

// ─── Guide Section Definitions ────────────────────────────────────────────────
const GUIDE_SECTIONS: GuideSectionDef[] = [
  {
    id: 'welcome',
    title: 'Introduction',
    defaultContent: (data, ctx) => {
      const psps = [...data.newPSPs, ...(data.newPSPsOther ? [data.newPSPsOther] : [])];
      const pms = [...data.newPaymentMethods, ...(data.newPaymentMethodsOther ? [data.newPaymentMethodsOther] : [])];
      const pspText = psps.length > 0 ? psps.join(', ') : 'your payment processors';
      const pmText = pms.length > 0 ? pms.join(', ') : 'your payment methods';
      return `Welcome to Primer, ${ctx.merchantName || 'your team'}!\n\nThis guide walks your engineering team through every step to get your payment integration live. Follow each section in order — by the end, you'll have a fully working checkout with ${pmText} connected through ${pspText}.\n\nSandbox Dashboard: https://sandbox-dashboard.primer.io`;
    },
    showByDefault: () => true,
  },
  {
    id: 'sandbox',
    title: 'Step 1: Access the Sandbox',
    defaultContent: () =>
      `We've sent an invitation to your team's email address. Click the link in the email to create your Primer Sandbox account.\n\nSandbox Dashboard: https://sandbox-dashboard.primer.io\n\nOnce you accept the invite, you'll land on the Primer Dashboard where you can configure everything before going live.`,
    showByDefault: () => true,
  },
  {
    id: 'apiKey',
    title: 'Step 2: Create an API Key',
    defaultContent: () =>
      `You'll need an API key to authenticate all server-side requests.\n\n1. Go to Developers → API Keys in the sidebar\n   https://sandbox-dashboard.primer.io/developers/apiKeys\n2. Click Create API Key\n3. Give it a name (e.g. your-company-sandbox)\n4. Copy and securely store the key — you won't be able to see it again\n\nUse this key in the X-Api-Key header for all server-side calls.\nDocs: https://primer.io/docs/api-reference/get-started/authentication`,
    showByDefault: () => true,
  },
  {
    id: 'connectProcessors',
    title: 'Step 3: Connect Your Payment Processors',
    defaultContent: (data) => {
      const psps = [...data.newPSPs, ...(data.newPSPsOther ? [data.newPSPsOther] : [])];
      if (psps.length === 0) {
        return `Connect the processors you'll use through Primer. Go to Integrations in the sidebar.\n\n1. Search for your processor and click Connect\n2. Enter your sandbox credentials\n3. Click Save\n\nDocs: https://primer.io/docs/connections/payment-methods/overview`;
      }
      const rows = psps.map(psp => `| ${psp} | ${getPSPCredentials(psp)} |`).join('\n');
      return `Connect the following processors through Primer. Go to Integrations in the sidebar.\n\n| Processor | Credentials Needed |\n|-----------|-------------------|\n${rows}\n\n1. Search for each processor and click Connect\n2. Enter your sandbox credentials\n3. You may need multiple connections for separate MIDs (per region or brand) — each can be added as a separate connection\n\nDocs: https://primer.io/docs/connections/payment-methods/overview`;
    },
    showByDefault: () => true,
  },
  {
    id: 'connectAPMs',
    title: 'Step 3b: Connect Alternative Payment Methods',
    defaultContent: (data) => {
      const apms = [...data.newPaymentMethods.filter(pm => pm !== 'Card'), ...(data.newPaymentMethodsOther ? [data.newPaymentMethodsOther] : [])];
      if (apms.length === 0) return `Connect your alternative payment methods through Integrations.\n\nDocs: https://primer.io/docs/connections/payment-methods/overview`;
      const notes = apms.map(pm => `${pm}\n${getAPMSetupNote(pm)}`).join('\n\n');
      return `Connect the following alternative payment methods via Integrations → search for each method.\n\n${notes}\n\nDocs: https://primer.io/docs/connections/payment-methods/overview`;
    },
    showByDefault: (data) =>
      data.newPaymentMethods.filter(pm => pm !== 'Card').length > 0 || !!data.newPaymentMethodsOther,
  },
  {
    id: 'buildWorkflows',
    title: 'Step 4: Build Your Payment Workflows',
    defaultContent: (data) => {
      const psps = [...data.newPSPs, ...(data.newPSPsOther ? [data.newPSPsOther] : [])];
      const primary = psps[0] || 'your primary processor';
      const fallback = psps[1] || null;
      const hasRecurring = data.recurringPayments === 'yes' || data.transactionFlows.some(f => f.includes('MIT'));
      const has3DS = data.has3DSStrategy === 'yes';

      let out = `Workflows define how Primer routes and processes payments. Go to Workflows in the sidebar.\n\nDocs: https://primer.io/docs/build/workflows\n\n`;
      out += `Recommended Workflow — Card Payments (CIT)\n\nTrigger: Card payment (CIT)\n    │\n`;
      out += has3DS ? `    ├─ 3D Secure → ${primary}\n` : `    ├─ ${primary}\n`;
      out += `    │      │\n    │      ├─ Success ✓\n`;
      out += fallback
        ? `    │      └─ Decline → ${fallback}\n    │                   │\n    │                   ├─ Success ✓\n    │                   └─ Decline ✗\n`
        : `    │      └─ Decline ✗\n`;

      if (hasRecurring) {
        out += `\nRecommended Workflow — Recurring Payments (MIT)\n\nTrigger: Card payment (MIT)\n    │\n    ├─ ${primary} (no 3DS)\n    │      │\n    │      ├─ Success ✓\n`;
        out += fallback
          ? `    │      └─ Decline → ${fallback}\n    │                   │\n    │                   ├─ Success ✓\n    │                   └─ Decline ✗\n`
          : `    │      └─ Decline ✗\n`;
      }
      out += `\nBuild and customise all workflows visually in the drag-and-drop workflow builder.`;
      return out;
    },
    showByDefault: () => true,
  },
  {
    id: 'checkoutBuilder',
    title: 'Step 5: Configure Checkout Builder',
    defaultContent: (data) => {
      const pms = [...data.newPaymentMethods, ...(data.newPaymentMethodsOther ? [data.newPaymentMethodsOther] : [])];
      const rows = pms.length > 0
        ? pms.map(pm => `| ${pm} | Configure display rules and conditions |`).join('\n')
        : '| Cards | Always visible |\n| (add your payment methods) | Configure rules |';
      return `Checkout Builder controls which payment methods appear to customers — no code required.\n\nDocs: https://primer.io/docs/checkout/checkout-builder\n\n1. Go to Checkout in the sidebar\n2. Enable and configure:\n\n| Payment Method | Notes |\n|---------------|-------|\n${rows}\n\n3. Drag and drop to set display order\n4. Set conditions (e.g. show Klarna only for EU countries)\n5. Click Publish — changes take effect immediately, no deployment needed`;
    },
    showByDefault: () => true,
  },
  {
    id: 'clientSession',
    title: 'Step 6: Create a Client Session',
    defaultContent: () =>
      `Before showing checkout to a customer, your server creates a Client Session. This tells Primer about the order and returns a clientToken for the front-end.\n\nDocs: https://primer.io/docs/checkout/client-session\n\ncurl -X POST https://api.sandbox.primer.io/client-session \\\n  -H "X-Api-Key: <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "orderId": "order-123",\n    "currencyCode": "USD",\n    "amount": 2999,\n    "order": {\n      "lineItems": [{\n        "itemId": "item-1",\n        "description": "Product Name",\n        "amount": 2999,\n        "quantity": 1\n      }]\n    },\n    "customer": {\n      "emailAddress": "customer@example.com"\n    }\n  }'\n\nResponse:\n{\n  "clientToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "clientTokenExpirationDate": "2026-01-01T12:00:00Z"\n}\n\nThe token expires after 24 hours. Create a new one per checkout session.`,
    showByDefault: () => true,
  },
  {
    id: 'checkoutSDKWeb',
    title: 'Step 7: Integrate the Checkout SDK — Web',
    defaultContent: () =>
      `Add Primer's Universal Checkout to your web front-end.\n\nDocs: https://primer.io/docs/get-started/set-up-a-checkout\n\n<div id="checkout-container"></div>\n\n<script src="https://sdk.primer.io/web/v2/Primer.min.js"></script>\n<script>\n  const primer = await Primer.showUniversalCheckout(clientToken, {\n    container: '#checkout-container',\n    onCheckoutComplete({ payment }) {\n      console.log('Payment successful:', payment.id);\n      // Redirect to order confirmation\n    },\n    onCheckoutFail(error, { payment }) {\n      console.error('Payment failed:', error);\n      // Show error to customer\n    }\n  });\n</script>\n\nPrimer's Universal Checkout renders all configured payment methods through a single integration.`,
    showByDefault: (data) =>
      data.channels.length === 0 || data.channels.some(c => c.includes('Online') || c.includes('Web')),
  },
  {
    id: 'checkoutSDKMobile',
    title: 'Step 7b: Mobile SDK Integration',
    defaultContent: (data) => {
      const hasWebView = data.channels.some(c => c.includes('Web View'));
      const hasNative = data.channels.some(c => c.includes('iOS') || c.includes('Android') || c.includes('Apps'));
      let out = `Docs: https://primer.io/docs/get-started/set-up-a-checkout\n\n`;
      if (hasWebView) {
        out += `Mobile Web View\n\nLoad the checkout page (containing the Primer Web SDK) in a web view:\n• iOS: Use ASWebAuthenticationSession or WKWebView\n• Android: Use Chrome Custom Tabs or WebView\n\nApple Pay works natively on iOS within web views. Redirects for other payment methods are handled seamlessly.\n\n`;
      }
      if (hasNative) {
        out += `Native SDK\n\nFor native iOS/Android apps, use the Primer native SDK:\n• iOS: https://primer.io/docs/sdks/ios\n• Android: https://primer.io/docs/sdks/android\n• React Native: https://primer.io/docs/sdks/react-native\n\n`;
      }
      out += `Contact your Primer SE for guidance on the best mobile integration approach for your setup.`;
      return out;
    },
    showByDefault: (data) => data.channels.some(c => c.includes('Mobile')),
  },
  {
    id: 'recurringMIT',
    title: 'Step 8: Recurring & Merchant-Initiated Payments',
    defaultContent: (data) => {
      const psps = [...data.newPSPs, ...(data.newPSPsOther ? [data.newPSPsOther] : [])];
      const primary = psps[0] || 'your processor';
      const platform = data.subscriptionPlatform && data.subscriptionPlatform !== 'no' ? data.subscriptionPlatform : null;
      return `For recurring payments, use the Primer Payments API with a stored paymentMethodToken.\n\nDocs: https://primer.io/docs/api-reference\n\n${platform ? `Note: Your subscription platform (${platform}) will trigger MIT payments via the Primer API.\n\n` : ''}When a customer completes their first payment, Primer vaults their card. Store the returned paymentMethodToken securely for future charges.\n\nMIT API call (subscription renewal):\n\ncurl -X POST https://api.sandbox.primer.io/payments \\\n  -H "X-Api-Key: <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "orderId": "renewal-456",\n    "currencyCode": "USD",\n    "amount": 2999,\n    "paymentMethodToken": "<STORED_TOKEN>",\n    "customer": { "emailAddress": "customer@example.com" }\n  }'\n\nNo 3DS for MIT — the customer is not present. Primer routes the payment through your MIT workflow via ${primary}.`;
    },
    showByDefault: (data) =>
      data.recurringPayments === 'yes' || data.transactionFlows.some(f => f.includes('MIT')),
  },
  {
    id: 'tokenMigration',
    title: 'Step 9: Token Migration',
    defaultContent: (data) => {
      const entries = data.tokenMigrationEntries.filter(e => e.psp);
      const total = entries.reduce((sum, e) => sum + (parseInt(e.tokenCount) || 0), 0);
      let out = `Token migration moves your existing vaulted payment methods to Primer so customers don't need to re-enter their details at go-live.\n\nDocs: https://primer.io/docs/features/vault/token-migration\n\n`;
      if (entries.length > 0) {
        out += `Tokens to migrate:\n`;
        entries.forEach(e => { out += `• ${e.psp}: ${parseInt(e.tokenCount).toLocaleString()} tokens\n`; });
        if (total > 0) out += `Total: ${total.toLocaleString()} tokens\n\n`;
      }
      out += `Migration steps:\n1. Export your token file from each PSP in the required format\n2. Share the encrypted token file with your Primer SE\n3. Primer validates the migration in sandbox first\n4. Production migration is scheduled close to go-live\n\nImportant: Notify and align with your Primer SE before starting the migration process.`;
      return out;
    },
    showByDefault: (data) => data.tokenMigrationRequired === 'yes',
  },
  {
    id: 'threeDSConfig',
    title: 'Step 10: 3DS Configuration',
    defaultContent: (data) => {
      const strategy = data.threeDSStrategy === 'mandated' ? 'Mandated 3DS'
        : data.threeDSStrategy === 'adaptive' ? 'Adaptive 3DS'
        : data.threeDSStrategyOther || 'your 3DS strategy';
      return `Docs: https://primer.io/docs/payment-services/3d-secure/overview\n\nYour 3DS strategy: ${strategy}\n\nTo enable 3DS for your processors, provide the Primer team with:\n• Acquirer MIDs for each supported card scheme per PSP\n• BINs for each supported card scheme per PSP\n• MCC codes from each PSP (if not yet provided)\n\nRequest these from each processor and share them with your Primer SE.\n\n${data.threeDSStrategy === 'adaptive' ? 'Adaptive 3DS challenges transactions based on risk signals — minimising friction for low-risk transactions while maintaining compliance.' : ''}${data.threeDSStrategy === 'mandated' ? 'Mandated 3DS applies authentication to all applicable transactions. Add a 3D Secure node to your CIT workflows.' : ''}`;
    },
    showByDefault: (data) => data.has3DSStrategy === 'yes',
  },
  {
    id: 'networkTokenization',
    title: 'Step 11: Network Tokenisation',
    defaultContent: () =>
      `Network Tokens replace raw card numbers with credentials issued by card networks (Visa, Mastercard). This typically improves authorisation rates by 2–5% and reduces declines from card expiry.\n\nDocs: https://primer.io/docs/features/network-tokens\n\n1. Go to Settings → Network Tokenisation in the sidebar\n2. Enable Network Tokenisation for your processors\n3. Primer automatically requests and manages tokens for eligible cards\n4. Add a Network Token step in your MIT workflows to prioritise tokenised transactions\n\nTransparent to customers — no UX change, better auth rates on your side.`,
    showByDefault: () => true,
  },
  {
    id: 'refunds',
    title: 'Step 12: Refunds',
    defaultContent: () =>
      `Refunds can be triggered via the Primer API or directly from the Dashboard.\n\nDocs: https://primer.io/docs/api-reference\n\nAPI Refund:\n\ncurl -X POST https://api.sandbox.primer.io/payments/<PAYMENT_ID>/refund \\\n  -H "X-Api-Key: <YOUR_API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "amount": 2999, "reason": "Customer requested refund" }'\n\nDashboard: Payments → find the transaction → click Refund\n\nPrimer routes refunds to the original processor automatically. Both full and partial refunds are supported.`,
    showByDefault: () => true,
  },
  {
    id: 'goLiveChecklist',
    title: 'Go-Live Checklist',
    defaultContent: (data) => {
      const psps = [...data.newPSPs, ...(data.newPSPsOther ? [data.newPSPsOther] : [])];
      const apms = [...data.newPaymentMethods.filter(pm => pm !== 'Card'), ...(data.newPaymentMethodsOther ? [data.newPaymentMethodsOther] : [])];
      const hasRecurring = data.recurringPayments === 'yes' || data.transactionFlows.some(f => f.includes('MIT'));
      const has3DS = data.has3DSStrategy === 'yes';
      const hasMobile = data.channels.some(c => c.includes('Mobile'));
      const hasWeb = data.channels.length === 0 || data.channels.some(c => c.includes('Online') || c.includes('Web'));
      const hasTokenMigration = data.tokenMigrationRequired === 'yes';

      let list = `Setup\n`;
      list += `☐ Sandbox invite accepted\n☐ API key created\n`;
      psps.forEach(p => { list += `☐ ${p} connected with sandbox credentials\n`; });
      apms.forEach(pm => { list += `☐ ${pm} connected\n`; });

      list += `\nWorkflows & Checkout\n`;
      list += `☐ CIT workflow built and tested\n`;
      if (hasRecurring) list += `☐ MIT workflow built and tested\n`;
      list += `☐ Checkout Builder configured and published\n`;

      list += `\nIntegration\n`;
      list += `☐ Client session creation working from your server\n`;
      if (hasWeb) list += `☐ Web SDK rendering correctly\n`;
      if (hasMobile) list += `☐ Mobile integration tested\n`;
      if (hasRecurring) list += `☐ MIT payments triggering correctly for renewals\n`;

      list += `\nTesting\n`;
      if (has3DS) list += `☐ 3DS flow tested (challenge and frictionless)\n`;
      list += `☐ Successful payment end-to-end in sandbox\n`;
      list += `☐ Failed payment handling tested\n`;
      list += `☐ Refund flow tested\n`;
      list += `☐ Webhooks configured and receiving events\n`;

      if (hasTokenMigration) {
        list += `\nToken Migration\n`;
        list += `☐ Token export from previous PSP(s) completed\n`;
        list += `☐ Token file shared with Primer SE\n`;
        list += `☐ Sandbox migration validated\n`;
        list += `☐ Production migration scheduled\n`;
      }

      list += `\nGo-Live\n`;
      list += `☐ Network Tokenisation enabled\n`;
      list += `☐ Production API key created\n`;
      list += `☐ Production processor credentials connected\n`;
      list += `☐ Checkout Builder published in production\n`;
      if (data.goLiveDate) {
        const d = new Date(data.goLiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        list += `☐ Go-live confirmed: ${d}\n`;
      }
      return list;
    },
    showByDefault: () => true,
  },
  {
    id: 'needHelp',
    title: 'Need Help?',
    defaultContent: (data, ctx) =>
      `Your Primer SE is here to support you through every step of the integration.\n\n${ctx.seContact ? `Solutions Engineer: ${ctx.seContact}${ctx.seEmail ? ` — ${ctx.seEmail}` : ''}` : 'Contact your Primer Solutions Engineer for technical questions, integration blockers, or to schedule a working session.'}\n\nReach out with any questions about workflow design, 3DS configuration, token migration, or connecting a new processor.`,
    showByDefault: () => true,
  },
];

// ─── Sandbox Intro Section Definitions ───────────────────────────────────────
const SANDBOX_INTRO_SECTIONS: SandboxIntroSectionDef[] = [
  {
    id: 'si_intro',
    title: 'Introduction',
    defaultContent: (merchantName) =>
      `Welcome, ${merchantName}! This guide is a quick reference to the key product features you'll want to explore within the Primer Sandbox — and touches on implementation of checkout as well.\n\nFor a step-by-step overview: https://primer.io/docs/get-started/overview`,
  },
  {
    id: 'si_quickLinks',
    title: 'Quick Links',
    defaultContent: () =>
      `Sandbox URL: https://sandbox-dashboard.primer.io/\nStep-by-step overview: https://primer.io/docs/get-started/overview\nPrimer Docs: https://primer.io/docs/home\nCheckout Implementation Dev Docs: https://web-components.primer.io/guides/getting-started#installation`,
  },
  {
    id: 'si_integrations',
    title: 'Integrations',
    defaultContent: () =>
      `▶ Video tutorial: https://www.loom.com/share/9a69bd9090104c2cbebd67702738208a\n🔗 Primer Integrations docs: https://primer.io/docs/get-started/connect-a-processor\n\nThe Integrations tab on the left brings you to all connected PSPs and Payment Methods. All Sandbox accounts are automatically provisioned with a Primer test processor — use this to test card payments right away.\n\nClick + New Integration (top right) to add a new Processor or Payment Method. Most integrations will ask for a Merchant ID and various API Keys, which can be found in each processor's dashboard or developer settings.\n\nBrowse the category filters to explore Primer's native integrations, and filter by currency and location to understand which payment methods are available in the regions you want to support.\nhttps://primer.io/apps-integrations`,
  },
  {
    id: 'si_workflows',
    title: 'Workflows',
    defaultContent: (merchantName) =>
      `▶ Video tutorial: https://www.loom.com/share/80f3b1a797fa4a42bc18fb8d6bb7bfca\n🔗 Primer Workflows docs: https://primer.io/docs/get-started/create-workflow\n\nClick the Workflows tab on the left to see all your workflows. Click + New Workflow (top right) to browse templates, or use + Create blank workflow to start from scratch.\n\nSimple payment authorization workflow:\n• Start with a 'Payment created' trigger\n• Add an 'Authorize payment' action\n• In the right panel, configure:\n  — Primary processor & MID\n  — A fallback processor & MID (recommended)\n  — 3DS settings\n• Add a 'Continue payment flow' action to finish\n• Hit Publish (top right)\n\nConditions Utility (https://primer.io/docs/workflows/utilities/conditions-block)\n• Template: Route transactions based on currency\n• ${merchantName} can use this to apply different 3DS settings by region\n\nSplit Utility (https://primer.io/docs/workflows/utilities/split)\n• A/B test processors and/or fraud providers\n• Create up to 5 splits and choose traffic distribution`,
  },
  {
    id: 'si_checkout',
    title: 'Checkout',
    defaultContent: (merchantName) =>
      `▶ Video tutorial: https://www.loom.com/share/7e855268d22748baac1807f3454df3c5\n🔗 Primer Checkout docs: https://primer.io/docs/checkout/overview\n🔗 Dev docs for integration: https://web-components.primer.io/\n\nUse the Checkout tab to preview and configure your Primer Checkout. Enable/disable payment methods, and drag-and-drop to re-arrange APMs.\n\nConditions can be set on each payment method based on:\n• Order currency & amount\n• Order country\n• Metadata\n\nAfter configuring, hit Publish (top right). Re-publish any time you add a new payment method or integration.\n\n${merchantName}'s development team will need to:\n1. Make a Client Session Request (https://primer.io/docs/api/api-reference/client-session-api/create-client-side-token)\n   • orderId, currencyCode, customer details\n2. Integrate the Primer SDK and add the primer-checkout component to your checkout page\n\n💡 Test card details: https://primer.io/docs/testing/primer-sandbox-processor`,
  },
  {
    id: 'si_payments',
    title: 'Payments',
    defaultContent: () =>
      `▶ Video tutorial: https://www.loom.com/share/f6f6951ae09a46c1a15aba06cb99330d\n🔗 Primer Payment Timeline docs: https://primer.io/docs/concepts/payment-timeline\n\nClick the Payments tab to view all transactions. Quick filters: Authorized, Settled, Declined. Use the date range picker and Filters (top right) for deeper views.\n\n💡 Tip: If you've tested fallback processors, add a "Fallback Processor Used = TRUE" filter to isolate those transactions.\n\nClick into any transaction to view:\n• Payment Timeline — step-by-step flow of what happened\n• Workflow Runs — which workflows were triggered\n• Click each timeline step for transaction details and API Requests/Responses between Primer and the PSP`,
  },
  {
    id: 'si_observability',
    title: 'Observability',
    defaultContent: (merchantName) =>
      `▶ Video tutorial: https://www.loom.com/share/96b508f3671840eea22ab54a1a341c80\n🔗 Primer Observability docs: https://primer.io/docs/observability/overview\n\nThe Observability tab gives you an overview of all payment data:\n• Total Sales Value\n• Authorization Rate\n• Declines Count\n\nScroll down for curated dashboards with key payment metrics. Each report has filter controls at the top.\n\nWe recommend browsing the reports and considering what additional data to add to your client sessions — such as via metadata — for analysis and filtering.\n\n💡 As ${merchantName} grows its tech stack on Primer, custom dashboards can be requested through your Customer Success Manager.`,
  },
  {
    id: 'si_monitors',
    title: 'Monitors',
    defaultContent: () =>
      `▶ Video tutorial: https://www.loom.com/share/40e9610e40f14938a49e88661641abde\n🔗 Primer Monitors docs: https://primer.io/docs/monitors/overview\n\nClick the Monitors tab, then + New monitor (top right) to get started.\n\nTo start testing:\n• Create a monitor: Payments Count > 1, time period 5 minutes, minimum payments = 0\n• Run a few successful test transactions back-to-back\n• After ~5 minutes, the monitor should show a red event\n\nRecommended monitors:\n• Payment Declines/Failed — a spike can indicate a PSP outage\n• Fallback — a high rate of fallbacks can indicate an issue with your primary PSP\n\n💡 As you evolve with Primer, review monitors regularly. Your CSM will provide strategic recommendations.\n\nMonitor + Workflow notifications (https://primer.io/docs/monitors/notifications):\n1. + New Workflow → Operational efficiency → Alerting from Monitors\n2. Or build from scratch: 'Monitor event created' trigger\n3. Add condition for Monitor ID (from the URL when editing a monitor)\n4. Add a 'Send email' action using the Primer Emails app\n5. Add monitor variables to auto-populate the email body\n6. Hit Publish, then trigger events — watch the emails come in!`,
  },
  {
    id: 'si_reconciliation',
    title: 'Reconciliation',
    defaultContent: () =>
      `▶ Video tutorial: https://www.loom.com/share/69df454a68b34b14b299acbcd8a23252\n🔗 Primer Reconciliation docs: https://primer.io/docs/reconciliation/overview\n\nThe Reconciliation tab shows all reconciliation batches from supported processors, organised by processor + MID + settlement currency.\n\nClick into a batch to see transaction-level data and details. Export using the + Export data button, or request SFTP access via your CSM (production only).\nhttps://primer.io/docs/reconciliation/unified-settlement-report#consuming-reports-via-sftp\n\nMore info on report content: https://primer.io/docs/reconciliation/report-content\n\nCurrently supported processors:\nAdyen, Checkout.com, Klarna, Mollie, Monext, PayPal, Stripe, and Thunes\nhttps://primer.io/docs/reconciliation/supported-processors\n\nPrimer is actively onboarding more processors — your team will work closely with you throughout launch and go-live to evaluate additional recon reports you may need.`,
  },
];

type SOWVersion = {
  id: string;
  version: string;
  createdBy: UserRole;
  createdAt: string;
  data: SOWData;
  merchantName?: string;
  seReviewed?: boolean;
  seApproved?: boolean;
  sharedInMeetingDate?: string;
  emailedTo?: string;
  emailedDate?: string;
  publishedToMerchant?: boolean;
  guideCustomizations?: GuideCustomizations;
  seContact?: string;
  seEmail?: string;
};

export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [merchantName, setMerchantNameInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [schema, setSchema] = useState<QuestionnaireSchema | null>(null);
  const [gandalfQuestionnaire, setGandalfQuestionnaire] = useState<GandalfQuestionnaire | null>(null);
  const [showSchemaImport, setShowSchemaImport] = useState(false);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [versions, setVersions] = useState<SOWVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string>('');
  const [seReviewed, setSeReviewed] = useState(false);
  const [sowData, setSOWData] = useState<SOWData>({
    goLiveDate: '',
    currentPaymentMethods: [],
    currentPaymentMethodsOther: '',
    newPaymentMethods: [],
    newPaymentMethodsOther: '',
    currentPSPs: [],
    currentPSPsOther: '',
    newPSPs: [],
    newPSPsOther: '',
    paymentMethods: [],
    paymentMethodsOther: '',
    psps: [],
    pspsOther: '',
    has3DSStrategy: '',
    threeDSStrategy: '',
    threeDSStrategyOther: '',
    channels: [],
    transactionFlows: [],
    recurringPayments: '',
    subscriptionPlatform: '',
    tokenMigrationRequired: '',
    tokenMigrationEntries: [
      {
        id: '1',
        psp: '',
        tokenCount: '',
      },
    ],
    goLiveDateNotes: '',
    paymentMethodsNotes: '',
    pspsNotes: '',
    threeDSNotes: '',
    channelsNotes: '',
    tokenMigrationNotes: '',
  });

  // Load default schema and versions on mount
  useEffect(() => {
    loadDefaultSchema();
    loadVersionsFromLocalStorage();
  }, []);

  const loadVersionsFromLocalStorage = () => {
    try {
      const savedVersions = localStorage.getItem('sow-versions');
      if (savedVersions) {
        const parsedVersions = JSON.parse(savedVersions);
        setVersions(parsedVersions);
      }
    } catch (error) {
      console.error('Failed to load versions from localStorage:', error);
    }
  };

  const saveVersionToLocalStorage = (newVersion: SOWVersion) => {
    try {
      const updatedVersions = [...versions, newVersion];
      localStorage.setItem('sow-versions', JSON.stringify(updatedVersions));
      setVersions(updatedVersions);
      setCurrentVersionId(newVersion.id);
    } catch (error) {
      console.error('Failed to save version to localStorage:', error);
    }
  };

  const loadDefaultSchema = async () => {
    try {
      const response = await fetch('/default-schema.json');
      const schemaData = await response.json();
      setSchema(schemaData);
      console.log('Default schema loaded successfully');
    } catch (error) {
      console.error('Failed to load default schema, using hardcoded defaults:', error);
      // Schema stays null, will fall back to CATEGORIES
    }
  };

  const handleSchemaImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Check if it's a Gandalf questionnaire (has questions array)
        if (data.questions && Array.isArray(data.questions)) {
          setGandalfQuestionnaire(data);
          setSchema(null);
          setDynamicFormData({});
          alert(`Gandalf questionnaire "${data.title}" imported successfully!`);
        }
        // Otherwise assume it's our custom schema format
        else if (data.steps && Array.isArray(data.steps)) {
          setSchema(data);
          setGandalfQuestionnaire(null);
          alert('Custom schema imported successfully!');
        } else {
          alert('Unrecognized schema format. Please upload a valid questionnaire JSON.');
          return;
        }

        setShowSchemaImport(false);
        setCurrentStep(0);

        // Reset form data
        setSOWData({
          goLiveDate: '',
          currentPaymentMethods: [],
          currentPaymentMethodsOther: '',
          newPaymentMethods: [],
          newPaymentMethodsOther: '',
          currentPSPs: [],
          currentPSPsOther: '',
          newPSPs: [],
          newPSPsOther: '',
          paymentMethods: [],
          paymentMethodsOther: '',
          psps: [],
          pspsOther: '',
          has3DSStrategy: '',
          threeDSStrategy: '',
          threeDSStrategyOther: '',
          channels: [],
          transactionFlows: [],
          recurringPayments: '',
          subscriptionPlatform: '',
          tokenMigrationRequired: '',
          tokenMigrationEntries: [{ id: '1', psp: '', tokenCount: '' }],
          goLiveDateNotes: '',
          paymentMethodsNotes: '',
          pspsNotes: '',
          threeDSNotes: '',
          channelsNotes: '',
          tokenMigrationNotes: '',
        });
      } catch (error) {
        alert('Failed to parse questionnaire JSON. Please check the file format.');
        console.error('Questionnaire import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleExportSchema = () => {
    if (!schema) return;

    const dataStr = JSON.stringify(schema, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questionnaire-schema.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get current question/step based on active questionnaire type
  const getCurrentStep = () => {
    // Step 0 is always merchant name for all roles
    if (currentStep === 0) {
      return { type: 'merchant-name', label: 'Merchant Name' };
    }

    // Adjust step index — skip step 0 (merchant name) for all roles
    const adjustedStep = currentStep - 1;

    if (gandalfQuestionnaire) {
      const sortedQuestions = [...gandalfQuestionnaire.questions].sort((a, b) => a.orderIndex - b.orderIndex);
      return sortedQuestions[adjustedStep];
    } else if (schema) {
      return schema.steps[adjustedStep];
    } else {
      return CATEGORIES[adjustedStep];
    }
  };

  const getTotalSteps = () => {
    let baseSteps = 0;
    if (gandalfQuestionnaire) {
      baseSteps = gandalfQuestionnaire.questions.length;
    } else if (schema) {
      baseSteps = schema.steps.length;
    } else {
      baseSteps = CATEGORIES.length;
    }

    // Add 1 for merchant name step (all roles)
    return baseSteps + 1;
  };

  const currentCategory = getCurrentStep();
  const totalSteps = getTotalSteps();
  const isLastStep = currentStep === totalSteps - 1;

  const handleInputChange = (field: keyof SOWData, value: any) => {
    setSOWData({
      ...sowData,
      [field]: value,
    });
  };

  const togglePaymentMethod = (method: string) => {
    const currentMethods = sowData.paymentMethods;
    if (currentMethods.includes(method)) {
      handleInputChange('paymentMethods', currentMethods.filter(m => m !== method));
    } else {
      handleInputChange('paymentMethods', [...currentMethods, method]);
    }
  };

  const toggleCurrentPaymentMethod = (method: string) => {
    const currentMethods = sowData.currentPaymentMethods;
    if (currentMethods.includes(method)) {
      handleInputChange('currentPaymentMethods', currentMethods.filter(m => m !== method));
    } else {
      handleInputChange('currentPaymentMethods', [...currentMethods, method]);
    }
  };

  const toggleNewPaymentMethod = (method: string) => {
    const newMethods = sowData.newPaymentMethods;
    if (newMethods.includes(method)) {
      handleInputChange('newPaymentMethods', newMethods.filter(m => m !== method));
    } else {
      handleInputChange('newPaymentMethods', [...newMethods, method]);
    }
  };

  const togglePSP = (psp: string) => {
    const currentPSPs = sowData.psps;
    if (currentPSPs.includes(psp)) {
      handleInputChange('psps', currentPSPs.filter(p => p !== psp));
    } else {
      handleInputChange('psps', [...currentPSPs, psp]);
    }
  };

  const toggleCurrentPSP = (psp: string) => {
    const currentPSPs = sowData.currentPSPs;
    if (currentPSPs.includes(psp)) {
      handleInputChange('currentPSPs', currentPSPs.filter(p => p !== psp));
    } else {
      handleInputChange('currentPSPs', [...currentPSPs, psp]);
    }
  };

  const toggleNewPSP = (psp: string) => {
    const newPSPs = sowData.newPSPs;
    if (newPSPs.includes(psp)) {
      handleInputChange('newPSPs', newPSPs.filter(p => p !== psp));
    } else {
      handleInputChange('newPSPs', [...newPSPs, psp]);
    }
  };

  const toggleChannel = (channel: string) => {
    const currentChannels = sowData.channels;
    if (currentChannels.includes(channel)) {
      handleInputChange('channels', currentChannels.filter(c => c !== channel));
    } else {
      handleInputChange('channels', [...currentChannels, channel]);
    }
  };

  const toggleTransactionFlow = (flow: string) => {
    const currentFlows = sowData.transactionFlows;
    if (currentFlows.includes(flow)) {
      handleInputChange('transactionFlows', currentFlows.filter(f => f !== flow));
    } else {
      handleInputChange('transactionFlows', [...currentFlows, flow]);
    }
  };

  const handleTokenEntryChange = (id: string, field: keyof TokenMigrationEntry, value: string) => {
    setSOWData({
      ...sowData,
      tokenMigrationEntries: sowData.tokenMigrationEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    });
  };

  const addTokenEntry = () => {
    const newId = (sowData.tokenMigrationEntries.length + 1).toString();
    setSOWData({
      ...sowData,
      tokenMigrationEntries: [
        ...sowData.tokenMigrationEntries,
        {
          id: newId,
          psp: '',
          tokenCount: '',
        },
      ],
    });
  };

  const removeTokenEntry = (id: string) => {
    if (sowData.tokenMigrationEntries.length > 1) {
      setSOWData({
        ...sowData,
        tokenMigrationEntries: sowData.tokenMigrationEntries.filter((entry) => entry.id !== id),
      });
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      // Create a new version when completing the SOW
      const newVersion: SOWVersion = {
        id: `v${versions.length + 1}-${Date.now()}`,
        version: `v${versions.length + 1}.0`,
        createdBy: userRole!,
        createdAt: new Date().toISOString(),
        data: sowData,
        merchantName: merchantName || 'Unknown Merchant',
        seReviewed: false,
      };
      saveVersionToLocalStorage(newVersion);
      setShowOutput(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleBackToEdit = () => {
    setShowOutput(false);
    setUserRole('se');
    setCurrentStep(0);
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setCurrentStep(0);
  };

  const handleRoleChange = () => {
    setUserRole(null);
    setCurrentStep(0);
    setMerchantNameInput('');
    setShowOutput(false);
  };

  // Role Selection Screen
  if (!userRole) {
    return (
      <div className={styles.container}>
        <div className={styles.roleSelectionContainer}>
          <h1 className={styles.roleSelectionTitle}>Welcome to SOW Builder</h1>
          <p className={styles.roleSelectionSubtitle}>Select your role to get started</p>

          <div className={styles.roleCards}>
            <button
              className={styles.roleCard}
              onClick={() => handleRoleSelect('merchant')}
            >
              <div className={styles.roleCardIcon}>🏢</div>
              <h2 className={styles.roleCardTitle}>Merchant</h2>
              <p className={styles.roleCardDescription}>I'm looking to integrate payment solutions</p>
            </button>

            <button
              className={styles.roleCard}
              onClick={() => handleRoleSelect('bdr-bdm')}
            >
              <div className={styles.roleCardIcon}>💼</div>
              <h2 className={styles.roleCardTitle}>BDR/BDM</h2>
              <p className={styles.roleCardDescription}>Business Development Representative/Manager</p>
            </button>

            <button
              className={styles.roleCard}
              onClick={() => handleRoleSelect('se')}
            >
              <div className={styles.roleCardIcon}>⚙️</div>
              <h2 className={styles.roleCardTitle}>SE</h2>
              <p className={styles.roleCardDescription}>Solutions Engineer</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOutput) {
    return (
      <OutputView
        sowData={sowData}
        setSOWData={setSOWData}
        onBackToEdit={handleBackToEdit}
        versions={versions}
        currentVersionId={currentVersionId}
        userRole={userRole}
        onVersionsUpdate={(updatedVersions) => {
          setVersions(updatedVersions);
          localStorage.setItem('sow-versions', JSON.stringify(updatedVersions));
        }}
      />
    );
  }

  const renderGandalfQuestion = (question: GandalfQuestion) => {
    const fieldValue = dynamicFormData[question.id] || '';

    const handleChange = (value: any) => {
      setDynamicFormData({
        ...dynamicFormData,
        [question.id]: value,
      });
    };

    switch (question.questionType) {
      case 'TEXT_INPUT':
        return (
          <div>
            {question.supportingDetail && (
              <p className={styles.supportingDetail}>{question.supportingDetail}</p>
            )}
            <input
              type="text"
              className={styles.textInput}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter your answer..."
              required={question.isRequired}
            />
          </div>
        );

      case 'EXCLUSIVE_SELECT':
        return (
          <div className={styles.radioGroup}>
            {question.supportingDetail && (
              <p className={styles.supportingDetail}>{question.supportingDetail}</p>
            )}
            <div className={styles.radioOptionsVertical}>
              {question.answers?.sort((a, b) => a.orderIndex - b.orderIndex).map((answer) => (
                <div key={answer.id}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name={question.id}
                      checked={fieldValue === answer.id}
                      onChange={() => handleChange(answer.id)}
                      className={styles.radio}
                      required={question.isRequired}
                    />
                    <span>{answer.text}</span>
                  </label>
                  {answer.referenceUrl && (
                    <a
                      href={answer.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.referenceLink}
                    >
                      📚 Learn more
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'MULTI_SELECT':
        const multiSelectValue = fieldValue || [];

        const toggleMultiSelect = (answerId: string) => {
          const currentValues = Array.isArray(multiSelectValue) ? multiSelectValue : [];
          if (currentValues.includes(answerId)) {
            handleChange(currentValues.filter((id: string) => id !== answerId));
          } else {
            handleChange([...currentValues, answerId]);
          }
        };

        return (
          <div className={styles.checkboxGroup}>
            {question.supportingDetail && (
              <p className={styles.supportingDetail}>{question.supportingDetail}</p>
            )}
            {question.answers?.sort((a, b) => a.orderIndex - b.orderIndex).map((answer) => (
              <div key={answer.id}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={multiSelectValue.includes(answer.id)}
                    onChange={() => toggleMultiSelect(answer.id)}
                    className={styles.checkbox}
                  />
                  <span>{answer.text}</span>
                </label>
                {answer.referenceUrl && (
                  <a
                    href={answer.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.referenceLink}
                  >
                    📚 Learn more
                  </a>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return <div>Unsupported question type: {question.questionType}</div>;
    }
  };

  const renderFormField = () => {
    // Merchant name field — step 0 for all roles
    if (currentCategory && 'type' in currentCategory && currentCategory.type === 'merchant-name') {
      return (
        <div>
          <p className={styles.supportingDetail}>Please enter the merchant name for this SOW</p>
          <input
            type="text"
            className={styles.textInput}
            value={merchantName}
            onChange={(e) => setMerchantNameInput(e.target.value)}
            placeholder="e.g., Acme Corp"
            required
          />
        </div>
      );
    }

    // If using Gandalf questionnaire, render that instead
    if (gandalfQuestionnaire && currentCategory && 'questionType' in currentCategory) {
      return renderGandalfQuestion(currentCategory as GandalfQuestion);
    }

    // If using schema with sections (from default-schema.json)
    if (schema && currentCategory && 'sections' in currentCategory) {
      const step = currentCategory as SchemaStep;
      // For now, fall back to hardcoded rendering based on step id
      // This maintains backward compatibility with the original form
      const stepId = step.id;

      if (CATEGORIES.find(cat => cat.id === stepId)) {
        const matchingCategory = CATEGORIES.find(cat => cat.id === stepId);
        if (matchingCategory) {
          return renderCategoryField(matchingCategory);
        }
      }

      return <div>Schema-based rendering not yet implemented for this step</div>;
    }

    // Otherwise render based on CATEGORIES
    if (!currentCategory || !('type' in currentCategory)) {
      return <div>Invalid question configuration</div>;
    }

    return renderCategoryField(currentCategory as typeof CATEGORIES[0]);
  };

  const renderCategoryField = (category: typeof CATEGORIES[0]) => {
    const renderNotesField = (notesField: keyof SOWData) => {
      if (userRole !== 'se') return null;

      return (
        <div className={styles.seNotesSection}>
          <label className={styles.seNotesLabel}>Additional Notes (SE Only):</label>
          <textarea
            className={styles.seNotesTextarea}
            value={sowData[notesField] as string || ''}
            onChange={(e) => handleInputChange(notesField, e.target.value)}
            placeholder="Add any additional notes or context for this section..."
            rows={4}
          />
        </div>
      );
    };

    switch (category.type) {
      case 'date':
        return (
          <div>
            <input
              type="date"
              className={styles.dateInput}
              value={sowData.goLiveDate}
              onChange={(e) => handleInputChange('goLiveDate', e.target.value)}
            />
            {renderNotesField('goLiveDateNotes')}
          </div>
        );

      case 'current-payment-methods-psps':
        return (
          <div className={styles.pspApmsWrapper}>
            {/* Current Payment Methods */}
            <div className={styles.paymentMethodsSection}>
              <p className={styles.sectionSubtitle}>
                What payment methods are you <span className={styles.highlightedText}>currently</span> offering?
              </p>
              <div className={styles.paymentMethodsGridCompact}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`${styles.paymentMethodButtonCompact} ${
                      sowData.currentPaymentMethods.includes(method) ? styles.paymentMethodButtonActive : ''
                    }`}
                    onClick={() => toggleCurrentPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <div className={styles.otherInputField}>
                <label className={styles.otherInputLabel}>Other:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={sowData.currentPaymentMethodsOther}
                  onChange={(e) => handleInputChange('currentPaymentMethodsOther', e.target.value)}
                  placeholder="Enter other current payment methods"
                />
              </div>
            </div>

            {/* Current PSPs */}
            <div className={styles.paymentMethodsSection}>
              <p className={styles.sectionSubtitle}>
                Which PSPs are you <span className={styles.highlightedText}>currently</span> using?
              </p>
              <div className={styles.paymentMethodsGridCompact}>
                {PSPS.map((psp) => (
                  <button
                    key={psp}
                    type="button"
                    className={`${styles.paymentMethodButtonCompact} ${
                      sowData.currentPSPs.includes(psp) ? styles.paymentMethodButtonActive : ''
                    }`}
                    onClick={() => toggleCurrentPSP(psp)}
                  >
                    {psp}
                  </button>
                ))}
              </div>
              <div className={styles.otherInputField}>
                <label className={styles.otherInputLabel}>Other:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={sowData.currentPSPsOther}
                  onChange={(e) => handleInputChange('currentPSPsOther', e.target.value)}
                  placeholder="Enter other current PSPs"
                />
              </div>
            </div>
            {renderNotesField('paymentMethodsNotes')}
          </div>
        );

      case 'new-payment-methods-psps':
        return (
          <div className={styles.pspApmsWrapper}>
            {/* New Payment Methods */}
            <div className={styles.paymentMethodsSection}>
              <p className={styles.sectionSubtitle}>
                What payment methods do you want to <span className={styles.highlightedText}>add</span>?
              </p>
              <div className={styles.paymentMethodsGridCompact}>
                {PAYMENT_METHODS.filter(method => !sowData.currentPaymentMethods.includes(method)).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`${styles.paymentMethodButtonCompact} ${
                      sowData.newPaymentMethods.includes(method) ? styles.paymentMethodButtonActive : ''
                    }`}
                    onClick={() => toggleNewPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <div className={styles.otherInputField}>
                <label className={styles.otherInputLabel}>Other:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={sowData.newPaymentMethodsOther}
                  onChange={(e) => handleInputChange('newPaymentMethodsOther', e.target.value)}
                  placeholder="Enter other new payment methods"
                />
              </div>
            </div>

            {/* New PSPs */}
            <div className={styles.paymentMethodsSection}>
              <p className={styles.sectionSubtitle}>
                Which PSPs do you want to <span className={styles.highlightedText}>add</span>?
              </p>
              <div className={styles.paymentMethodsGridCompact}>
                {PSPS.filter(psp => !sowData.currentPSPs.includes(psp)).map((psp) => (
                  <button
                    key={psp}
                    type="button"
                    className={`${styles.paymentMethodButtonCompact} ${
                      sowData.newPSPs.includes(psp) ? styles.paymentMethodButtonActive : ''
                    }`}
                    onClick={() => toggleNewPSP(psp)}
                  >
                    {psp}
                  </button>
                ))}
              </div>
              <div className={styles.otherInputField}>
                <label className={styles.otherInputLabel}>Other:</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={sowData.newPSPsOther}
                  onChange={(e) => handleInputChange('newPSPsOther', e.target.value)}
                  placeholder="Enter other new PSPs"
                />
              </div>
            </div>
          </div>
        );

      case '3ds':
        return (
          <div className={styles.threeDSContainer}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>Do you currently have a 3DS strategy?</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="has3DS"
                    checked={sowData.has3DSStrategy === 'yes'}
                    onChange={() => handleInputChange('has3DSStrategy', 'yes')}
                    className={styles.radio}
                  />
                  <span>Yes</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="has3DS"
                    checked={sowData.has3DSStrategy === 'no'}
                    onChange={() => handleInputChange('has3DSStrategy', 'no')}
                    className={styles.radio}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {sowData.has3DSStrategy === 'yes' && (
              <div className={styles.strategyOptions}>
                <label className={styles.radioLabel}>What is your current strategy?</label>
                <div className={styles.radioOptionsVertical}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="threeDSStrategy"
                      checked={sowData.threeDSStrategy === 'mandated'}
                      onChange={() => handleInputChange('threeDSStrategy', 'mandated')}
                      className={styles.radio}
                    />
                    <span>Mandated 3DS</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="threeDSStrategy"
                      checked={sowData.threeDSStrategy === 'adaptive'}
                      onChange={() => handleInputChange('threeDSStrategy', 'adaptive')}
                      className={styles.radio}
                    />
                    <span>Adaptive 3DS</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="threeDSStrategy"
                      checked={sowData.threeDSStrategy === 'other'}
                      onChange={() => handleInputChange('threeDSStrategy', 'other')}
                      className={styles.radio}
                    />
                    <span>Other</span>
                  </label>
                </div>

                {sowData.threeDSStrategy === 'other' && (
                  <div className={styles.otherInputField}>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={sowData.threeDSStrategyOther}
                      onChange={(e) => handleInputChange('threeDSStrategyOther', e.target.value)}
                      placeholder="Please specify your 3DS strategy"
                    />
                  </div>
                )}
              </div>
            )}
            {renderNotesField('threeDSNotes')}
          </div>
        );

      case 'channels':
        return (
          <div className={styles.channelsContainer}>
            {/* Channels Section */}
            <div className={styles.channelsSection}>
              <h3 className={styles.sectionTitle}>Which channels will we need to support?</h3>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.channels.includes('Online / Web')}
                    onChange={() => toggleChannel('Online / Web')}
                    className={styles.checkbox}
                  />
                  <span>Online / Web</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.channels.includes('Mobile - Web View')}
                    onChange={() => toggleChannel('Mobile - Web View')}
                    className={styles.checkbox}
                  />
                  <span>Mobile - Web View</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.channels.includes('Mobile - iOS/Android Apps')}
                    onChange={() => toggleChannel('Mobile - iOS/Android Apps')}
                    className={styles.checkbox}
                  />
                  <span>Mobile - iOS/Android Apps</span>
                </label>
              </div>
            </div>

            {/* Transaction Flows Section */}
            <div className={styles.transactionFlowsSection}>
              <h3 className={styles.sectionTitle}>Transaction flows:</h3>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.transactionFlows.includes('CIT (Customer Initiated Transaction)')}
                    onChange={() => toggleTransactionFlow('CIT (Customer Initiated Transaction)')}
                    className={styles.checkbox}
                  />
                  <span>CIT (Customer Initiated Transaction)</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.transactionFlows.includes('CIT with vaulting for new customers')}
                    onChange={() => toggleTransactionFlow('CIT with vaulting for new customers')}
                    className={styles.checkbox}
                  />
                  <span>CIT with vaulting for new customers</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.transactionFlows.includes('CIT with vaulted payment methods for returning customers')}
                    onChange={() => toggleTransactionFlow('CIT with vaulted payment methods for returning customers')}
                    className={styles.checkbox}
                  />
                  <span>CIT with vaulted payment methods for returning customers</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sowData.transactionFlows.includes('MIT (Merchant Initiated Transaction) for recurring payments')}
                    onChange={() => toggleTransactionFlow('MIT (Merchant Initiated Transaction) for recurring payments')}
                    className={styles.checkbox}
                  />
                  <span>MIT (Merchant Initiated Transaction) for recurring payments</span>
                </label>
              </div>
            </div>

            {/* Recurring Payments Section */}
            <div className={styles.recurringPaymentsSection}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>Are you doing recurring payments?</label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="recurringPayments"
                      checked={sowData.recurringPayments === 'yes'}
                      onChange={() => handleInputChange('recurringPayments', 'yes')}
                      className={styles.radio}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="recurringPayments"
                      checked={sowData.recurringPayments === 'no'}
                      onChange={() => handleInputChange('recurringPayments', 'no')}
                      className={styles.radio}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {sowData.recurringPayments === 'yes' && (
                <div className={styles.subscriptionPlatformField}>
                  <label className={styles.radioLabel}>Do you currently have a subscriptions management platform?</label>
                  <div className={styles.radioOptionsVertical}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="hasSubscriptionPlatform"
                        checked={sowData.subscriptionPlatform !== '' && sowData.subscriptionPlatform !== 'no'}
                        onChange={() => handleInputChange('subscriptionPlatform', 'yes')}
                        className={styles.radio}
                      />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="hasSubscriptionPlatform"
                        checked={sowData.subscriptionPlatform === 'no'}
                        onChange={() => handleInputChange('subscriptionPlatform', 'no')}
                        className={styles.radio}
                      />
                      <span>No</span>
                    </label>
                  </div>

                  {sowData.subscriptionPlatform !== 'no' && sowData.subscriptionPlatform !== '' && (
                    <div className={styles.otherInputField}>
                      <input
                        type="text"
                        className={styles.textInput}
                        value={sowData.subscriptionPlatform === 'yes' ? '' : sowData.subscriptionPlatform}
                        onChange={(e) => handleInputChange('subscriptionPlatform', e.target.value)}
                        placeholder="Please specify your subscription platform"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            {renderNotesField('channelsNotes')}
          </div>
        );

      case 'token':
        return (
          <div className={styles.tokenContainer}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>Is token migration required?</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tokenRequired"
                    checked={sowData.tokenMigrationRequired === 'yes'}
                    onChange={() => handleInputChange('tokenMigrationRequired', 'yes')}
                    className={styles.radio}
                  />
                  <span>Yes</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tokenRequired"
                    checked={sowData.tokenMigrationRequired === 'no'}
                    onChange={() => handleInputChange('tokenMigrationRequired', 'no')}
                    className={styles.radio}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {sowData.tokenMigrationRequired === 'yes' && (
              <div className={styles.tokenEntriesContainer}>
                {sowData.tokenMigrationEntries.map((entry, index) => (
                  <div key={entry.id} className={styles.tokenEntry}>
                    <div className={styles.tokenEntryHeader}>
                      <h4 className={styles.tokenEntryTitle}>PSP #{index + 1}</h4>
                      {sowData.tokenMigrationEntries.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeTokenEntry(entry.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className={styles.tokenEntryFields}>
                      <div className={styles.tokenFieldGroup}>
                        <label className={styles.fieldLabel}>Number of Tokens Migrated:</label>
                        <input
                          type="number"
                          className={styles.tokenNumberInput}
                          value={entry.tokenCount}
                          onChange={(e) => handleTokenEntryChange(entry.id, 'tokenCount', e.target.value)}
                          placeholder="e.g., 1000"
                          min="0"
                        />
                      </div>

                      <div className={styles.tokenFieldGroup}>
                        <label className={styles.fieldLabel}>Which PSP:</label>
                        <input
                          type="text"
                          className={styles.textInput}
                          value={entry.psp}
                          onChange={(e) => handleTokenEntryChange(entry.id, 'psp', e.target.value)}
                          placeholder="Enter PSP name (e.g., Stripe, Adyen)"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" className={styles.addButton} onClick={addTokenEntry}>
                  + Add More PSPs
                </button>
              </div>
            )}
            {renderNotesField('tokenMigrationNotes')}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.intakeForm}>
        <div className={styles.header}>
          <div className={styles.headerTitleSection}>
            <h1>{gandalfQuestionnaire ? gandalfQuestionnaire.title : schema?.title || 'SOW Builder'}</h1>
            <p>{gandalfQuestionnaire ? gandalfQuestionnaire.description : schema?.description || 'Create your Statement of Work'}</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.roleSwitchButton} onClick={handleRoleChange} title="Change Role">
              {userRole === 'merchant' ? '🏢' : userRole === 'bdr-bdm' ? '💼' : '⚙️'} Switch Role
            </button>
            <label className={styles.importButton}>
              📂 Import Questionnaire
              <input
                type="file"
                accept=".json"
                onChange={handleSchemaImport}
                style={{ display: 'none' }}
              />
            </label>
            {(schema || gandalfQuestionnaire) && (
              <button className={styles.exportSchemaButton} onClick={handleExportSchema}>
                💾 Export Schema
              </button>
            )}
          </div>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressSteps}>
            {userRole === 'merchant' && (
              <div
                className={`${styles.progressStep} ${0 <= currentStep ? styles.progressStepActive : ''}`}
              >
                <div className={styles.progressStepCircle}>{0 < currentStep ? '✓' : 1}</div>
                <span className={styles.progressStepLabel}>Merchant Name</span>
              </div>
            )}
            {gandalfQuestionnaire ? (
              gandalfQuestionnaire.questions
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((q, idx) => {
                  const displayIdx = userRole === 'merchant' ? idx + 1 : idx;
                  const isClickable = userRole === 'se';
                  return (
                    <div
                      key={q.id}
                      className={`${styles.progressStep} ${
                        displayIdx <= currentStep ? styles.progressStepActive : ''
                      } ${isClickable ? styles.progressStepClickable : ''}`}
                      onClick={() => isClickable && setCurrentStep(displayIdx)}
                      title={isClickable ? `Jump to Q${displayIdx + 1}` : undefined}
                    >
                      <div className={styles.progressStepCircle}>
                        {displayIdx < currentStep ? '✓' : displayIdx + 1}
                      </div>
                      <span className={styles.progressStepLabel}>Q{displayIdx + 1}</span>
                    </div>
                  );
                })
            ) : schema ? (
              schema.steps.map((step, idx) => {
                const displayIdx = userRole === 'merchant' ? idx + 1 : idx;
                const isClickable = userRole === 'se';
                return (
                  <div
                    key={step.id}
                    className={`${styles.progressStep} ${
                      displayIdx <= currentStep ? styles.progressStepActive : ''
                    } ${isClickable ? styles.progressStepClickable : ''}`}
                    onClick={() => isClickable && setCurrentStep(displayIdx)}
                    title={isClickable ? `Jump to ${step.label}` : undefined}
                  >
                    <div className={styles.progressStepCircle}>
                      {displayIdx < currentStep ? '✓' : displayIdx + 1}
                    </div>
                    <span className={styles.progressStepLabel}>{step.label}</span>
                  </div>
                );
              })
            ) : (
              CATEGORIES.map((cat, idx) => {
                const displayIdx = userRole === 'merchant' ? idx + 1 : idx;
                const isClickable = userRole === 'se';
                return (
                  <div
                    key={cat.id}
                    className={`${styles.progressStep} ${
                      displayIdx <= currentStep ? styles.progressStepActive : ''
                    } ${isClickable ? styles.progressStepClickable : ''}`}
                    onClick={() => isClickable && setCurrentStep(displayIdx)}
                    title={isClickable ? `Jump to ${cat.label}` : undefined}
                  >
                    <div className={styles.progressStepCircle}>
                      {displayIdx < currentStep ? '✓' : displayIdx + 1}
                    </div>
                    <span className={styles.progressStepLabel}>{cat.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.formContent}>
          <div className={styles.stepIndicator}>
            Step {currentStep + 1} of {totalSteps}
          </div>
          <h2>
            {gandalfQuestionnaire && currentCategory && 'text' in currentCategory
              ? (currentCategory as GandalfQuestion).text
              : currentCategory && 'label' in currentCategory
              ? currentCategory.label
              : 'Question'}
          </h2>
          {renderFormField()}
        </div>

        <div className={styles.navigationButtons}>
          <button
            className={styles.buttonSecondary}
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>
          <button className={styles.buttonPrimary} onClick={handleNext}>
            {isLastStep ? 'Generate SOW' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OutputView({
  sowData,
  setSOWData,
  onBackToEdit,
  versions,
  currentVersionId,
  userRole,
  onVersionsUpdate,
}: {
  sowData: SOWData;
  setSOWData: (data: SOWData) => void;
  onBackToEdit: () => void;
  versions: SOWVersion[];
  currentVersionId: string;
  userRole: UserRole;
  onVersionsUpdate: (versions: SOWVersion[]) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState(userRole === 'merchant' ? 'merchantSOW' : 'summary');
  const [selectedVersionId, setSelectedVersionId] = useState(currentVersionId);
  const [merchantName, setMerchantName] = useState('');
  const [bdmName, setBdmName] = useState('');
  const [seName, setSeName] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'json'>('pdf');
  const [exportDocs, setExportDocs] = useState<{ sow: boolean; guide: boolean; sandboxIntro: boolean }>({ sow: true, guide: false, sandboxIntro: false });
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editingGuideSection, setEditingGuideSection] = useState<string | null>(null);
  const [editGuideSectionContent, setEditGuideSectionContent] = useState('');
  const [merchantPreview, setMerchantPreview] = useState(false);

  // Effective role — SEs can toggle into merchant preview mode
  const effectiveRole = (userRole === 'se' && merchantPreview) ? 'merchant' : userRole;

  const currentVersion = versions.find(v => v.id === selectedVersionId) || versions[versions.length - 1];
  const seReviewed = currentVersion?.seReviewed || false;

  // Use the selected version's data, or fall back to current sowData
  const displayData = currentVersion?.data || sowData;

  const handleSeReviewToggle = () => {
    const updatedVersions = versions.map(v =>
      v.id === selectedVersionId ? { ...v, seReviewed: !v.seReviewed } : v
    );
    onVersionsUpdate(updatedVersions);
  };

  const getRoleLabel = (role: UserRole) => {
    if (role === 'merchant') return '🏢 Merchant';
    if (role === 'bdr-bdm') return '💼 BDR/BDM';
    if (role === 'se') return '⚙️ SE';
    return 'Unknown';
  };

  const formatVersionDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleNotesChange = (field: keyof SOWData, value: string) => {
    setSOWData({
      ...sowData,
      [field]: value,
    });
  };

  const handleExportJSON = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const versionString = currentVersion?.version || 'v1.0';
    const fileName = merchantName
      ? `SOW_${merchantName.replace(/\s+/g, '-')}_${todayDate}_${versionString}.json`
      : `SOW_${todayDate}_${versionString}.json`;

    const exportData = {
      merchantName: currentVersion?.merchantName || merchantName || 'Unknown',
      businessDevelopmentManager: bdmName || '',
      solutionsEngineer: seName || '',
      version: versionString,
      exportDate: todayDate,
      createdBy: currentVersion?.createdBy,
      seReviewed: currentVersion?.seReviewed,
      seApproved: currentVersion?.seApproved,
      sharedInMeetingDate: currentVersion?.sharedInMeetingDate,
      emailedTo: currentVersion?.emailedTo,
      emailedDate: currentVersion?.emailedDate,
      data: displayData,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
    setMerchantName('');
    setBdmName('');
    setSeName('');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Header with brand color
    doc.setFillColor(255, 124, 79); // #FF7C4F - coral
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Statement of Work', margin, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const merchantText = merchantName || 'Merchant';
    doc.text(merchantText, margin, 28);

    // Date and version
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${today}`, pageWidth - margin - 60, 20);
    doc.text(`Version: ${currentVersion?.version || 'v1.0'}`, pageWidth - margin - 60, 28);

    yPos = 45;
    doc.setTextColor(74, 44, 31); // Dark brown for body text

    // BDM and SE Names
    if (bdmName || seName) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(74, 44, 31);

      if (bdmName) {
        doc.setFont('helvetica', 'bold');
        doc.text('Business Development Manager: ', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(bdmName, margin + 70, yPos);
        yPos += 6;
      }

      if (seName) {
        doc.setFont('helvetica', 'bold');
        doc.text('Solutions Engineer: ', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(seName, margin + 47, yPos);
        yPos += 6;
      }

      yPos += 6; // Extra spacing after names
    }

    // Status Tracking Section (only meeting/email info, no SE review/approval)
    if (currentVersion?.sharedInMeetingDate || currentVersion?.emailedTo) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 124, 79);
      doc.text('STATUS', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(74, 44, 31);

      if (currentVersion?.sharedInMeetingDate) {
        const meetingDate = new Date(currentVersion.sharedInMeetingDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        yPos = addText(`Shared with merchant in meeting on: ${meetingDate}`, margin, yPos, contentWidth);
        yPos += 2;
      }
      if (currentVersion?.emailedTo && currentVersion?.emailedDate) {
        const emailDate = new Date(currentVersion.emailedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        yPos = addText(`Emailed SOW to: ${currentVersion.emailedTo} on ${emailDate}`, margin, yPos, contentWidth);
        yPos += 2;
      }

      yPos += 8; // Extra spacing after status section
    }

    // Go Live Date Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('GO LIVE DATE', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    yPos = addText(formatDate(displayData.goLiveDate), margin, yPos, contentWidth);
    yPos += 8;

    // Check if we need a new page
    const checkNewPage = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };

    // Payment Methods Section
    yPos = checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('PAYMENT METHODS', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const paymentMethodsText = formatPaymentMethods().replace(/• /g, '  • ');
    yPos = addText(paymentMethodsText, margin, yPos, contentWidth);
    yPos += 6;

    // Add clickable documentation link
    doc.setFontSize(9);
    doc.setTextColor(41, 76, 70);
    doc.textWithLink('View Payment Methods Documentation', margin, yPos, {
      url: 'https://primer.io/docs/connections/payment-methods/overview'
    });
    yPos += 8;

    // PSPs Section
    yPos = checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('PSPs', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const pspsText = formatPSPs().replace(/• /g, '  • ');
    yPos = addText(pspsText, margin, yPos, contentWidth);
    yPos += 6;

    // Add clickable documentation link
    doc.setFontSize(9);
    doc.setTextColor(41, 76, 70);
    doc.textWithLink('View PSP Documentation', margin, yPos, {
      url: 'https://primer.io/docs/connections/payment-methods/overview'
    });
    yPos += 8;

    // 3DS Strategies Section
    yPos = checkNewPage(25);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('3DS STRATEGIES', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    yPos = addText(format3DSStrategy(), margin, yPos, contentWidth);
    yPos += 6;

    // Add clickable documentation link
    doc.setFontSize(9);
    doc.setTextColor(41, 76, 70);
    doc.textWithLink('View 3DS Documentation', margin, yPos, {
      url: 'https://primer.io/docs/payment-services/3d-secure/overview'
    });
    yPos += 8;

    // Purchase Channels & Flows Section
    yPos = checkNewPage(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('PURCHASE CHANNELS & FLOWS', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const channelsText = formatChannelsAndFlows().replace(/• /g, '  • ');
    yPos = addText(channelsText, margin, yPos, contentWidth);
    yPos += 6;

    // Add clickable documentation link
    doc.setFontSize(9);
    doc.setTextColor(41, 76, 70);
    doc.textWithLink('View Web Components Documentation', margin, yPos, {
      url: 'https://web-components.primer.io/'
    });
    yPos += 8;

    // Token Migration Section
    yPos = checkNewPage(25);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('TOKEN MIGRATION', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const tokenText = formatTokenMigration().replace(/• /g, '  • ');
    yPos = addText(tokenText, margin, yPos, contentWidth);

    // Footer removed as per user request

    // Save the PDF
    const todayDate = new Date().toISOString().split('T')[0];
    const versionString = currentVersion?.version || 'v1.0';
    const fileName = merchantName
      ? `SOW_${merchantName.replace(/\s+/g, '-')}_${todayDate}_${versionString}.pdf`
      : `SOW_${todayDate}_${versionString}.pdf`;

    doc.save(fileName);
    setShowExportDialog(false);
    setMerchantName('');
    setBdmName('');
    setSeName('');
  };

  // Strip emoji and unsupported Unicode from text before passing to jsPDF (Helvetica only covers Latin-1)
  const sanitizeForPDF = (text: string): string =>
    text
      .replace(/💡/g, 'Note:')
      .replace(/▶/g, '>')
      .replace(/🔗/g, '')
      .replace(/☐/g, '[ ]')
      .replace(/☑/g, '[x]')
      .replace(/✓/g, '[x]')
      .replace(/•/g, '-')
      // Remove anything outside Latin-1 + common punctuation that Helvetica can't render
      .replace(/[^\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022]/g, '');

  const handleExportGuidePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to check and create new page if needed
    const checkNewPage = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };

    // Header with brand color
    doc.setFillColor(255, 124, 79); // #FF7C4F - coral
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Onboarding Guide', margin, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const merchantText = currentVersion?.merchantName || merchantName || 'Merchant';
    doc.text(merchantText, margin, 28);

    // Date
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${today}`, pageWidth - margin - 60, 20);

    yPos = 45;
    doc.setTextColor(74, 44, 31); // Dark brown for body text

    // Process each visible guide section
    const guideCtxForPDF: GuideCtx = {
      merchantName: currentVersion?.merchantName || merchantName || 'Merchant',
      seContact: currentVersion?.seContact || '',
      seEmail: currentVersion?.seEmail || '',
    };

    GUIDE_SECTIONS.filter(s => {
      const custom = currentVersion?.guideCustomizations?.[s.id];
      if (custom?.isVisible !== undefined) return custom.isVisible;
      return s.showByDefault(displayData);
    }).forEach((section) => {
      yPos = checkNewPage(25);

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 124, 79);
      doc.text(section.title, margin, yPos);
      yPos += 8;

      // Section content
      const custom = currentVersion?.guideCustomizations?.[section.id];
      const rawContent = custom?.customContent !== undefined ? custom.customContent : section.defaultContent(displayData, guideCtxForPDF);
      const content = sanitizeForPDF(rawContent);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(74, 44, 31);
      yPos = addText(content, margin, yPos, contentWidth);
      yPos += 8;
    });

    // Save the PDF
    const todayDate = new Date().toISOString().split('T')[0];
    const mName = (currentVersion?.merchantName || merchantName || 'Merchant').replace(/\s+/g, '-');
    const fileName = `OnboardingGuide_${mName}_${todayDate}.pdf`;

    doc.save(fileName);
  };

  const handleExportSandboxIntroPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to check and create new page if needed
    const checkNewPage = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return yPos;
    };

    // Header with brand color
    doc.setFillColor(255, 124, 79); // #FF7C4F - coral
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Sandbox Introduction', margin, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const merchantText = currentVersion?.merchantName || merchantName || 'Merchant';
    doc.text(merchantText, margin, 28);

    // Date
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${today}`, pageWidth - margin - 60, 20);

    yPos = 45;
    doc.setTextColor(74, 44, 31); // Dark brown for body text

    // Process each visible sandbox intro section
    SANDBOX_INTRO_SECTIONS.filter(s => {
      const custom = currentVersion?.guideCustomizations?.[s.id];
      if (custom?.isVisible !== undefined) return custom.isVisible;
      return true;
    }).forEach((section) => {
      yPos = checkNewPage(25);

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 124, 79);
      doc.text(section.title, margin, yPos);
      yPos += 8;

      // Section content - parse for special formatting
      const custom = currentVersion?.guideCustomizations?.[section.id];
      const content = custom?.customContent !== undefined ? custom.customContent : section.defaultContent(currentVersion?.merchantName || 'Merchant');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const lines = content.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();

        if (trimmed === '') {
          yPos += 3;
        } else if (trimmed.startsWith('▶ Video tutorial:')) {
          const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 124, 79);
            doc.textWithLink('> Video tutorial', margin, yPos, { url: urlMatch[1] });
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(74, 44, 31);
            yPos += 6;
          }
        } else if (trimmed.startsWith('🔗')) {
          const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            const rawLabel = trimmed.replace(/🔗\s*/, '').replace(urlMatch[1], '').replace(/:\s*$/, '').trim();
            const label = sanitizeForPDF(rawLabel) || urlMatch[1];
            doc.setTextColor(41, 68, 200);
            doc.textWithLink(label, margin, yPos, { url: urlMatch[1] });
            doc.setTextColor(74, 44, 31);
            yPos += 6;
          }
        } else if (/^https?:\/\//.test(trimmed)) {
          // Bare URL
          doc.setTextColor(41, 68, 200);
          doc.textWithLink(trimmed, margin, yPos, { url: trimmed });
          doc.setTextColor(74, 44, 31);
          yPos += 6;
        } else {
          yPos = addText(sanitizeForPDF(line), margin, yPos, contentWidth, 10);
        }
      });

      yPos += 4;
    });

    // Save the PDF
    const todayDate = new Date().toISOString().split('T')[0];
    const mName = (currentVersion?.merchantName || merchantName || 'Merchant').replace(/\s+/g, '-');
    const fileName = `SandboxIntro_${mName}_${todayDate}.pdf`;

    doc.save(fileName);
  };

  const handleExport = () => {
    if (exportType === 'json') {
      handleExportJSON();
      return;
    }
    // PDF: generate each selected doc
    if (exportDocs.sow) handleExportPDF();
    if (exportDocs.guide) handleExportGuidePDF();
    if (exportDocs.sandboxIntro) handleExportSandboxIntroPDF();
    if (!exportDocs.sow && !exportDocs.guide && !exportDocs.sandboxIntro) handleExportPDF();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date selected';
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (displayData.goLiveDateNotes) {
      return `${formattedDate}\n\nAdditional Notes:\n${displayData.goLiveDateNotes}`;
    }
    return formattedDate;
  };

  const formatPaymentMethods = () => {
    const parts = [];

    // Current Payment Methods
    if (displayData.currentPaymentMethods.length > 0 || displayData.currentPaymentMethodsOther) {
      parts.push('Currently Offering:');
      const current = [...displayData.currentPaymentMethods];
      if (displayData.currentPaymentMethodsOther) {
        current.push(`Other: ${displayData.currentPaymentMethodsOther}`);
      }
      parts.push(current.map(method => `  • ${method}`).join('\n'));
    }

    // New Payment Methods to Add
    if (displayData.newPaymentMethods.length > 0 || displayData.newPaymentMethodsOther) {
      if (parts.length > 0) parts.push('');
      parts.push('Want to Add:');
      const newMethods = [...displayData.newPaymentMethods];
      if (displayData.newPaymentMethodsOther) {
        newMethods.push(`Other: ${displayData.newPaymentMethodsOther}`);
      }
      parts.push(newMethods.map(method => `  • ${method}`).join('\n'));
    }

    // Fall back to legacy fields if new fields are empty
    if (parts.length === 0) {
      const methods = [...displayData.paymentMethods];
      if (displayData.paymentMethodsOther) {
        methods.push(`Other: ${displayData.paymentMethodsOther}`);
      }
      if (methods.length > 0) {
        parts.push(methods.map(method => `• ${method}`).join('\n'));
      } else {
        return 'No payment methods selected';
      }
    }

    if (displayData.paymentMethodsNotes) {
      parts.push('');
      parts.push('Additional Notes:');
      parts.push(displayData.paymentMethodsNotes);
    }

    return parts.join('\n');
  };

  const formatPSPs = () => {
    const parts = [];

    // Current PSPs
    if (displayData.currentPSPs.length > 0 || displayData.currentPSPsOther) {
      parts.push('Currently Offering:');
      const current = [...displayData.currentPSPs];
      if (displayData.currentPSPsOther) {
        current.push(`Other: ${displayData.currentPSPsOther}`);
      }
      parts.push(current.map(psp => `  • ${psp}`).join('\n'));
    }

    // New PSPs to Add
    if (displayData.newPSPs.length > 0 || displayData.newPSPsOther) {
      if (parts.length > 0) parts.push('');
      parts.push('Want to Add:');
      const newPSPs = [...displayData.newPSPs];
      if (displayData.newPSPsOther) {
        newPSPs.push(`Other: ${displayData.newPSPsOther}`);
      }
      parts.push(newPSPs.map(psp => `  • ${psp}`).join('\n'));
    }

    // Fall back to legacy fields if new fields are empty
    if (parts.length === 0) {
      const psps = [...displayData.psps];
      if (displayData.pspsOther) {
        psps.push(`Other: ${displayData.pspsOther}`);
      }
      if (psps.length > 0) {
        parts.push(psps.map(psp => `• ${psp}`).join('\n'));
      } else {
        return 'No PSPs selected';
      }
    }

    if (displayData.pspsNotes) {
      parts.push('');
      parts.push('Additional Notes:');
      parts.push(displayData.pspsNotes);
    }

    return parts.join('\n');
  };

  const format3DSStrategy = () => {
    let result = '';
    if (displayData.has3DSStrategy === 'no') {
      result = 'No 3DS strategy currently';
    } else if (displayData.has3DSStrategy === 'yes') {
      if (displayData.threeDSStrategy === 'mandated') {
        result = 'Yes - Mandated 3DS';
      } else if (displayData.threeDSStrategy === 'adaptive') {
        result = 'Yes - Adaptive 3DS';
      } else if (displayData.threeDSStrategy === 'other') {
        result = `Yes - Other: ${displayData.threeDSStrategyOther || 'Not specified'}`;
      }
    } else {
      result = 'No information provided';
    }
    if (displayData.threeDSNotes) {
      result += `\n\nAdditional Notes:\n${displayData.threeDSNotes}`;
    }

    return result;
  };

  const formatChannelsAndFlows = () => {
    const parts = [];

    // Channels
    parts.push('Channels:');
    if (displayData.channels.length > 0) {
      parts.push(displayData.channels.map(channel => `  • ${channel}`).join('\n'));
    } else {
      parts.push('  None selected');
    }

    // Transaction Flows
    parts.push('\nTransaction Flows:');
    if (displayData.transactionFlows.length > 0) {
      parts.push(displayData.transactionFlows.map(flow => `  • ${flow}`).join('\n'));
    } else {
      parts.push('  None selected');
    }

    // Recurring Payments
    parts.push('\nRecurring Payments:');
    if (displayData.recurringPayments === 'yes') {
      parts.push('  • Yes');
      if (displayData.subscriptionPlatform && displayData.subscriptionPlatform !== 'no') {
        parts.push(`  • Subscription Platform: ${displayData.subscriptionPlatform}`);
      } else if (displayData.subscriptionPlatform === 'no') {
        parts.push('  • Subscription Platform: No');
      }
    } else if (displayData.recurringPayments === 'no') {
      parts.push('  • No');
    } else {
      parts.push('  Not specified');
    }

    if (displayData.channelsNotes) {
      parts.push('\nAdditional Notes:');
      parts.push(displayData.channelsNotes);
    }

    return parts.join('\n');
  };

  const formatTokenMigration = () => {
    let result = '';
    if (displayData.tokenMigrationRequired === 'no') {
      result = 'No token migration required';
    } else if (displayData.tokenMigrationRequired === 'yes') {
      if (displayData.tokenMigrationEntries.length === 0 || !displayData.tokenMigrationEntries[0].psp) {
        result = 'Token migration required (no details provided)';
      } else {
        result = displayData.tokenMigrationEntries.map((entry, index) => {
          const tokenCount = entry.tokenCount || '0';
          const psp = entry.psp || 'Not specified';
          return `• PSP: ${psp}\n  Tokens: ${tokenCount}`;
        }).join('\n\n');
      }
    } else {
      result = 'No information provided';
    }
    if (displayData.tokenMigrationNotes) {
      result += `\n\nAdditional Notes:\n${displayData.tokenMigrationNotes}`;
    }
    return result;
  };

  const formatSummary = () => {
    const sections = [];

    // Status Tracking (if any tracking info exists)
    if (currentVersion?.seReviewed || currentVersion?.seApproved || currentVersion?.sharedInMeetingDate || currentVersion?.emailedTo) {
      sections.push('STATUS');
      sections.push('━━━━━━━━━━━━━━━━━━━━');

      if (currentVersion?.seReviewed) {
        sections.push('✓ SE Reviewed');
      }
      if (currentVersion?.seApproved) {
        sections.push('✓ SE Approved');
      }
      if (currentVersion?.sharedInMeetingDate) {
        const meetingDate = new Date(currentVersion.sharedInMeetingDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        sections.push(`📅 Shared with merchant in meeting on: ${meetingDate}`);
      }
      if (currentVersion?.emailedTo && currentVersion?.emailedDate) {
        const emailDate = new Date(currentVersion.emailedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        sections.push(`📧 Emailed SOW to: ${currentVersion.emailedTo} on ${emailDate}`);
      }

      sections.push('');
      sections.push('');
    }

    // Go Live Date
    sections.push('GO LIVE DATE');
    sections.push('━━━━━━━━━━━━━━━━━━━━');
    sections.push(formatDate(displayData.goLiveDate));
    sections.push('');
    sections.push('');

    // Payment Methods
    sections.push('PAYMENT METHODS');
    sections.push('━━━━━━━━━━━━━━━━━━━━');
    sections.push(formatPaymentMethods());
    sections.push('');
    sections.push('');

    // PSPs
    sections.push('PSPs');
    sections.push('━━━━━━━━━━━━━━━━━━━━');
    sections.push(formatPSPs());
    sections.push('');
    sections.push('');

    // 3DS Strategies
    sections.push('3DS STRATEGIES');
    sections.push('━━━━━━━━━━━━━━━━━━━━');
    sections.push(format3DSStrategy());
    sections.push('');
    sections.push('');

    // Purchase Channels & Flows
    sections.push('PURCHASE CHANNELS & FLOWS');
    sections.push('━━━━━━━━━━━━━━━━━━━━');
    sections.push(formatChannelsAndFlows());
    sections.push('');
    sections.push('');

    // Token Migration
    sections.push('TOKEN MIGRATION');
    sections.push('━━━━━━━━━━━━━━━━━━━━');
    sections.push(formatTokenMigration());

    return sections.join('\n');
  };

  // ─── Guide helpers ────────────────────────────────────────────────────────
  const guideCtx: GuideCtx = {
    merchantName: currentVersion?.merchantName || '',
    seContact: currentVersion?.seContact || '',
    seEmail: currentVersion?.seEmail || '',
  };

  const getGuideContent = (section: GuideSectionDef): string => {
    const custom = currentVersion?.guideCustomizations?.[section.id];
    if (custom?.customContent !== undefined) return custom.customContent;
    return section.defaultContent(displayData, guideCtx);
  };

  const isGuideSectionVisible = (section: GuideSectionDef): boolean => {
    const custom = currentVersion?.guideCustomizations?.[section.id];
    if (custom?.isVisible !== undefined) return custom.isVisible;
    return section.showByDefault(displayData);
  };

  const getSandboxIntroContent = (section: SandboxIntroSectionDef): string => {
    const custom = currentVersion?.guideCustomizations?.[section.id];
    if (custom?.customContent !== undefined) return custom.customContent;
    return section.defaultContent(currentVersion?.merchantName || 'your company');
  };

  const isSandboxIntroSectionVisible = (section: SandboxIntroSectionDef): boolean => {
    const custom = currentVersion?.guideCustomizations?.[section.id];
    if (custom?.isVisible !== undefined) return custom.isVisible;
    return true;
  };

  const updateGuideCustomization = (sectionId: string, updates: Partial<GuideSectionCustomization>) => {
    const updatedVersions = versions.map(v =>
      v.id === selectedVersionId
        ? {
            ...v,
            guideCustomizations: {
              ...v.guideCustomizations,
              [sectionId]: {
                ...v.guideCustomizations?.[sectionId],
                ...updates,
              },
            },
          }
        : v
    );
    onVersionsUpdate(updatedVersions);
  };

  const updateSEContact = (field: 'seContact' | 'seEmail', value: string) => {
    const updatedVersions = versions.map(v =>
      v.id === selectedVersionId ? { ...v, [field]: value } : v
    );
    onVersionsUpdate(updatedVersions);
  };

  // ─── Sandbox Content Renderer with clickable links ────────────────────────────
  const renderSandboxContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed === '') {
        // Empty line
        result.push(<div key={`spacer-${idx}`} className={styles.sandboxContentSpacer} />);
      } else if (trimmed.startsWith('▶ Video tutorial:')) {
        // Extract URL and render as orange pill
        const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          result.push(
            <div key={`video-${idx}`} className={styles.sandboxVideoLink}>
              <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer">
                ▶ Video tutorial
              </a>
            </div>
          );
        } else {
          result.push(<div key={`video-${idx}`} className={styles.sandboxContentLine}>{line}</div>);
        }
      } else if (trimmed.startsWith('🔗')) {
        // Extract URL and render as blue link
        const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          const label = trimmed.replace(/🔗\s*/, '').replace(urlMatch[1], '').trim();
          result.push(
            <div key={`doc-${idx}`} className={styles.sandboxDocLink}>
              <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer">
                {label || urlMatch[1]}
              </a>
            </div>
          );
        } else {
          result.push(<div key={`doc-${idx}`} className={styles.sandboxContentLine}>{line}</div>);
        }
      } else if (/^https?:\/\//.test(trimmed)) {
        // Bare URL line
        result.push(
          <div key={`bare-url-${idx}`}>
            <a href={trimmed} target="_blank" rel="noopener noreferrer" className={styles.sandboxInlineLink}>
              {trimmed}
            </a>
          </div>
        );
      } else if (/https?:\/\//.test(line)) {
        // Line with embedded URLs
        const parts: React.ReactNode[] = [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let lastIndex = 0;
        let match;

        while ((match = urlRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
          }
          parts.push(
            <a
              key={`embedded-${idx}-${match.index}`}
              href={match[0]}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sandboxInlineLink}
            >
              {match[0]}
            </a>
          );
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }

        result.push(
          <div key={`embedded-${idx}`} className={styles.sandboxContentLine}>
            {parts}
          </div>
        );
      } else {
        // Regular line
        result.push(<div key={`line-${idx}`} className={styles.sandboxContentLine}>{line}</div>);
      }
    });

    return result;
  };

  const categoryContent: Record<string, any> = effectiveRole === 'merchant'
    ? {
        merchantSOW: {
          title: 'SOW Summary',
          content: null,
          docLink: null,
          notesField: null,
        },
        merchantGuide: {
          title: 'Onboarding Guide',
          content: null,
          docLink: null,
          notesField: null,
        },
        sandboxIntro: {
          title: 'Sandbox Intro',
          content: null,
          docLink: null,
          notesField: null,
        },
      }
    : {
        summary: {
          title: 'Summary',
          content: formatSummary(),
          docLink: null,
          notesField: null,
        },
        onboardingGuide: {
          title: 'Onboarding Guide',
          content: null,
          docLink: null,
          notesField: null,
        },
        sandboxIntro: {
          title: 'Sandbox Intro',
          content: null,
          docLink: null,
          notesField: null,
        },
      };

  return (
    <>
      {/* Export Dialog Modal */}
      {showExportDialog && (
        <div className={styles.modalOverlay} onClick={() => setShowExportDialog(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Export Documents</h3>
            <p className={styles.modalDescription}>
              Enter the details below to generate your exports
            </p>

            <div className={styles.exportFormGroup}>
              <label className={styles.exportLabel}>Merchant Name:</label>
              <input
                type="text"
                className={styles.textInput}
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g., Acme Corp"
                autoFocus
              />
            </div>

            <div className={styles.exportFormGroup}>
              <label className={styles.exportLabel}>Business Development Manager:</label>
              <input
                type="text"
                className={styles.textInput}
                value={bdmName}
                onChange={(e) => setBdmName(e.target.value)}
                placeholder="Enter BDM name"
              />
            </div>

            <div className={styles.exportFormGroup}>
              <label className={styles.exportLabel}>Solutions Engineer:</label>
              <input
                type="text"
                className={styles.textInput}
                value={seName}
                onChange={(e) => setSeName(e.target.value)}
                placeholder="Enter SE name"
              />
            </div>

            {exportType === 'pdf' && (
              <div className={styles.exportFormGroup}>
                <label className={styles.exportLabel}>Documents to Export:</label>
                <div className={styles.exportDocCheckboxes}>
                  <label className={styles.exportDocCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={exportDocs.sow}
                      onChange={(e) => setExportDocs({ ...exportDocs, sow: e.target.checked })}
                    />
                    SOW Summary
                  </label>
                  <label className={styles.exportDocCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={exportDocs.guide}
                      onChange={(e) => setExportDocs({ ...exportDocs, guide: e.target.checked })}
                    />
                    Onboarding Guide
                  </label>
                  <label className={styles.exportDocCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={exportDocs.sandboxIntro}
                      onChange={(e) => setExportDocs({ ...exportDocs, sandboxIntro: e.target.checked })}
                    />
                    Sandbox Intro
                  </label>
                </div>
              </div>
            )}

            <div className={styles.exportFormGroup}>
              <label className={styles.exportLabel}>Export Format:</label>
              <div className={styles.exportTypeButtons}>
                <button
                  className={`${styles.exportTypeButton} ${exportType === 'pdf' ? styles.exportTypeButtonActive : ''}`}
                  onClick={() => setExportType('pdf')}
                >
                  📄 PDF (Formatted)
                </button>
                <button
                  className={`${styles.exportTypeButton} ${exportType === 'json' ? styles.exportTypeButtonActive : ''}`}
                  onClick={() => setExportType('json')}
                >
                  💾 JSON (Database)
                </button>
              </div>
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.buttonSecondary}
                onClick={() => {
                  setShowExportDialog(false);
                  setMerchantName('');
                  setBdmName('');
                  setSeName('');
                }}
              >
                Cancel
              </button>
              <button className={styles.buttonPrimary} onClick={handleExport}>
                {exportType === 'json'
                  ? 'Export JSON'
                  : `Export ${[exportDocs.sow, exportDocs.guide, exportDocs.sandboxIntro].filter(Boolean).length} PDF${[exportDocs.sow, exportDocs.guide, exportDocs.sandboxIntro].filter(Boolean).length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className={styles.outputContainer}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>SOW Builder</h2>
          <div className={styles.headerButtons}>
            {userRole === 'se' && (
              <button className={styles.editButton} onClick={onBackToEdit}>
                ← SE Technical Review
              </button>
            )}
            <button className={styles.exportButton} onClick={() => setShowExportDialog(true)}>
              📥 Export
            </button>
          </div>
        </div>

        {/* Merchant Preview toggle — SE only */}
        {userRole === 'se' && (
          <button
            className={`${styles.merchantPreviewToggle} ${merchantPreview ? styles.merchantPreviewToggleActive : ''}`}
            onClick={() => {
              const entering = !merchantPreview;
              setMerchantPreview(entering);
              setSelectedCategory(entering ? 'merchantSOW' : 'summary');
            }}
          >
            {merchantPreview ? '← Back to SE View' : '👁 Preview as Merchant'}
          </button>
        )}

        {merchantPreview && (
          <div className={styles.merchantPreviewBanner}>
            Merchant Preview — read-only
          </div>
        )}

        <nav className={styles.sidebarNav}>
          {Object.keys(categoryContent).map((key) => (
            <button
              key={key}
              className={`${styles.navItem} ${
                selectedCategory === key ? styles.navItemActive : ''
              }`}
              onClick={() => setSelectedCategory(key)}
            >
              {categoryContent[key].title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* SE Tracking Section */}
        {userRole === 'se' && !merchantPreview && (
          <div className={styles.seTrackingSectionMain}>
            <h3 className={styles.seTrackingTitleMain}>Status Tracking</h3>

            <div className={styles.seTrackingGrid}>
              {/* SE Reviewed */}
              <label className={styles.seTrackingCheckbox}>
                <input
                  type="checkbox"
                  checked={currentVersion?.seReviewed || false}
                  onChange={() => {
                    const updatedVersions = versions.map(v =>
                      v.id === selectedVersionId ? { ...v, seReviewed: !v.seReviewed } : v
                    );
                    onVersionsUpdate(updatedVersions);
                  }}
                  className={styles.checkbox}
                />
                <span>SE Reviewed</span>
              </label>

              {/* SE Approved */}
              <label className={styles.seTrackingCheckbox}>
                <input
                  type="checkbox"
                  checked={currentVersion?.seApproved || false}
                  onChange={() => {
                    const updatedVersions = versions.map(v =>
                      v.id === selectedVersionId ? { ...v, seApproved: !v.seApproved } : v
                    );
                    onVersionsUpdate(updatedVersions);
                  }}
                  className={styles.checkbox}
                />
                <span>SE Approved</span>
              </label>

              {/* Shared in Meeting */}
              <div className={styles.seTrackingField}>
                <label className={styles.seTrackingFieldLabel}>Shared with merchant in meeting on:</label>
                <input
                  type="date"
                  className={styles.seTrackingDateInput}
                  value={currentVersion?.sharedInMeetingDate || ''}
                  onChange={(e) => {
                    const updatedVersions = versions.map(v =>
                      v.id === selectedVersionId ? { ...v, sharedInMeetingDate: e.target.value } : v
                    );
                    onVersionsUpdate(updatedVersions);
                  }}
                />
              </div>

              {/* Emailed to Merchant */}
              <div className={styles.seTrackingField}>
                <label className={styles.seTrackingFieldLabel}>Emailed SOW to merchant:</label>
                <input
                  type="email"
                  className={styles.seTrackingInput}
                  value={currentVersion?.emailedTo || ''}
                  onChange={(e) => {
                    const updatedVersions = versions.map(v =>
                      v.id === selectedVersionId ? { ...v, emailedTo: e.target.value } : v
                    );
                    onVersionsUpdate(updatedVersions);
                  }}
                  placeholder="merchant@email.com"
                />
                <input
                  type="date"
                  className={styles.seTrackingDateInput}
                  value={currentVersion?.emailedDate || ''}
                  onChange={(e) => {
                    const updatedVersions = versions.map(v =>
                      v.id === selectedVersionId ? { ...v, emailedDate: e.target.value } : v
                    );
                    onVersionsUpdate(updatedVersions);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.contentHeader}>
          <h1>{categoryContent[selectedCategory].title}</h1>
          <span className={styles.versionBadge}>{currentVersion?.version || 'v1.0'}</span>
        </div>

        {/* ── SE Summary view ── */}
        {selectedCategory === 'summary' && (
          <div className={styles.contentBody}>
            {/* SE Status Section */}
            {(currentVersion?.seReviewed || currentVersion?.seApproved || currentVersion?.sharedInMeetingDate || currentVersion?.emailedTo) && (
              <div className={styles.summarySection}>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {'STATUS\n━━━━━━━━━━━━━━━━━━━━\n'}
                  {currentVersion?.seReviewed && '✓ SE Reviewed\n'}
                  {currentVersion?.seApproved && '✓ SE Approved\n'}
                  {currentVersion?.sharedInMeetingDate && `📅 Shared in meeting: ${new Date(currentVersion.sharedInMeetingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`}
                  {currentVersion?.emailedTo && currentVersion?.emailedDate && `📧 Emailed to: ${currentVersion.emailedTo} on ${new Date(currentVersion.emailedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`}
                </p>
              </div>
            )}
            {/* Go Live Date */}
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'GO LIVE DATE\n━━━━━━━━━━━━━━━━━━━━\n'}{formatDate(displayData.goLiveDate)}</p>
            </div>
            {/* Payment Methods */}
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'PAYMENT METHODS\n━━━━━━━━━━━━━━━━━━━━\n'}{formatPaymentMethods()}</p>
              <a href="https://primer.io/docs/connections/payment-methods/overview" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View Payment Methods Documentation</a>
            </div>
            {/* PSPs */}
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'PSPs\n━━━━━━━━━━━━━━━━━━━━\n'}{formatPSPs()}</p>
              <a href="https://primer.io/docs/connections/payment-methods/overview" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View PSP Documentation</a>
            </div>
            {/* 3DS */}
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'3DS STRATEGIES\n━━━━━━━━━━━━━━━━━━━━\n'}{format3DSStrategy()}</p>
              <a href="https://primer.io/docs/payment-services/3d-secure/overview" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View 3DS Documentation</a>
            </div>
            {/* Channels */}
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'PURCHASE CHANNELS & FLOWS\n━━━━━━━━━━━━━━━━━━━━\n'}{formatChannelsAndFlows()}</p>
              <a href="https://web-components.primer.io/" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View Web Components Documentation</a>
            </div>
            {/* Token Migration */}
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'TOKEN MIGRATION\n━━━━━━━━━━━━━━━━━━━━\n'}{formatTokenMigration()}</p>
            </div>
          </div>
        )}

        {/* ── Merchant SOW view (read-only, no SE controls) ── */}
        {selectedCategory === 'merchantSOW' && (
          <div className={styles.contentBody}>
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'GO LIVE DATE\n━━━━━━━━━━━━━━━━━━━━\n'}{formatDate(displayData.goLiveDate)}</p>
            </div>
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'PAYMENT METHODS\n━━━━━━━━━━━━━━━━━━━━\n'}{formatPaymentMethods()}</p>
              <a href="https://primer.io/docs/connections/payment-methods/overview" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View Payment Methods Documentation</a>
            </div>
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'PSPs\n━━━━━━━━━━━━━━━━━━━━\n'}{formatPSPs()}</p>
              <a href="https://primer.io/docs/connections/payment-methods/overview" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View PSP Documentation</a>
            </div>
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'3DS STRATEGIES\n━━━━━━━━━━━━━━━━━━━━\n'}{format3DSStrategy()}</p>
              <a href="https://primer.io/docs/payment-services/3d-secure/overview" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View 3DS Documentation</a>
            </div>
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'PURCHASE CHANNELS & FLOWS\n━━━━━━━━━━━━━━━━━━━━\n'}{formatChannelsAndFlows()}</p>
              <a href="https://web-components.primer.io/" target="_blank" rel="noopener noreferrer" className={styles.docLinkBox}>🔗 View Web Components Documentation</a>
            </div>
            <div className={styles.summarySection}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{'TOKEN MIGRATION\n━━━━━━━━━━━━━━━━━━━━\n'}{formatTokenMigration()}</p>
            </div>
          </div>
        )}

        {/* ── SE Onboarding Guide (editable) ── */}
        {selectedCategory === 'onboardingGuide' && (
          <div className={styles.guideContainer}>
            {userRole === 'se' && (
              <div className={styles.guideSeContact}>
                <span className={styles.guideSeContactLabel}>SE Contact:</span>
                <input
                  className={styles.guideSeContactInput}
                  placeholder="Your name"
                  value={currentVersion?.seContact || ''}
                  onChange={e => updateSEContact('seContact', e.target.value)}
                />
                <input
                  className={styles.guideSeContactInput}
                  placeholder="your@email.com"
                  value={currentVersion?.seEmail || ''}
                  onChange={e => updateSEContact('seEmail', e.target.value)}
                />
              </div>
            )}
            {GUIDE_SECTIONS.map(section => {
              const visible = isGuideSectionVisible(section);
              const isEditing = editingGuideSection === section.id;
              const content = getGuideContent(section);
              const isAutoHidden = !section.showByDefault(displayData);
              return (
                <div key={section.id} className={`${styles.guideSectionCard} ${!visible ? styles.guideSectionHidden : ''}`}>
                  <div className={styles.guideSectionHeader}>
                    <h3 className={styles.guideSectionTitle}>{section.title}</h3>
                    <div className={styles.guideSectionActions}>
                      {isAutoHidden && !visible && (
                        <span className={styles.guideAutoHiddenBadge}>auto-hidden by SOW</span>
                      )}
                      <button
                        className={`${styles.guideVisibilityBtn} ${visible ? styles.guideVisibilityBtnActive : ''}`}
                        title={visible ? 'Hide this section' : 'Show this section'}
                        onClick={() => updateGuideCustomization(section.id, { isVisible: !visible })}
                      >
                        {visible ? '👁 Visible' : '🚫 Hidden'}
                      </button>
                      {visible && !isEditing && (
                        <button
                          className={styles.guideEditBtn}
                          onClick={() => {
                            setEditingGuideSection(section.id);
                            setEditGuideSectionContent(content);
                          }}
                        >
                          ✏️ Edit
                        </button>
                      )}
                      {visible && isEditing && (
                        <>
                          <button
                            className={styles.guideSaveBtn}
                            onClick={() => {
                              updateGuideCustomization(section.id, { customContent: editGuideSectionContent });
                              setEditingGuideSection(null);
                            }}
                          >
                            ✓ Save
                          </button>
                          <button
                            className={styles.guideCancelBtn}
                            onClick={() => setEditingGuideSection(null)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {visible && (
                    isEditing ? (
                      <textarea
                        className={styles.guideSectionEditor}
                        value={editGuideSectionContent}
                        onChange={e => setEditGuideSectionContent(e.target.value)}
                        rows={Math.max(8, content.split('\n').length + 2)}
                      />
                    ) : (
                      <pre className={styles.guideSectionContent}>{content}</pre>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Merchant Onboarding Guide (read-only) ── */}
        {selectedCategory === 'merchantGuide' && (
          <div className={styles.guideContainer}>
            {GUIDE_SECTIONS.filter(section => isGuideSectionVisible(section)).map(section => (
              <div key={section.id} className={styles.guideSectionCard}>
                <div className={styles.guideSectionHeader}>
                  <h3 className={styles.guideSectionTitle}>{section.title}</h3>
                </div>
                <pre className={styles.guideSectionContent}>{getGuideContent(section)}</pre>
              </div>
            ))}
          </div>
        )}

        {/* ── Sandbox Intro (SE editable, merchant read-only) ── */}
        {selectedCategory === 'sandboxIntro' && (
          <div className={styles.guideContainer}>
            {effectiveRole === 'se'
              ? SANDBOX_INTRO_SECTIONS.map(section => {
                  const visible = isSandboxIntroSectionVisible(section);
                  const isEditing = editingGuideSection === section.id;
                  const content = getSandboxIntroContent(section);
                  return (
                    <div key={section.id} className={`${styles.guideSectionCard} ${!visible ? styles.guideSectionHidden : ''}`}>
                      <div className={styles.guideSectionHeader}>
                        <h3 className={styles.guideSectionTitle}>{section.title}</h3>
                        <div className={styles.guideSectionActions}>
                          <button
                            className={`${styles.guideVisibilityBtn} ${!visible ? styles.guideVisibilityBtnActive : ''}`}
                            onClick={() => updateGuideCustomization(section.id, { isVisible: !visible })}
                            title={visible ? 'Hide from merchant' : 'Show to merchant'}
                          >
                            {visible ? '👁 Visible' : '🚫 Hidden'}
                          </button>
                          {visible && !isEditing && (
                            <button
                              className={styles.guideEditBtn}
                              onClick={() => {
                                setEditingGuideSection(section.id);
                                setEditGuideSectionContent(content);
                              }}
                            >
                              ✏️ Edit
                            </button>
                          )}
                          {isEditing && (
                            <>
                              <button
                                className={styles.guideSaveBtn}
                                onClick={() => {
                                  updateGuideCustomization(section.id, { customContent: editGuideSectionContent });
                                  setEditingGuideSection(null);
                                }}
                              >
                                ✓ Save
                              </button>
                              <button
                                className={styles.guideCancelBtn}
                                onClick={() => setEditingGuideSection(null)}
                              >
                                ✕ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {visible && (
                        isEditing ? (
                          <textarea
                            className={styles.guideSectionEditor}
                            value={editGuideSectionContent}
                            onChange={(e) => setEditGuideSectionContent(e.target.value)}
                            rows={Math.max(8, content.split('\n').length + 2)}
                          />
                        ) : (
                          <div className={styles.guideSectionContent}>
                            {renderSandboxContent(content)}
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              : SANDBOX_INTRO_SECTIONS.filter(section => isSandboxIntroSectionVisible(section)).map(section => (
                  <div key={section.id} className={styles.guideSectionCard}>
                    <div className={styles.guideSectionHeader}>
                      <h3 className={styles.guideSectionTitle}>{section.title}</h3>
                    </div>
                    <div className={styles.guideSectionContent}>
                      {renderSandboxContent(getSandboxIntroContent(section))}
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* Additional Notes Section */}
        {categoryContent[selectedCategory].notesField && (
          <div className={styles.notesSection}>
            <div className={styles.notesSectionHeader}>
              <h3 className={styles.notesSectionTitle}>Additional Notes</h3>
              {/* Only allow editing if viewing current version */}
              {selectedVersionId === currentVersionId && editingNotes !== selectedCategory ? (
                <button
                  className={styles.editNotesButton}
                  onClick={() => setEditingNotes(selectedCategory)}
                >
                  ✏️ {displayData[categoryContent[selectedCategory].notesField as keyof SOWData] ? 'Edit' : 'Add'} Notes
                </button>
              ) : selectedVersionId === currentVersionId ? (
                <button
                  className={styles.saveNotesButton}
                  onClick={() => setEditingNotes(null)}
                >
                  ✓ Save
                </button>
              ) : null}
            </div>

            {editingNotes === selectedCategory && selectedVersionId === currentVersionId ? (
              <textarea
                className={styles.notesTextarea}
                value={sowData[categoryContent[selectedCategory].notesField as keyof SOWData] as string || ''}
                onChange={(e) => handleNotesChange(categoryContent[selectedCategory].notesField as keyof SOWData, e.target.value)}
                placeholder="Add any additional notes or context for this section..."
                rows={4}
                autoFocus
              />
            ) : (
              displayData[categoryContent[selectedCategory].notesField as keyof SOWData] && (
                <div className={styles.notesDisplay}>
                  {displayData[categoryContent[selectedCategory].notesField as keyof SOWData] as string}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Right Sidebar - Versions */}
      <aside className={styles.versionSidebar}>
        <h3 className={styles.versionSidebarTitle}>
          {effectiveRole === 'merchant' ? 'Published Versions' : 'Version History'}
        </h3>

        {/* Push to Merchant button for SEs (not in preview mode) */}
        {userRole === 'se' && !merchantPreview && currentVersion && (
          <button
            className={styles.pushToMerchantButton}
            onClick={() => {
              const updatedVersions = versions.map(v =>
                v.id === selectedVersionId ? { ...v, publishedToMerchant: !v.publishedToMerchant } : v
              );
              onVersionsUpdate(updatedVersions);
            }}
          >
            {currentVersion?.publishedToMerchant ? '✓ Published to Merchant' : '📤 Push to Merchant'}
          </button>
        )}

        <div className={styles.versionList}>
          {(() => {
            // Filter versions based on effective role
            const displayVersions = effectiveRole === 'merchant'
              ? versions.filter(v => v.publishedToMerchant)
              : versions;

            if (displayVersions.length === 0) {
              return <div className={styles.noVersions}>
                {effectiveRole === 'merchant' ? 'No published versions yet' : 'No versions yet'}
              </div>;
            }

            return displayVersions.slice().reverse().map((version) => (
              <div key={version.id} className={styles.versionItemWrapper}>
                <button
                  className={`${styles.versionItem} ${
                    selectedVersionId === version.id ? styles.versionItemActive : ''
                  }`}
                  onClick={() => setSelectedVersionId(version.id)}
                >
                  <div className={styles.versionHeader}>
                    <span className={styles.versionLabel}>{version.version}</span>
                    <div className={styles.versionBadges}>
                      {version.publishedToMerchant && <span className={styles.versionPublishedBadge}>📤</span>}
                      {version.seReviewed && <span className={styles.versionReviewedBadge}>✓</span>}
                    </div>
                  </div>
                  <span className={styles.versionRole}>{getRoleLabel(version.createdBy)}</span>
                  <span className={styles.versionDate}>{formatVersionDate(version.createdAt)}</span>
                </button>
              </div>
            ));
          })()}
        </div>
      </aside>
    </div>
    </>
  );
}
