/**
 * Utility functions for Design
 */

export function formatDesign(value: string): string {
  return value.toUpperCase();
}

export function validateDesign(value: string): boolean {
  return value.length > 0;
}

export default {
  formatDesign,
  validateDesign
};
