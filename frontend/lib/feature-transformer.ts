/**
 * Feature Transformer
 * Converts customer attributes to 30-feature format expected by the ML API
 * 
 * Standard transformation:
 * - Numerical features: age, tenure, monthly_charges, total_charges (4 features)
 * - One-hot encoded categorical features: contract_type, internet_service, etc. (26 features)
 * 
 * This assumes typical churn prediction datasets like Telco Customer Churn
 */

export interface CustomerAttributes {
  age?: number;
  tenure?: number;
  monthly_charges?: number;
  total_charges?: number;
  contract_type?: 'month-to-month' | 'one_year' | 'two_year';
  internet_service?: 'DSL' | 'Fiber' | 'Cable' | 'No';
  online_security?: boolean;
  online_backup?: boolean;
  device_protection?: boolean;
  tech_support?: boolean;
  streaming_tv?: boolean;
  streaming_movies?: boolean;
  phone_service?: boolean;
  paperless_billing?: boolean;
  payment_method?: 'electronic_check' | 'mailed_check' | 'bank_transfer' | 'credit_card';
  [key: string]: any;
}

/**
 * Transform customer attributes to 30-feature array
 * Assumes standard one-hot encoding for categorical features
 * 
 * Feature order (30 total):
 * 0: age (normalized)
 * 1: tenure (normalized)
 * 2: monthly_charges (normalized)
 * 3: total_charges (normalized)
 * 4-6: contract_type (one-hot: month-to-month, one_year, two_year)
 * 7-9: internet_service (one-hot: DSL, Fiber, No)
 * 10-15: services (one-hot: online_security, online_backup, device_protection, tech_support, streaming_tv, streaming_movies)
 * 16-18: phone_service, paperless_billing, [reserved]
 * 19-22: payment_method (one-hot: electronic_check, mailed_check, bank_transfer, credit_card)
 * 23-29: [additional features - reserved for model compatibility]
 */
export function transformCustomerData(customer: CustomerAttributes): number[] {
  const features: number[] = new Array(30).fill(0);

  // Normalize numerical features (assuming standard ranges)
  // Normalize age (18-80)
  features[0] = customer.age ? (customer.age - 40) / 20 : 0;

  // Normalize tenure (0-72 months)
  features[1] = customer.tenure ? (customer.tenure - 30) / 20 : 0;

  // Normalize monthly charges (0-150)
  features[2] = customer.monthly_charges ? (customer.monthly_charges - 65) / 50 : 0;

  // Normalize total charges (0-9000)
  features[3] = customer.total_charges ? (customer.total_charges - 2000) / 3000 : 0;

  // One-hot encode contract_type (positions 4-6)
  // month-to-month: [1,0,0], one_year: [0,1,0], two_year: [0,0,1]
  if (customer.contract_type === 'month-to-month') {
    features[4] = 1;
  } else if (customer.contract_type === 'one_year') {
    features[5] = 1;
  } else if (customer.contract_type === 'two_year') {
    features[6] = 1;
  }

  // One-hot encode internet_service (positions 7-9)
  // DSL: [1,0,0], Fiber: [0,1,0], No: [0,0,1]
  if (customer.internet_service === 'DSL') {
    features[7] = 1;
  } else if (customer.internet_service === 'Fiber') {
    features[8] = 1;
  } else if (customer.internet_service === 'No') {
    features[9] = 1;
  }

  // Binary features: services (positions 10-15)
  features[10] = customer.online_security ? 1 : 0;
  features[11] = customer.online_backup ? 1 : 0;
  features[12] = customer.device_protection ? 1 : 0;
  features[13] = customer.tech_support ? 1 : 0;
  features[14] = customer.streaming_tv ? 1 : 0;
  features[15] = customer.streaming_movies ? 1 : 0;

  // Binary features (positions 16-18)
  features[16] = customer.phone_service ? 1 : 0;
  features[17] = customer.paperless_billing ? 1 : 0;
  features[18] = 0; // Reserved for model compatibility

  // One-hot encode payment_method (positions 19-22)
  // electronic_check: [1,0,0,0], mailed_check: [0,1,0,0], 
  // bank_transfer: [0,0,1,0], credit_card: [0,0,0,1]
  if (customer.payment_method === 'electronic_check') {
    features[19] = 1;
  } else if (customer.payment_method === 'mailed_check') {
    features[20] = 1;
  } else if (customer.payment_method === 'bank_transfer') {
    features[21] = 1;
  } else if (customer.payment_method === 'credit_card') {
    features[22] = 1;
  }

  // Fill remaining features (23-29) with 0 (model compatibility)
  // These may be used by the model or could be future features
  for (let i = 23; i < 30; i++) {
    features[i] = 0;
  }

  return features;
}

/**
 * Create 30-feature array from raw customer data
 * Useful when you don't have all attributes
 */
export function createFeatureArray(data: Partial<CustomerAttributes>): number[] {
  const attributes: CustomerAttributes = {
    age: data.age ?? 40,
    tenure: data.tenure ?? 30,
    monthly_charges: data.monthly_charges ?? 65,
    total_charges: data.total_charges ?? 2000,
    contract_type: data.contract_type ?? 'month-to-month',
    internet_service: data.internet_service ?? 'Fiber',
    online_security: data.online_security ?? false,
    online_backup: data.online_backup ?? false,
    device_protection: data.device_protection ?? false,
    tech_support: data.tech_support ?? false,
    streaming_tv: data.streaming_tv ?? false,
    streaming_movies: data.streaming_movies ?? false,
    phone_service: data.phone_service ?? false,
    paperless_billing: data.paperless_billing ?? false,
    payment_method: data.payment_method ?? 'electronic_check',
  };

  return transformCustomerData(attributes);
}

/**
 * Helper to display feature importance from model
 * Maps 30 features back to human-readable names
 */
export function getFeatureNames(): string[] {
  return [
    'Age (normalized)',
    'Tenure (months)',
    'Monthly Charges ($)',
    'Total Charges ($)',
    'Contract: Month-to-Month',
    'Contract: One Year',
    'Contract: Two Year',
    'Internet: DSL',
    'Internet: Fiber',
    'Internet: None',
    'Online Security',
    'Online Backup',
    'Device Protection',
    'Tech Support',
    'Streaming TV',
    'Streaming Movies',
    'Phone Service',
    'Paperless Billing',
    'Reserved (18)',
    'Payment: E-Check',
    'Payment: Mailed Check',
    'Payment: Bank Transfer',
    'Payment: Credit Card',
    'Reserved (23)',
    'Reserved (24)',
    'Reserved (25)',
    'Reserved (26)',
    'Reserved (27)',
    'Reserved (28)',
    'Reserved (29)',
  ];
}
