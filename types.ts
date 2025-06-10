// modules/variable-fonts/types.ts
export interface FontConfig {
  /**
   * NPM package name (e.g., '@fontsource-variable/montserrat')
   */
  package: string;

  /**
   * Font family name as it will be used in CSS
   */
  family: string;

  /**
   * Whether this is a variable font
   */
  variable: boolean;

  /**
   * Whether to preload this font for critical rendering path
   */
  preload?: boolean;

  /**
   * Font weights to include (for static fonts) or support (for variable fonts)
   */
  weights?: number[];

  /**
   * Font styles to include
   */
  styles?: ("normal" | "italic")[];

  /**
   * Character subsets to include
   */
  subsets?: string[];

  /**
   * Variable font axes to include
   */
  axes?: string[];

  /**
   * Custom fallback fonts
   */
  fallback?: string;

  /**
   * Font display strategy
   */
  display?: "auto" | "block" | "swap" | "fallback" | "optional";

  /**
   * Custom unicode ranges per subset
   */
  unicodeRanges?: Record<string, string>;

  /**
   * Font loading priority (higher = loaded first)
   */
  priority?: number;
}

export interface ModuleOptions {
  /**
   * Array of font configurations
   */
  fonts: FontConfig[];

  /**
   * Output directory for font files (relative to project root)
   */
  outputDir?: string;

  /**
   * Path for generated CSS file (relative to project root)
   */
  cssPath?: string;

  /**
   * Enable caching to avoid regenerating unchanged fonts
   */
  caching?: boolean;

  /**
   * Cache time-to-live in milliseconds
   */
  cacheTTL?: number;

  /**
   * Generate documentation file
   */
  generateDocs?: boolean;

  /**
   * Path for documentation file
   */
  docsPath?: string;

  /**
   * Add preconnect hints for font loading
   */
  preconnect?: boolean;

  /**
   * Crossorigin attribute for font loading
   */
  crossorigin?: "anonymous" | "use-credentials";

  /**
   * Default font-display value
   */
  display?: "auto" | "block" | "swap" | "fallback" | "optional";

  /**
   * Generate fallback fonts with adjusted metrics
   */
  fallbacks?: boolean;

  /**
   * Generate CSS custom properties
   */
  customProperties?: boolean;

  /**
   * Generate utility classes (e.g., for Material Symbols)
   */
  utilities?: boolean;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;
}

export interface FontVariation {
  axes: Record<
    string,
    {
      min: number;
      max: number;
      default: number;
    }
  >;
  instances?: Record<string, Record<string, number>>;
}

export interface FontMetadata {
  family: string;
  id: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  variable?: FontVariation;
  unicodeRange?: Record<string, string>;
  category?: string;
  lastModified?: string;
  version?: string;
}

export interface FontFile {
  path: string;
  fileName: string;
  subset: string;
  style: string;
  weight?: number;
  variable: boolean;
  url?: string;
  hash?: string;
  size?: number;
}

export interface ProcessedFont {
  config: FontConfig;
  metadata: FontMetadata;
  files: FontFile[];
  errors?: string[];
}

export interface CacheEntry {
  timestamp: number;
  configHash: string;
  fonts: ProcessedFont[];
  version: string;
}

export interface FontMetrics {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  capHeight?: number;
  xHeight?: number;
}

export interface FallbackFontMetrics {
  fallback: string;
  sizeAdjust: string;
  ascentOverride: string;
  descentOverride: string;
  lineGapOverride: string;
}
