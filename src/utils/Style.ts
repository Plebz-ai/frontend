/**
 * Utility functions for Style
 */

export function formatStyle(value: string): string {
  return value.toUpperCase();
}

export function validateStyle(value: string): boolean {
  return value.length > 0;
}

export default {
  formatStyle,
  validateStyle
};
