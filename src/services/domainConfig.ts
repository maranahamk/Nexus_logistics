/**
 * Domain & Deployment Routing Configuration
 * Configured for .run domains (e.g. nexus-logistics.run)
 * Handles incoming traffic, API endpoints, and webhook URLs
 */

export const DOMAIN_STORAGE_KEY = 'nexus_deployment_domain_v1';
export const DEFAULT_RUN_DOMAIN = 'nexus-logistics.run';

export interface DomainRoutingInfo {
  canonicalDomain: string;
  activeHost: string;
  protocol: string;
  isRunDomain: boolean;
  apiBaseUrl: string;
  healthEndpoint: string;
  trackingApiEndpoint: string;
  paystackWebhookUrl: string;
  supportedSubdomains: {
    api: string;
    tracking: string;
    webhooks: string;
  };
}

/**
 * Returns the configured deployment domain, prioritizing stored settings or default nexus-logistics.run
 */
export function getConfiguredDomain(): string {
  if (typeof window === 'undefined') return DEFAULT_RUN_DOMAIN;
  try {
    const saved = localStorage.getItem(DOMAIN_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // fallback
  }

  // If running on a live cloud domain, detect it or default to nexus-logistics.run
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.host;
    if (host && (host.includes('.run') || host.includes('.run.app'))) {
      return host;
    }
  }

  return DEFAULT_RUN_DOMAIN;
}

/**
 * Persists a customized .run domain or vanity routing
 */
export function setConfiguredDomain(domain: string): void {
  try {
    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    localStorage.setItem(DOMAIN_STORAGE_KEY, clean);
  } catch (e) {
    console.error('Failed to save deployment domain', e);
  }
}

/**
 * Resets the deployment domain back to the default nexus-logistics.run
 */
export function resetConfiguredDomain(): void {
  try {
    localStorage.removeItem(DOMAIN_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset deployment domain', e);
  }
}

/**
 * Generates comprehensive routing endpoints for the current .run deployment
 */
export function getDomainRoutingInfo(): DomainRoutingInfo {
  const domain = getConfiguredDomain();
  const protocol = typeof window !== 'undefined' && window.location?.protocol ? window.location.protocol.replace(':', '') : 'https';
  const activeHost = typeof window !== 'undefined' && window.location?.host ? window.location.host : domain;

  const isRunDomain = domain.endsWith('.run') || domain.includes('.run.') || domain.includes('.run.app');

  const origin = `${protocol}://${domain}`;

  return {
    canonicalDomain: domain,
    activeHost,
    protocol,
    isRunDomain,
    apiBaseUrl: `${origin}/api`,
    healthEndpoint: `${origin}/api/health`,
    trackingApiEndpoint: `${origin}/api/shipments`,
    paystackWebhookUrl: `${origin}/api/webhooks/paystack`,
    supportedSubdomains: {
      api: `api.${domain}`,
      tracking: `tracking.${domain}`,
      webhooks: `webhooks.${domain}`,
    },
  };
}

/**
 * Pings the backend health endpoint to verify active routing
 */
export async function verifyDomainHealth(): Promise<{
  success: boolean;
  latencyMs: number;
  data?: any;
  error?: string;
}> {
  const start = performance.now();
  try {
    const res = await fetch('/api/health');
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) {
      return { success: false, latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = await res.json();
    return { success: true, latencyMs, data };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs,
      error: err instanceof Error ? err.message : 'Routing check failed',
    };
  }
}
