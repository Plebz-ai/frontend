/**
 * Utility functions for Setup
 */

export function formatSetup(value: string): string {
  return value.toUpperCase();
}

export function validateSetup(value: string): boolean {
  return value.length > 0;
}

export default {
  formatSetup,
  validateSetup
};
