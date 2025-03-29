/**
 * Utility functions for Improve
 */

export function formatImprove(value: string): string {
  return value.toUpperCase();
}

export function validateImprove(value: string): boolean {
  return value.length > 0;
}

export default {
  formatImprove,
  validateImprove
};
