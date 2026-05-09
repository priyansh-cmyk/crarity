/**
 * Validates that a URL uses a safe protocol (http/https only)
 * Prevents javascript: or data: URL injection attacks
 */
export const isValidExternalUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Returns the URL if valid, otherwise returns undefined
 * Use this for safely rendering external links
 */
export const getSafeUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  return isValidExternalUrl(url) ? url : undefined;
};
