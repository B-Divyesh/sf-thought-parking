export const LICENSE_KEY = 'sb_license:thought-parking';
const VERDICT_KEY = 'sb_license_verdict:thought-parking';
const DAY = 86_400_000;
const BILLING_BASE = (import.meta.env.VITE_BILLING_BASE_URL || 'https://api.sociobot.in').replace(/\/$/, '');

export const checkoutUrl = `${BILLING_BASE}/api/v1/products/thought-parking/checkout`;

interface Verdict {
  valid: boolean;
  checkedAt: number;
  reason?: string;
}

export interface LicenseState {
  hasToken: boolean;
  unlocked: boolean;
  checking: boolean;
  reason?: string;
}

function readVerdict(): Verdict | undefined {
  try {
    const raw = localStorage.getItem(VERDICT_KEY);
    return raw ? JSON.parse(raw) as Verdict : undefined;
  } catch {
    return undefined;
  }
}

export function captureLicenseFromUrl(): boolean {
  const url = new URL(location.href);
  const license = url.searchParams.get('license')?.trim();
  if (!license) return false;
  localStorage.setItem(LICENSE_KEY, license);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function getLicenseState(): LicenseState {
  const token = localStorage.getItem(LICENSE_KEY);
  const verdict = readVerdict();
  return {
    hasToken: Boolean(token),
    // A token is only an identifier, not proof of purchase. New checkout-return
    // and manually restored tokens stay locked until the billing service has
    // positively verified them. A cached positive verdict remains usable
    // offline so a temporary outage does not take paid access away.
    unlocked: Boolean(token) && verdict?.valid === true,
    checking: Boolean(token) && (!verdict || Date.now() - verdict.checkedAt >= DAY),
    reason: verdict?.reason,
  };
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token) return getLicenseState();
  const verdict = readVerdict();
  if (!force && verdict && Date.now() - verdict.checkedAt < DAY) return getLicenseState();
  try {
    const response = await fetch(`${BILLING_BASE}/api/v1/products/thought-parking/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable.');
    const result = await response.json() as { valid?: unknown; reason?: string };
    if (typeof result.valid !== 'boolean') throw new Error('Verification service returned an invalid response.');
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() }));
  } catch {
    const state = getLicenseState();
    return { ...state, checking: false, reason: 'verification_unavailable' };
  }
  return getLicenseState();
}

export function storeLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function forgetLicense(): void {
  localStorage.removeItem(LICENSE_KEY);
  localStorage.removeItem(VERDICT_KEY);
}
