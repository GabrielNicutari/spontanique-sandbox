/**
 * Image utility functions for UI components
 * Handles image fallbacks, hash-based color generation, etc.
 */

/**
 * Simple hash function to convert a string to a 32-bit integer
 * Used for generating consistent colors from IDs
 *
 * @param str - The string to hash (typically an event ID)
 * @returns A 32-bit integer hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Generates a consistent CSS gradient background from a string ID
 * Uses hash-based color generation to ensure the same ID always produces
 * the same gradient, providing visual consistency across page loads
 *
 * @param id - Unique identifier (e.g., event ID, user ID)
 * @returns CSS linear-gradient string with HSL colors
 *
 * @example
 * ```tsx
 * <div style={{ background: getGradientFromId('123') }}>
 *   Fallback content
 * </div>
 * ```
 */
export function getGradientFromId(id: string): string {
  const hash = hashString(id);

  // Generate HSL colors for vibrant, professional-looking gradients
  const hue1 = Math.abs(hash % 360); // Primary hue (0-360 degrees)
  const hue2 = (hue1 + 60) % 360; // Complementary hue (60° shift)
  const saturation = 65; // 65% saturation - vibrant but not garish
  const lightness1 = 55; // Lighter shade
  const lightness2 = 45; // Slightly darker shade for depth

  return `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness1}%), hsl(${hue2}, ${saturation}%, ${lightness2}%))`;
}
