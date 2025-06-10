// modules/variable-fonts/lib/fallback-metrics.ts
import type { FallbackFontMetrics } from "../types";

/**
 * Pre-calculated fallback font metrics for common fonts
 *
 * These metrics are used to create adjusted fallback fonts that closely match
 * the dimensions of the web fonts they're replacing. This minimizes layout
 * shift (CLS - Cumulative Layout Shift) when web fonts load.
 *
 * How these metrics work:
 *
 * 1. size-adjust: Scales the fallback font to match the web font's overall size
 * 2. ascent-override: Adjusts the space above the baseline
 * 3. descent-override: Adjusts the space below the baseline
 * 4. line-gap-override: Adjusts the space between lines
 *
 * These values were calculated by analyzing the font metrics of popular
 * fonts and their best fallback matches. The goal is to make the fallback
 * font occupy the same space as the web font.
 */
export const fallbackMetrics: Record<string, FallbackFontMetrics> = {
  // Sans-serif fonts
  Montserrat: {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "106.25%",
    ascentOverride: "95%",
    descentOverride: "23%",
    lineGapOverride: "0%",
  },

  "Montserrat Variable": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "106.25%",
    ascentOverride: "95%",
    descentOverride: "23%",
    lineGapOverride: "0%",
  },

  Inter: {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "107.5%",
    ascentOverride: "90%",
    descentOverride: "22.5%",
    lineGapOverride: "0%",
  },

  "Inter Variable": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "107.5%",
    ascentOverride: "90%",
    descentOverride: "22.5%",
    lineGapOverride: "0%",
  },

  Roboto: {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "100.3%",
    ascentOverride: "92.7%",
    descentOverride: "24.4%",
    lineGapOverride: "0%",
  },

  "Open Sans": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "104.5%",
    ascentOverride: "93%",
    descentOverride: "24.3%",
    lineGapOverride: "0%",
  },

  "Open Sans Variable": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "104.5%",
    ascentOverride: "93%",
    descentOverride: "24.3%",
    lineGapOverride: "0%",
  },

  Raleway: {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "105.2%",
    ascentOverride: "94.2%",
    descentOverride: "23.1%",
    lineGapOverride: "0%",
  },

  "Raleway Variable": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "105.2%",
    ascentOverride: "94.2%",
    descentOverride: "23.1%",
    lineGapOverride: "0%",
  },

  Poppins: {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "111.5%",
    ascentOverride: "91%",
    descentOverride: "21.5%",
    lineGapOverride: "0%",
  },

  "Source Sans Pro": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "101.2%",
    ascentOverride: "91.8%",
    descentOverride: "23.8%",
    lineGapOverride: "0%",
  },

  "Source Sans 3": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "101.2%",
    ascentOverride: "91.8%",
    descentOverride: "23.8%",
    lineGapOverride: "0%",
  },

  "Source Sans 3 Variable": {
    fallback: "Arial, Helvetica Neue, Helvetica, sans-serif",
    sizeAdjust: "101.2%",
    ascentOverride: "91.8%",
    descentOverride: "23.8%",
    lineGapOverride: "0%",
  },

  // Serif fonts
  Lora: {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "97.5%",
    ascentOverride: "93%",
    descentOverride: "25%",
    lineGapOverride: "0%",
  },

  "Lora Variable": {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "97.5%",
    ascentOverride: "93%",
    descentOverride: "25%",
    lineGapOverride: "0%",
  },

  Merriweather: {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "92.3%",
    ascentOverride: "96.5%",
    descentOverride: "26.8%",
    lineGapOverride: "0%",
  },

  "Playfair Display": {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "108.7%",
    ascentOverride: "88%",
    descentOverride: "22%",
    lineGapOverride: "0%",
  },

  "Playfair Display Variable": {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "108.7%",
    ascentOverride: "88%",
    descentOverride: "22%",
    lineGapOverride: "0%",
  },

  "PT Serif": {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "98.6%",
    ascentOverride: "91.5%",
    descentOverride: "24.5%",
    lineGapOverride: "0%",
  },

  "Noto Serif": {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "101.1%",
    ascentOverride: "91%",
    descentOverride: "24%",
    lineGapOverride: "0%",
  },

  "Crimson Text": {
    fallback: "Georgia, Times New Roman, Times, serif",
    sizeAdjust: "93.8%",
    ascentOverride: "94.5%",
    descentOverride: "26.2%",
    lineGapOverride: "0%",
  },

  // Monospace fonts
  "Fira Code": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "97.5%",
    ascentOverride: "95%",
    descentOverride: "24%",
    lineGapOverride: "0%",
  },

  "Fira Code Variable": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "97.5%",
    ascentOverride: "95%",
    descentOverride: "24%",
    lineGapOverride: "0%",
  },

  "JetBrains Mono": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "95.3%",
    ascentOverride: "96.8%",
    descentOverride: "25.2%",
    lineGapOverride: "0%",
  },

  "JetBrains Mono Variable": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "95.3%",
    ascentOverride: "96.8%",
    descentOverride: "25.2%",
    lineGapOverride: "0%",
  },

  "Source Code Pro": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "96.8%",
    ascentOverride: "94.2%",
    descentOverride: "24.8%",
    lineGapOverride: "0%",
  },

  "Source Code Variable": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "96.8%",
    ascentOverride: "94.2%",
    descentOverride: "24.8%",
    lineGapOverride: "0%",
  },

  "Roboto Mono": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "99.2%",
    ascentOverride: "93.5%",
    descentOverride: "24.5%",
    lineGapOverride: "0%",
  },

  "IBM Plex Mono": {
    fallback: "Courier New, Courier, monospace",
    sizeAdjust: "98.5%",
    ascentOverride: "94%",
    descentOverride: "25%",
    lineGapOverride: "0%",
  },

  // Display & decorative fonts
  "Bebas Neue": {
    fallback: "Arial Narrow, Arial, sans-serif",
    sizeAdjust: "119.5%",
    ascentOverride: "82%",
    descentOverride: "16%",
    lineGapOverride: "0%",
  },

  Oswald: {
    fallback: "Arial Narrow, Arial, sans-serif",
    sizeAdjust: "105.8%",
    ascentOverride: "92.5%",
    descentOverride: "20.5%",
    lineGapOverride: "0%",
  },

  "Oswald Variable": {
    fallback: "Arial Narrow, Arial, sans-serif",
    sizeAdjust: "105.8%",
    ascentOverride: "92.5%",
    descentOverride: "20.5%",
    lineGapOverride: "0%",
  },

  // System UI fonts
  "DM Sans": {
    fallback: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
    sizeAdjust: "102.3%",
    ascentOverride: "92%",
    descentOverride: "24%",
    lineGapOverride: "0%",
  },

  "DM Sans Variable": {
    fallback: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
    sizeAdjust: "102.3%",
    ascentOverride: "92%",
    descentOverride: "24%",
    lineGapOverride: "0%",
  },

  "Work Sans": {
    fallback: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
    sizeAdjust: "103.8%",
    ascentOverride: "91.5%",
    descentOverride: "23.5%",
    lineGapOverride: "0%",
  },

  "Work Sans Variable": {
    fallback: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
    sizeAdjust: "103.8%",
    ascentOverride: "91.5%",
    descentOverride: "23.5%",
    lineGapOverride: "0%",
  },

  // Icon fonts (special handling - no size adjustment needed)
  "Material Icons": {
    fallback: "sans-serif",
    sizeAdjust: "100%",
    ascentOverride: "normal",
    descentOverride: "normal",
    lineGapOverride: "normal",
  },

  "Material Icons Rounded": {
    fallback: "sans-serif",
    sizeAdjust: "100%",
    ascentOverride: "normal",
    descentOverride: "normal",
    lineGapOverride: "normal",
  },

  "Material Symbols Rounded": {
    fallback: "sans-serif",
    sizeAdjust: "100%",
    ascentOverride: "normal",
    descentOverride: "normal",
    lineGapOverride: "normal",
  },

  "Material Symbols Rounded Variable": {
    fallback: "sans-serif",
    sizeAdjust: "100%",
    ascentOverride: "normal",
    descentOverride: "normal",
    lineGapOverride: "normal",
  },

  "Font Awesome": {
    fallback: "sans-serif",
    sizeAdjust: "100%",
    ascentOverride: "normal",
    descentOverride: "normal",
    lineGapOverride: "normal",
  },
};

/**
 * Get fallback metrics for a font, with intelligent defaults
 *
 * This function attempts to find the best fallback metrics for a given font.
 * If exact metrics aren't available, it provides sensible defaults based on
 * the font category (serif, sans-serif, monospace, etc.)
 */
export function getFallbackMetricsForFont(fontFamily: string, customFallback?: string): FallbackFontMetrics {
  // First, try exact match
  if (fallbackMetrics[fontFamily]) {
    return customFallback ? { ...fallbackMetrics[fontFamily], fallback: customFallback } : fallbackMetrics[fontFamily];
  }

  // Try without "Variable" suffix
  const baseFamily = fontFamily.replace(" Variable", "");
  if (fallbackMetrics[baseFamily]) {
    return customFallback ? { ...fallbackMetrics[baseFamily], fallback: customFallback } : fallbackMetrics[baseFamily];
  }

  // Determine font category and provide intelligent defaults
  const lowerFamily = fontFamily.toLowerCase();

  if (lowerFamily.includes("mono") || lowerFamily.includes("code")) {
    return {
      fallback: customFallback || "Courier New, Courier, monospace",
      sizeAdjust: "98%",
      ascentOverride: "94%",
      descentOverride: "25%",
      lineGapOverride: "0%",
    };
  }

  if (lowerFamily.includes("serif") && !lowerFamily.includes("sans")) {
    return {
      fallback: customFallback || "Georgia, Times New Roman, Times, serif",
      sizeAdjust: "100%",
      ascentOverride: "92%",
      descentOverride: "25%",
      lineGapOverride: "0%",
    };
  }

  if (lowerFamily.includes("icon") || lowerFamily.includes("symbols")) {
    return {
      fallback: customFallback || "sans-serif",
      sizeAdjust: "100%",
      ascentOverride: "normal",
      descentOverride: "normal",
      lineGapOverride: "normal",
    };
  }

  // Default to sans-serif
  return {
    fallback: customFallback || "Arial, Helvetica, sans-serif",
    sizeAdjust: "100%",
    ascentOverride: "93%",
    descentOverride: "24%",
    lineGapOverride: "0%",
  };
}

/**
 * Calculate custom fallback metrics for a font
 *
 * This is an advanced feature that allows calculating precise fallback
 * metrics based on actual font metrics data. This would typically be
 * used during build time to generate optimal fallback configurations.
 */
export function calculateFallbackMetrics(
  webFontMetrics: {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
  },
  fallbackFontMetrics: {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
  }
): FallbackFontMetrics {
  // Calculate size adjustment
  const sizeAdjust = (fallbackFontMetrics.unitsPerEm / webFontMetrics.unitsPerEm) * 100;

  // Calculate override percentages
  const ascentOverride = (webFontMetrics.ascent / webFontMetrics.unitsPerEm) * 100;
  const descentOverride = Math.abs(webFontMetrics.descent / webFontMetrics.unitsPerEm) * 100;
  const lineGapOverride = (webFontMetrics.lineGap / webFontMetrics.unitsPerEm) * 100;

  return {
    fallback: "serif", // This should be determined separately
    sizeAdjust: `${sizeAdjust.toFixed(1)}%`,
    ascentOverride: `${ascentOverride.toFixed(1)}%`,
    descentOverride: `${descentOverride.toFixed(1)}%`,
    lineGapOverride: `${lineGapOverride.toFixed(1)}%`,
  };
}
