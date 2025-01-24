/**
 * Utility functions for Initialize
 */

export function formatInitialize(value: string): string {
  return value.toUpperCase();
}

export function validateInitialize(value: string): boolean {
  return value.length > 0;
}

export default {
  formatInitialize,
  validateInitialize
};
