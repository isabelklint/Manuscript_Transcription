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