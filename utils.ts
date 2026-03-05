// Escapes user input for XML text content and attribute values.
// Note: old_spa is intentionally NOT escaped in the XML generator because
// users hand-enter abbreviation XML (<choice><abbr>...</abbr></choice>) there.
export const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;');

export const generateId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback to manual ID if crypto is unavailable or fails
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};