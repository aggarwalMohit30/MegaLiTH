
export function generateCode(): string {
  let code = '';
  
  // Keep generating until we have 6 characters
  while (code.length < 6) {
    const randomPart = Math.random().toString(36).slice(2).toUpperCase();
    code += randomPart;
  }
  
  // Return exactly 6 characters
  return code.slice(0, 6);
}

/**
 * Alternative implementation using character array (more reliable)
 */
export function generateCodeAlt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Validates if a referral code has valid format
 */
export function isValidReferralCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // Must be exactly 6 characters, alphanumeric only
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code.toUpperCase());
}