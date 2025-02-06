/**
 * Utility functions for Connect
 */

export function formatConnect(value: string): string {
  return value.toUpperCase();
}

export function validateConnect(value: string): boolean {
  return value.length > 0;
}

export default {
  formatConnect,
  validateConnect
};
