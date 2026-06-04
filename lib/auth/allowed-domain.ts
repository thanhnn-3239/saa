/**
 * Email domain allow-list for SAA sign-in.
 * Only Sun* internal accounts may authenticate.
 */
export const ALLOWED_DOMAIN = "sun-asterisk.com";

/** True only for non-empty emails ending in `@sun-asterisk.com` (case-insensitive). */
export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  const domain = `@${ALLOWED_DOMAIN}`;
  // Must have a local part (at least 1 char before @) and end with domain
  return lowerEmail.length > domain.length && lowerEmail.endsWith(domain);
}
