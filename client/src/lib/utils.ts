// Add utility functions here

export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
