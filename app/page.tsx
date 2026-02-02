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
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [schema, setSchema] = useState<QuestionnaireSchema | null>(null);
  const [gandalfQuestionnaire, setGandalfQuestionnaire] = useState<GandalfQuestionnaire | null>(null);
  const [showSchemaImport, setShowSchemaImport] = useState(false);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
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
    goLiveDateNotes: '',
    paymentMethodsNotes: '',
    pspsNotes: '',
    threeDSNotes: '',
    channelsNotes: '',
    tokenMigrationNotes: '',
  });

  // Load default schema on mount
  useEffect(() => {
    loadDefaultSchema();
  }, []);

  const loadDefaultSchema = async () => {
    try {
      const response = await fetch('/default-schema.json');
      const schemaData = await response.json();
      setSchema(schemaData);
    } catch (error) {
      console.error('Failed to load default schema:', error);
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
    if (gandalfQuestionnaire) {
      const sortedQuestions = [...gandalfQuestionnaire.questions].sort((a, b) => a.orderIndex - b.orderIndex);
      return sortedQuestions[currentStep];
    } else if (schema) {
      return schema.steps[currentStep];
    } else {
      return CATEGORIES[currentStep];
    }
  };

  const getTotalSteps = () => {
    if (gandalfQuestionnaire) {
      return gandalfQuestionnaire.questions.length;
    } else if (schema) {
      return schema.steps.length;
    } else {
      return CATEGORIES.length;
    }
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
    return <OutputView sowData={sowData} setSOWData={setSOWData} onBackToEdit={handleBackToEdit} />;
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
    // If using Gandalf questionnaire, render that instead
    if (gandalfQuestionnaire && currentCategory && 'questionType' in currentCategory) {
      return renderGandalfQuestion(currentCategory as GandalfQuestion);
    }

    // Otherwise render based on custom schema or default
    if (!currentCategory || !('type' in currentCategory)) {
      return <div>Invalid question configuration</div>;
    }
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
          <div className={styles.headerTitleSection}>
            <h1>{gandalfQuestionnaire ? gandalfQuestionnaire.title : schema?.title || 'SOW Builder'}</h1>
            <p>{gandalfQuestionnaire ? gandalfQuestionnaire.description : schema?.description || 'Create your Statement of Work'}</p>
          </div>
          <div className={styles.headerActions}>
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
            {gandalfQuestionnaire ? (
              gandalfQuestionnaire.questions
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((q, idx) => (
                  <div
                    key={q.id}
                    className={`${styles.progressStep} ${
                      idx <= currentStep ? styles.progressStepActive : ''
                    }`}
                  >
                    <div className={styles.progressStepCircle}>
                      {idx < currentStep ? '✓' : idx + 1}
                    </div>
                    <span className={styles.progressStepLabel}>Q{idx + 1}</span>
                  </div>
                ))
            ) : schema ? (
              schema.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`${styles.progressStep} ${
                    idx <= currentStep ? styles.progressStepActive : ''
                  }`}
                >
                  <div className={styles.progressStepCircle}>
                    {idx < currentStep ? '✓' : idx + 1}
                  </div>
                  <span className={styles.progressStepLabel}>{step.label}</span>
                </div>
              ))
            ) : (
              CATEGORIES.map((cat, idx) => (
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
              ))
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
}: {
  sowData: SOWData;
  setSOWData: (data: SOWData) => void;
  onBackToEdit: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('summary');
  const currentVersion = 'v1.0';
  const [merchantName, setMerchantName] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'json'>('pdf');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  const handleNotesChange = (field: keyof SOWData, value: string) => {
    setSOWData({
      ...sowData,
      [field]: value,
    });
  };

  const handleExportJSON = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const fileName = merchantName
      ? `SOW_${merchantName.replace(/\s+/g, '-')}_${todayDate}_${currentVersion}.json`
      : `SOW_${todayDate}_${currentVersion}.json`;

    const exportData = {
      merchantName: merchantName || 'Unknown',
      version: currentVersion,
      exportDate: todayDate,
      data: sowData,
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
    doc.text(`Version: ${currentVersion}`, pageWidth - margin - 60, 28);

    yPos = 45;
    doc.setTextColor(74, 44, 31); // Dark brown for body text

    // Go Live Date Section
    doc.setFillColor(255, 246, 174); // Light yellow
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('GO LIVE DATE', margin + 2, yPos + 6);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    yPos = addText(formatDate(sowData.goLiveDate), margin, yPos, contentWidth);
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
    doc.setFillColor(255, 246, 174);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('PAYMENT METHODS', margin + 2, yPos + 6);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const paymentMethodsText = formatPaymentMethods().replace(/• /g, '  • ');
    yPos = addText(paymentMethodsText, margin, yPos, contentWidth);
    yPos += 8;

    // PSPs Section
    yPos = checkNewPage(30);
    doc.setFillColor(255, 246, 174);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('PSPs', margin + 2, yPos + 6);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const pspsText = formatPSPs().replace(/• /g, '  • ');
    yPos = addText(pspsText, margin, yPos, contentWidth);
    yPos += 8;

    // 3DS Strategies Section
    yPos = checkNewPage(25);
    doc.setFillColor(255, 246, 174);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('3DS STRATEGIES', margin + 2, yPos + 6);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    yPos = addText(format3DSStrategy(), margin, yPos, contentWidth);
    yPos += 8;

    // Purchase Channels & Flows Section
    yPos = checkNewPage(40);
    doc.setFillColor(255, 246, 174);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('PURCHASE CHANNELS & FLOWS', margin + 2, yPos + 6);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const channelsText = formatChannelsAndFlows().replace(/• /g, '  • ');
    yPos = addText(channelsText, margin, yPos, contentWidth);
    yPos += 8;

    // Token Migration Section
    yPos = checkNewPage(25);
    doc.setFillColor(255, 246, 174);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 124, 79);
    doc.text('TOKEN MIGRATION', margin + 2, yPos + 6);
    yPos += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(74, 44, 31);
    const tokenText = formatTokenMigration().replace(/• /g, '  • ');
    yPos = addText(tokenText, margin, yPos, contentWidth);

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Primer SOW Builder', margin, pageHeight - 10);
    doc.text(`primer.io`, pageWidth - margin - 20, pageHeight - 10);

    // Save the PDF
    const todayDate = new Date().toISOString().split('T')[0];
    const fileName = merchantName
      ? `SOW_${merchantName.replace(/\s+/g, '-')}_${todayDate}_${currentVersion}.pdf`
      : `SOW_${todayDate}_${currentVersion}.pdf`;

    doc.save(fileName);
    setShowExportDialog(false);
    setMerchantName('');
  };

  const handleExport = () => {
    if (exportType === 'pdf') {
      handleExportPDF();
    } else {
      handleExportJSON();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date selected';
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (sowData.goLiveDateNotes) {
      return `${formattedDate}\n\nAdditional Notes:\n${sowData.goLiveDateNotes}`;
    }
    return formattedDate;
  };

  const formatPaymentMethods = () => {
    const methods = [...sowData.paymentMethods];
    if (sowData.paymentMethodsOther) {
      methods.push(`Other: ${sowData.paymentMethodsOther}`);
    }
    if (methods.length === 0) {
      return 'No payment methods selected';
    }
    let result = methods.map(method => `• ${method}`).join('\n');
    if (sowData.paymentMethodsNotes) {
      result += `\n\nAdditional Notes:\n${sowData.paymentMethodsNotes}`;
    }
    return result;
  };

  const formatPSPs = () => {
    const psps = [...sowData.psps];
    if (sowData.pspsOther) {
      psps.push(`Other: ${sowData.pspsOther}`);
    }
    if (psps.length === 0) {
      return 'No PSPs selected';
    }
    let result = psps.map(psp => `• ${psp}`).join('\n');
    if (sowData.pspsNotes) {
      result += `\n\nAdditional Notes:\n${sowData.pspsNotes}`;
    }
    return result;
  };

  const format3DSStrategy = () => {
    let result = '';
    if (sowData.has3DSStrategy === 'no') {
      result = 'No 3DS strategy currently';
    } else if (sowData.has3DSStrategy === 'yes') {
      if (sowData.threeDSStrategy === 'mandated') {
        result = 'Yes - Mandated 3DS';
      } else if (sowData.threeDSStrategy === 'adaptive') {
        result = 'Yes - Adaptive 3DS';
      } else if (sowData.threeDSStrategy === 'other') {
        result = `Yes - Other: ${sowData.threeDSStrategyOther || 'Not specified'}`;
      }
    } else {
      result = 'No information provided';
    }
    if (sowData.threeDSNotes) {
      result += `\n\nAdditional Notes:\n${sowData.threeDSNotes}`;
    }
    return result;
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

    if (sowData.channelsNotes) {
      parts.push('\nAdditional Notes:');
      parts.push(sowData.channelsNotes);
    }

    return parts.join('\n');
  };

  const formatTokenMigration = () => {
    let result = '';
    if (sowData.tokenMigrationRequired === 'no') {
      result = 'No token migration required';
    } else if (sowData.tokenMigrationRequired === 'yes') {
      if (sowData.tokenMigrationEntries.length === 0 || !sowData.tokenMigrationEntries[0].psp) {
        result = 'Token migration required (no details provided)';
      } else {
        result = sowData.tokenMigrationEntries.map((entry, index) => {
          const tokenCount = entry.tokenCount || '0';
          const psp = entry.psp || 'Not specified';
          return `• PSP: ${psp}\n  Tokens: ${tokenCount}`;
        }).join('\n\n');
      }
    } else {
      result = 'No information provided';
    }
    if (sowData.tokenMigrationNotes) {
      result += `\n\nAdditional Notes:\n${sowData.tokenMigrationNotes}`;
    }
    return result;
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
      notesField: null,
    },
    goLiveDate: {
      title: 'Go Live Date',
      content: formatDate(sowData.goLiveDate),
      docLink: null,
      notesField: 'goLiveDateNotes',
    },
    paymentMethods: {
      title: 'Payment Methods',
      content: formatPaymentMethods(),
      docLink: {
        url: 'https://primer.io/docs/connections/payment-methods/overview',
        label: '📚 View Payment Methods Documentation',
      },
      notesField: 'paymentMethodsNotes',
    },
    psps: {
      title: 'PSPs',
      content: formatPSPs(),
      docLink: {
        url: 'https://primer.io/docs/connections/payment-methods/overview',
        label: '📚 View PSP Documentation',
      },
      notesField: 'pspsNotes',
    },
    threeDSStrategy: {
      title: '3DS Strategies',
      content: format3DSStrategy(),
      docLink: {
        url: 'https://primer.io/docs/payment-services/3d-secure/overview',
        label: '📚 View 3DS Documentation',
      },
      notesField: 'threeDSNotes',
    },
    channelsAndFlows: {
      title: 'Purchase Channels & Flows',
      content: formatChannelsAndFlows(),
      docLink: {
        url: 'https://web-components.primer.io/',
        label: '📚 View Web Components Documentation',
      },
      notesField: 'channelsNotes',
    },
    tokenMigration: {
      title: 'Token Migration',
      content: formatTokenMigration(),
      docLink: null,
      notesField: 'tokenMigrationNotes',
    },
  };

  return (
    <>
      {/* Export Dialog Modal */}
      {showExportDialog && (
        <div className={styles.modalOverlay} onClick={() => setShowExportDialog(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Export SOW</h3>
            <p className={styles.modalDescription}>
              Enter merchant name and select export format
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
                }}
              >
                Cancel
              </button>
              <button className={styles.buttonPrimary} onClick={handleExport}>
                Export {exportType.toUpperCase()}
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
            <button className={styles.editButton} onClick={onBackToEdit}>
              ← Edit
            </button>
            <button className={styles.exportButton} onClick={() => setShowExportDialog(true)}>
              📥 Export
            </button>
          </div>
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
          <span className={styles.versionBadge}>{currentVersion}</span>
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

        {/* Additional Notes Section */}
        {categoryContent[selectedCategory].notesField && (
          <div className={styles.notesSection}>
            <div className={styles.notesSectionHeader}>
              <h3 className={styles.notesSectionTitle}>Additional Notes</h3>
              {editingNotes !== selectedCategory ? (
                <button
                  className={styles.editNotesButton}
                  onClick={() => setEditingNotes(selectedCategory)}
                >
                  ✏️ {sowData[categoryContent[selectedCategory].notesField as keyof SOWData] ? 'Edit' : 'Add'} Notes
                </button>
              ) : (
                <button
                  className={styles.saveNotesButton}
                  onClick={() => setEditingNotes(null)}
                >
                  ✓ Save
                </button>
              )}
            </div>

            {editingNotes === selectedCategory ? (
              <textarea
                className={styles.notesTextarea}
                value={sowData[categoryContent[selectedCategory].notesField as keyof SOWData] as string || ''}
                onChange={(e) => handleNotesChange(categoryContent[selectedCategory].notesField as keyof SOWData, e.target.value)}
                placeholder="Add any additional notes or context for this section..."
                rows={4}
                autoFocus
              />
            ) : (
              sowData[categoryContent[selectedCategory].notesField as keyof SOWData] && (
                <div className={styles.notesDisplay}>
                  {sowData[categoryContent[selectedCategory].notesField as keyof SOWData] as string}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Right Sidebar - Versions */}
      <aside className={styles.versionSidebar}>
        <h3 className={styles.versionSidebarTitle}>Version</h3>
        <div className={styles.versionList}>
          <div className={styles.versionItem}>
            <span className={styles.versionLabel}>{currentVersion}</span>
            <span className={styles.versionDate}>Current</span>
          </div>
        </div>
      </aside>
    </div>
    </>
  );
}
