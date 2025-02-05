/**
 * Utility functions for Create
 */

export function formatCreate(value: string): string {
  return value.toUpperCase();
}

export function validateCreate(value: string): boolean {
  return value.length > 0;
}

export default {
  formatCreate,
  validateCreate
};
