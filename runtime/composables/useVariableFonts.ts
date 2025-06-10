// modules/variable-fonts/runtime/composables/useVariableFonts.ts
import { useNuxtApp, useState } from "#app";
import type { Ref } from "vue";

/**
 * Font variation axis configuration
 */
export interface FontVariationAxis {
  tag: string;
  min: number;
  max: number;
  default: number;
  current?: number;
}

/**
 * Font configuration for applying to elements
 */
export interface FontApplicationConfig {
  family: string;
  weight?: number | string;
  style?: "normal" | "italic";
  size?: string | number;
  variationSettings?: Record<string, number>;
  fallback?: boolean;
}

/**
 * Font family information
 */
export interface FontFamilyInfo {
  name: string;
  cssVariable: string;
  isVariable: boolean;
  axes?: Record<string, FontVariationAxis>;
  weights?: number[];
  styles?: string[];
  hasItalic?: boolean;
}

/**
 * Composable return type
 */
export interface UseVariableFontsReturn {
  families: Ref<FontFamilyInfo[]>;
  currentFont: Ref<FontFamilyInfo | null>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;

  // Methods
  getFamily: (name: string) => FontFamilyInfo | undefined;
  getVariable: (family: string) => string;
  applyFont: (element: HTMLElement | null, config: FontApplicationConfig) => void;
  preloadFont: (family: string) => Promise<void>;
  measureText: (text: string, config: FontApplicationConfig) => { width: number; height: number };
  animateWeight: (element: HTMLElement, from: number, to: number, duration?: number) => Promise<void>;
  createFontStack: (families: string[]) => string;
}

/**
 * Main composable for working with variable fonts
 *
 * This composable provides a comprehensive API for:
 * - Accessing font information
 * - Applying fonts to elements
 * - Preloading fonts
 * - Animating variable font properties
 * - Measuring text dimensions
 */
export function useVariableFonts(): UseVariableFontsReturn {
  const nuxtApp = useNuxtApp();

  // Initialize state
  const families = useState<FontFamilyInfo[]>("variable-fonts:families", () => []);
  const currentFont = useState<FontFamilyInfo | null>("variable-fonts:current", () => null);
  const isLoading = useState<boolean>("variable-fonts:loading", () => false);
  const error = useState<Error | null>("variable-fonts:error", () => null);

  // Initialize font data from runtime config
  if (families.value.length === 0 && nuxtApp.$fonts) {
    families.value = nuxtApp.$fonts.families.map((family: any) => ({
      name: family.name,
      cssVariable: family.cssVariable,
      isVariable: family.isVariable,
      axes: family.axes,
      weights: family.weights,
      styles: family.styles,
      hasItalic: family.styles?.includes("italic"),
    }));
  }

  /**
   * Get information about a specific font family
   */
  const getFamily = (name: string): FontFamilyInfo | undefined => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, "-");
    return families.value.find((f) => f.name.toLowerCase().replace(/\s+/g, "-") === normalizedName);
  };

  /**
   * Get the CSS variable name for a font family
   */
  const getVariable = (family: string): string => {
    const fontInfo = getFamily(family);
    return fontInfo?.cssVariable || `--font-${family.toLowerCase().replace(/\s+/g, "-")}`;
  };

  /**
   * Apply font configuration to an HTML element
   */
  const applyFont = (element: HTMLElement | null, config: FontApplicationConfig): void => {
    if (!element) return;

    const fontInfo = getFamily(config.family);
    if (!fontInfo) {
      console.warn(`Font family "${config.family}" not found`);
      return;
    }

    // Set font family using CSS variable
    element.style.fontFamily = `var(${fontInfo.cssVariable})`;

    // Set weight
    if (config.weight !== undefined) {
      element.style.fontWeight = String(config.weight);
    }

    // Set style
    if (config.style) {
      element.style.fontStyle = config.style;
    }

    // Set size
    if (config.size !== undefined) {
      element.style.fontSize = typeof config.size === "number" ? `${config.size}px` : config.size;
    }

    // Apply variation settings for variable fonts
    if (fontInfo.isVariable && config.variationSettings) {
      const settings = Object.entries(config.variationSettings)
        .map(([axis, value]) => `'${axis}' ${value}`)
        .join(", ");

      element.style.fontVariationSettings = settings;
    }

    // Update current font state
    currentFont.value = fontInfo;
  };

  /**
   * Preload a font family
   * This triggers the browser to download the font files before they're needed
   */
  const preloadFont = async (family: string): Promise<void> => {
    const fontInfo = getFamily(family);
    if (!fontInfo) {
      throw new Error(`Font family "${family}" not found`);
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Use CSS Font Loading API if available
      if ("fonts" in document) {
        // Create font face string
        const fontFaceString = fontInfo.isVariable ? `400 1em ${fontInfo.name}` : `400 1em ${fontInfo.name}`;

        await document.fonts.load(fontFaceString);

        // Also load italic variant if available
        if (fontInfo.hasItalic) {
          await document.fonts.load(`italic 400 1em ${fontInfo.name}`);
        }
      } else {
        // Fallback: Create invisible element to trigger font load
        const testElement = document.createElement("div");
        testElement.style.cssText = `
          position: absolute;
          top: -9999px;
          left: -9999px;
          visibility: hidden;
          font-family: var(${fontInfo.cssVariable});
          font-size: 100px;
        `;
        testElement.textContent = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        document.body.appendChild(testElement);

        // Wait a bit for font to load
        await new Promise((resolve) => setTimeout(resolve, 100));

        document.body.removeChild(testElement);
      }
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Measure text dimensions with specific font configuration
   * Useful for dynamic layouts and animations
   */
  const measureText = (text: string, config: FontApplicationConfig): { width: number; height: number } => {
    // Create temporary canvas for measurement
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return { width: 0, height: 0 };
    }

    // Build font string
    const fontInfo = getFamily(config.family);
    const fontFamily = fontInfo ? `var(${fontInfo.cssVariable})` : config.family;
    const fontSize = typeof config.size === "number" ? `${config.size}px` : config.size || "16px";
    const fontWeight = config.weight || 400;
    const fontStyle = config.style || "normal";

    // Apply font to canvas context
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;

    // Measure text
    const metrics = ctx.measureText(text);

    return {
      width: metrics.width,
      height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  };

  /**
   * Animate variable font weight
   * Creates smooth weight transitions for variable fonts
   */
  const animateWeight = async (element: HTMLElement, from: number, to: number, duration: number = 300): Promise<void> => {
    if (!element) return;

    const startTime = performance.now();
    const diff = to - from;

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easing function for smooth animation
        const eased = easeInOutCubic(progress);
        const currentWeight = from + diff * eased;

        // Apply weight
        element.style.fontWeight = String(Math.round(currentWeight));

        // For variable fonts, also update variation settings
        const currentSettings = element.style.fontVariationSettings || "";
        const newSettings = updateVariationSetting(currentSettings, "wght", currentWeight);
        if (newSettings !== currentSettings) {
          element.style.fontVariationSettings = newSettings;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  };

  /**
   * Create a font stack from multiple families
   * Useful for building fallback chains
   */
  const createFontStack = (familyNames: string[]): string => {
    return familyNames
      .map((name) => {
        const fontInfo = getFamily(name);
        return fontInfo ? `var(${fontInfo.cssVariable})` : `"${name}"`;
      })
      .join(", ");
  };

  return {
    families,
    currentFont,
    isLoading,
    error,
    getFamily,
    getVariable,
    applyFont,
    preloadFont,
    measureText,
    animateWeight,
    createFontStack,
  };
}

/**
 * Helper function for easing
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Helper function to update variation settings
 */
function updateVariationSetting(current: string, axis: string, value: number): string {
  const settings = current
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !s.includes(`'${axis}'`));

  settings.push(`'${axis}' ${value}`);

  return settings.join(", ");
}

/**
 * Additional composable for advanced font features
 */
export function useVariableFontAnimation() {
  /**
   * Animate multiple variation axes simultaneously
   */
  const animateAxes = async (
    element: HTMLElement,
    animations: Record<string, { from: number; to: number }>,
    duration: number = 300
  ): Promise<void> => {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        const settings = Object.entries(animations)
          .map(([axis, { from, to }]) => {
            const current = from + (to - from) * eased;
            return `'${axis}' ${current}`;
          })
          .join(", ");

        element.style.fontVariationSettings = settings;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  };

  /**
   * Create a reactive font size based on viewport
   */
  const useResponsiveFontSize = (
    baseSize: number,
    minSize: number,
    maxSize: number,
    minViewport: number = 320,
    maxViewport: number = 1200
  ): Ref<string> => {
    const fontSize = useState<string>("responsive-font-size", () => `${baseSize}px`);

    const updateSize = () => {
      const vw = window.innerWidth;
      const scale = (vw - minViewport) / (maxViewport - minViewport);
      const size = minSize + (maxSize - minSize) * Math.max(0, Math.min(1, scale));
      fontSize.value = `${size}px`;
    };

    if (process.client) {
      window.addEventListener("resize", updateSize);
      updateSize();
    }

    return fontSize;
  };

  return {
    animateAxes,
    useResponsiveFontSize,
  };
}
