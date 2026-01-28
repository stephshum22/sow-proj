'use client';

import { useState } from 'react';
import styles from './page.module.css';

type TokenMigrationEntry = {
  id: string;
  psp: string;
  tokenCount: string;
};

type SOWData = {
  goLiveDate: string;
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
};

const CATEGORIES = [
  { id: 'goLiveDate', label: 'Go Live Date', type: 'date' },
  { id: 'pspApms', label: 'PSPs & APMs', type: 'psp-apms' },
  { id: '3dsStrategy', label: '3DS Strategies', type: '3ds' },
  { id: 'purchaseChannels', label: 'Purchase Channels & Flows', type: 'channels' },
  { id: 'tokenMigration', label: 'Token Migration', type: 'token' },
];

const PAYMENT_METHODS = [
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
  'Card',
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

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [sowData, setSOWData] = useState<SOWData>({
    goLiveDate: '',
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
  });

  const currentCategory = CATEGORIES[currentStep];
  const isLastStep = currentStep === CATEGORIES.length - 1;

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

  const togglePSP = (psp: string) => {
    const currentPSPs = sowData.psps;
    if (currentPSPs.includes(psp)) {
      handleInputChange('psps', currentPSPs.filter(p => p !== psp));
    } else {
      handleInputChange('psps', [...currentPSPs, psp]);
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
    setCurrentStep(0);
  };

  if (showOutput) {
    return <OutputView sowData={sowData} onBackToEdit={handleBackToEdit} />;
  }

  const renderFormField = () => {
    switch (currentCategory.type) {
      case 'date':
        return (
          <div>
            <input
              type="date"
              className={styles.dateInput}
              value={sowData.goLiveDate}
              onChange={(e) => handleInputChange('goLiveDate', e.target.value)}
            />
          </div>
        );

      case 'psp-apms':
        return (
          <div className={styles.pspApmsWrapper}>
            {/* Payment Methods Selection */}
            <div className={styles.paymentMethodsSection}>
              <h3 className={styles.sectionTitle}>What are the Payment Methods you want to accept?</h3>
              <div className={styles.paymentMethodsGrid}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`${styles.paymentMethodButton} ${
                      sowData.paymentMethods.includes(method) ? styles.paymentMethodButtonActive : ''
                    }`}
                    onClick={() => togglePaymentMethod(method)}
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
                  value={sowData.paymentMethodsOther}
                  onChange={(e) => handleInputChange('paymentMethodsOther', e.target.value)}
                  placeholder="Enter other payment methods"
                />
              </div>
            </div>

            {/* PSP Selection */}
            <div className={styles.paymentMethodsSection}>
              <h3 className={styles.sectionTitle}>Which PSPs would you like to use?</h3>
              <div className={styles.paymentMethodsGrid}>
                {PSPS.map((psp) => (
                  <button
                    key={psp}
                    type="button"
                    className={`${styles.paymentMethodButton} ${
                      sowData.psps.includes(psp) ? styles.paymentMethodButtonActive : ''
                    }`}
                    onClick={() => togglePSP(psp)}
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
                  value={sowData.pspsOther}
                  onChange={(e) => handleInputChange('pspsOther', e.target.value)}
                  placeholder="Enter other PSPs"
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
          <h1>SOW Builder</h1>
          <p>Create your Statement of Work</p>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressSteps}>
            {CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                className={`${styles.progressStep} ${
                  idx <= currentStep ? styles.progressStepActive : ''
                }`}
              >
                <div className={styles.progressStepCircle}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                <span className={styles.progressStepLabel}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formContent}>
          <div className={styles.stepIndicator}>
            Step {currentStep + 1} of {CATEGORIES.length}
          </div>
          <h2>{currentCategory.label}</h2>
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
  onBackToEdit,
}: {
  sowData: SOWData;
  onBackToEdit: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('summary');
  const [selectedVersion, setSelectedVersion] = useState('v1.0');

  const versions = [
    { id: 'v1.0', label: 'v1.0', date: 'Current' },
    { id: 'v0.9', label: 'v0.9', date: '2 days ago' },
    { id: 'v0.8', label: 'v0.8', date: '1 week ago' },
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date selected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPaymentMethods = () => {
    const methods = [...sowData.paymentMethods];
    if (sowData.paymentMethodsOther) {
      methods.push(`Other: ${sowData.paymentMethodsOther}`);
    }
    if (methods.length === 0) {
      return 'No payment methods selected';
    }
    return methods.map(method => `• ${method}`).join('\n');
  };

  const formatPSPs = () => {
    const psps = [...sowData.psps];
    if (sowData.pspsOther) {
      psps.push(`Other: ${sowData.pspsOther}`);
    }
    if (psps.length === 0) {
      return 'No PSPs selected';
    }
    return psps.map(psp => `• ${psp}`).join('\n');
  };

  const format3DSStrategy = () => {
    if (sowData.has3DSStrategy === 'no') {
      return 'No 3DS strategy currently';
    } else if (sowData.has3DSStrategy === 'yes') {
      if (sowData.threeDSStrategy === 'mandated') {
        return 'Yes - Mandated 3DS';
      } else if (sowData.threeDSStrategy === 'adaptive') {
        return 'Yes - Adaptive 3DS';
      } else if (sowData.threeDSStrategy === 'other') {
        return `Yes - Other: ${sowData.threeDSStrategyOther || 'Not specified'}`;
      }
    }
    return 'No information provided';
  };

  const formatChannelsAndFlows = () => {
    const parts = [];

    // Channels
    parts.push('Channels:');
    if (sowData.channels.length > 0) {
      parts.push(sowData.channels.map(channel => `  • ${channel}`).join('\n'));
    } else {
      parts.push('  None selected');
    }

    // Transaction Flows
    parts.push('\nTransaction Flows:');
    if (sowData.transactionFlows.length > 0) {
      parts.push(sowData.transactionFlows.map(flow => `  • ${flow}`).join('\n'));
    } else {
      parts.push('  None selected');
    }

    // Recurring Payments
    parts.push('\nRecurring Payments:');
    if (sowData.recurringPayments === 'yes') {
      parts.push('  • Yes');
      if (sowData.subscriptionPlatform && sowData.subscriptionPlatform !== 'no') {
        parts.push(`  • Subscription Platform: ${sowData.subscriptionPlatform}`);
      } else if (sowData.subscriptionPlatform === 'no') {
        parts.push('  • Subscription Platform: No');
      }
    } else if (sowData.recurringPayments === 'no') {
      parts.push('  • No');
    } else {
      parts.push('  Not specified');
    }

    return parts.join('\n');
  };

  const formatTokenMigration = () => {
    if (sowData.tokenMigrationRequired === 'no') {
      return 'No token migration required';
    } else if (sowData.tokenMigrationRequired === 'yes') {
      if (sowData.tokenMigrationEntries.length === 0 || !sowData.tokenMigrationEntries[0].psp) {
        return 'Token migration required (no details provided)';
      }

      return sowData.tokenMigrationEntries.map((entry, index) => {
        const tokenCount = entry.tokenCount || '0';
        const psp = entry.psp || 'Not specified';
        return `• PSP: ${psp}\n  Tokens: ${tokenCount}`;
      }).join('\n\n');
    }
    return 'No information provided';
  };

  const formatSummary = () => {
    const sections = [];

    // Go Live Date
    sections.push('GO LIVE DATE');
    sections.push('═══════════════════════════════════════');
    sections.push(formatDate(sowData.goLiveDate));
    sections.push('');
    sections.push('');

    // Payment Methods
    sections.push('PAYMENT METHODS');
    sections.push('═══════════════════════════════════════');
    sections.push(formatPaymentMethods());
    sections.push('');
    sections.push('');

    // PSPs
    sections.push('PSPs');
    sections.push('═══════════════════════════════════════');
    sections.push(formatPSPs());
    sections.push('');
    sections.push('');

    // 3DS Strategies
    sections.push('3DS STRATEGIES');
    sections.push('═══════════════════════════════════════');
    sections.push(format3DSStrategy());
    sections.push('');
    sections.push('');

    // Purchase Channels & Flows
    sections.push('PURCHASE CHANNELS & FLOWS');
    sections.push('═══════════════════════════════════════');
    sections.push(formatChannelsAndFlows());
    sections.push('');
    sections.push('');

    // Token Migration
    sections.push('TOKEN MIGRATION');
    sections.push('═══════════════════════════════════════');
    sections.push(formatTokenMigration());

    return sections.join('\n');
  };

  const categoryContent: Record<string, any> = {
    summary: {
      title: 'Summary',
      content: formatSummary(),
      docLink: null,
    },
    goLiveDate: {
      title: 'Go Live Date',
      content: formatDate(sowData.goLiveDate),
      docLink: null,
    },
    paymentMethods: {
      title: 'Payment Methods',
      content: formatPaymentMethods(),
      docLink: {
        url: 'https://primer.io/docs/connections/payment-methods/overview',
        label: '📚 View Payment Methods Documentation',
      },
    },
    psps: {
      title: 'PSPs',
      content: formatPSPs(),
      docLink: {
        url: 'https://primer.io/docs/connections/payment-methods/overview',
        label: '📚 View PSP Documentation',
      },
    },
    threeDSStrategy: {
      title: '3DS Strategies',
      content: format3DSStrategy(),
      docLink: {
        url: 'https://primer.io/docs/payment-services/3d-secure/overview',
        label: '📚 View 3DS Documentation',
      },
    },
    channelsAndFlows: {
      title: 'Purchase Channels & Flows',
      content: formatChannelsAndFlows(),
      docLink: {
        url: 'https://web-components.primer.io/',
        label: '📚 View Web Components Documentation',
      },
    },
    tokenMigration: {
      title: 'Token Migration',
      content: formatTokenMigration(),
      docLink: null,
    },
  };

  return (
    <div className={styles.outputContainer}>
      {/* Left Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>SOW Builder</h2>
          <button className={styles.editButton} onClick={onBackToEdit}>
            ← Edit
          </button>
        </div>
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
        <div className={styles.contentHeader}>
          <h1>{categoryContent[selectedCategory].title}</h1>
          <span className={styles.versionBadge}>{selectedVersion}</span>
        </div>

        {categoryContent[selectedCategory].docLink && (
          <a
            href={categoryContent[selectedCategory].docLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docLinkBox}
          >
            {categoryContent[selectedCategory].docLink.label}
          </a>
        )}

        <div className={styles.contentBody}>
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {categoryContent[selectedCategory].content}
          </p>
        </div>
      </main>

      {/* Right Sidebar - Versions */}
      <aside className={styles.versionSidebar}>
        <h3 className={styles.versionSidebarTitle}>Versions</h3>
        <div className={styles.versionList}>
          {versions.map((version) => (
            <button
              key={version.id}
              className={`${styles.versionItem} ${
                selectedVersion === version.id ? styles.versionItemActive : ''
              }`}
              onClick={() => setSelectedVersion(version.id)}
            >
              <span className={styles.versionLabel}>{version.label}</span>
              <span className={styles.versionDate}>{version.date}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
