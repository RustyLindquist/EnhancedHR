/**
 * Formats a credit value for display:
 * - Rounds to nearest 0.25 increment
 * - Shows max 2 decimal places
 * - Removes unnecessary trailing zeros (15.00 -> "15", 15.50 -> "15.5")
 */
export function formatCredits(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0';
  // Round to nearest 0.25
  const rounded = Math.round(value * 4) / 4;
  // Format with up to 2 decimal places, removing trailing zeros
  if (rounded % 1 === 0) return rounded.toString();
  // For .25, .5, .75 — use up to 2 decimal places
  const formatted = rounded.toFixed(2);
  // Remove trailing zero (e.g., "15.50" -> "15.5")
  return formatted.replace(/0$/, '');
}
