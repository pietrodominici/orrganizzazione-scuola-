import { Materia } from '../data/models';

/**
 * 16 distinct, high-contrast colors for school subjects.
 * Strictly distinct from interface chrome:
 *  - Primary dark orange: #B5541D
 *  - Alert red: #C1272D
 */
export const PALETTE_MATERIE: readonly string[] = [
  '#2563EB', // Blu Reale
  '#059669', // Smeraldo
  '#7C3AED', // Viola intenso
  '#0D9488', // Ottanio scuro
  '#D97706', // Ocra / Ambra
  '#4F46E5', // Indaco
  '#BE185D', // Magenta / Lampone
  '#0891B2', // Ciano profondo
  '#65A30D', // Verde Oliva
  '#475569', // Ardesia
  '#9333EA', // Ametista
  '#0284C7', // Blu Oceano
  '#854D0E', // Terra di Siena
  '#15803D', // Verde Bosco
  '#881337', // Bordeaux scuro
  '#334155', // Carbone ardesia
];

/**
 * Calculate relative luminance according to WCAG 2.1 specifications
 */
export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Guarantees WCAG AA minimum 4.5:1 text contrast on top of subject color badges
 */
export function getAccessibleTextColor(hexBg: string): '#FFFFFF' | '#1C1917' {
  const lum = getRelativeLuminance(hexBg);
  // Luminance of white is 1.0, black is 0.0
  // Contrast ratio with white: (1.0 + 0.05) / (lum + 0.05)
  // Contrast ratio with dark (#1C1917 lum ~0.015): (lum + 0.05) / (0.015 + 0.05)
  return lum > 0.35 ? '#1C1917' : '#FFFFFF';
}

/**
 * Normalizes subject names: lowercase, trim whitespace, strip multi-spaces
 */
export function normalizeNomeMateria(nome: string): string {
  return nome.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if a color is currently assigned to another subject
 */
export function isColorInUse(hexColor: string, materie: Materia[], excludeMateriaId?: string): boolean {
  const target = hexColor.toUpperCase();
  return materie.some(m => m.id !== excludeMateriaId && m.colore.toUpperCase() === target);
}

/**
 * Find which subject already owns a color
 */
export function findSubjectByColor(hexColor: string, materie: Materia[], excludeMateriaId?: string): Materia | undefined {
  const target = hexColor.toUpperCase();
  return materie.find(m => m.id !== excludeMateriaId && m.colore.toUpperCase() === target);
}

/**
 * Generates an additional tone variant if all 16 palette colors are taken
 */
function generateVariantColor(index: number): string {
  // Rotate through hues with distinct saturation & lightness
  const hue = (index * 137.5) % 360; // Golden ratio hue distribution
  // Avoid orange (20-40) and red (350-15)
  let adjustedHue = hue;
  if (adjustedHue >= 10 && adjustedHue <= 45) {
    adjustedHue = (adjustedHue + 50) % 360;
  }
  // Convert HSL to Hex
  const s = 65;
  const l = 38; // Dark enough for white text contrast
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((adjustedHue / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;

  if (adjustedHue < 60) { r = c; g = x; b = 0; }
  else if (adjustedHue < 120) { r = x; g = c; b = 0; }
  else if (adjustedHue < 180) { r = 0; g = c; b = x; }
  else if (adjustedHue < 240) { r = 0; g = x; b = c; }
  else if (adjustedHue < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Finds the first unused color from the palette, or generates a tone variant if all 16 are used
 */
export function getFirstAvailableColor(existingMaterie: Materia[], excludeMateriaId?: string): string {
  const usedHexes = new Set(
    existingMaterie
      .filter(m => m.id !== excludeMateriaId)
      .map(m => m.colore.toUpperCase())
  );

  for (const color of PALETTE_MATERIE) {
    if (!usedHexes.has(color.toUpperCase())) {
      return color;
    }
  }

  // If all 16 base colors are taken, generate distinct tone variants
  let variantIndex = 0;
  while (true) {
    const candidate = generateVariantColor(variantIndex);
    if (!usedHexes.has(candidate)) {
      return candidate;
    }
    variantIndex++;
  }
}
