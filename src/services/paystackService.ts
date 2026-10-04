/**
 * Official Paystack Inline JavaScript SDK (v1/inline.js)
 * Loads script from https://js.paystack.co/v1/inline.js and directly executes:
 * let handler = PaystackPop.setup({...});
 * handler.openIframe();
 */

import { PaymentDetails } from '../types/logistics';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

export const PAYSTACK_KEY_STORAGE = 'nexus_paystack_public_key_v1';
export const DEFAULT_PAYSTACK_TEST_KEY = 'pk_test_8921f048d02948e910283019842a19e8c47b1029';

// Standard FX rate for local merchant currency conversion
export const USD_TO_NGN_RATE = 1500;

export function getStoredPaystackKey(): string {
  try {
    return localStorage.getItem(PAYSTACK_KEY_STORAGE) || DEFAULT_PAYSTACK_TEST_KEY;
  } catch {
    return DEFAULT_PAYSTACK_TEST_KEY;
  }
}

export function setStoredPaystackKey(key: string): void {
  try {
    localStorage.setItem(PAYSTACK_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Failed to store Paystack public key', e);
  }
}

/**
 * Loads the external Paystack Inline JS script dynamically if not already on window
 */
export function loadPaystackInlineScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.PaystackPop) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const scriptSrc = 'https://js.paystack.co/v1/inline.js';
    const existing = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    
    if (existing) {
      if (window.PaystackPop) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(!!window.PaystackPop));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => resolve(!!window.PaystackPop);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export interface TriggerPaystackPopupParams {
  publicKey: string;
  email: string;
  amountUSD: number;
  customerName: string;
  originCity: string;
  destinationCity: string;
  serviceTierName: string;
  onSuccess: (payment: PaymentDetails) => void;
  onClose: () => void;
  onError: (errorMsg: string) => void;
}

/**
 * Instantly triggers the official native PaystackPop browser popup modal in local currency (NGN)
 * to match default merchant account currency and avoid currency restriction errors.
 */
export async function triggerPaystackNativePopup(params: TriggerPaystackPopupParams): Promise<void> {
  const loaded = await loadPaystackInlineScript();

  const Paystack = window.PaystackPop || (window as any).PaystackPop;
  if (!loaded || !Paystack) {
    params.onError(
      'Could not load Paystack Inline SDK from https://js.paystack.co/v1/inline.js. Please disable ad-blockers or check network access.'
    );
    return;
  }

  const customRef = `PSTK-AWB-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
  
  // Convert base USD tariff to local currency (NGN) in kobo (1 NGN = 100 kobo)
  const amountNGN = Math.round(params.amountUSD * USD_TO_NGN_RATE);
  const amountKobo = amountNGN * 100;

  try {
    const handler = Paystack.setup({
      key: params.publicKey.trim() || DEFAULT_PAYSTACK_TEST_KEY,
      email: params.email.trim(),
      amount: amountKobo, // Paystack requires lowest currency subunit (kobo for NGN)
      currency: 'NGN',    // Initialized in local merchant currency NGN
      ref: customRef,
      metadata: {
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: params.customerName,
          },
          {
            display_name: 'Base Tariff (USD)',
            variable_name: 'tariff_usd',
            value: `$${params.amountUSD.toFixed(2)} USD`,
          },
          {
            display_name: 'Billed Amount (NGN)',
            variable_name: 'amount_ngn',
            value: `₦${amountNGN.toLocaleString()} NGN`,
          },
          {
            display_name: 'Exchange Rate',
            variable_name: 'exchange_rate',
            value: `1 USD = ₦${USD_TO_NGN_RATE} NGN`,
          },
          {
            display_name: 'Origin Dispatch',
            variable_name: 'origin_city',
            value: params.originCity,
          },
          {
            display_name: 'Destination City',
            variable_name: 'destination_city',
            value: params.destinationCity,
          },
          {
            display_name: 'Air Cargo Tier',
            variable_name: 'service_tier',
            value: params.serviceTierName,
          },
        ],
      },
      callback: function (response: any) {
        // Native Paystack callback on approved transaction
        const ref = response.reference || response.trxref || customRef;
        const txnId = response.transaction || response.trans || `TXN_${ref}`;

        const paymentRecord: PaymentDetails = {
          gateway: 'paystack',
          method: 'card',
          reference: ref,
          transactionId: txnId,
          amountUSD: params.amountUSD,
          currency: 'NGN',
          paidAt: new Date().toISOString(),
          customerEmail: params.email,
          status: 'paid',
          channelDetails: `Official Paystack Inline SDK (Ref: ${ref} · ₦${amountNGN.toLocaleString()} NGN)`,
        };

        params.onSuccess(paymentRecord);
      },
      onClose: function () {
        params.onClose();
      },
    });

    // Execute native browser popup
    handler.openIframe();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Paystack popup failed to open';
    params.onError(msg);
  }
}
