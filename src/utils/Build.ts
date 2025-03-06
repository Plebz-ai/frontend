/**
 * Utility functions for Build
 */

export function formatBuild(value: string): string {
  return value.toUpperCase();
}

export function validateBuild(value: string): boolean {
  return value.length > 0;
}

export default {
  formatBuild,
  validateBuild
};
