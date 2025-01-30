/**
 * Utility functions for Implement
 */

export function formatImplement(value: string): string {
  return value.toUpperCase();
}

export function validateImplement(value: string): boolean {
  return value.length > 0;
}

export default {
  formatImplement,
  validateImplement
};
