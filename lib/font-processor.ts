// modules/variable-fonts/lib/font-processor.ts
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { glob } from "glob";
import { createHash } from "crypto";
import type { ModuleOptions, FontConfig, FontMetadata, ProcessedFont, FontFile, FallbackFontMetrics } from "../types";
import { logger } from "./logger";
import { fallbackMetrics } from "./fallback-metrics";

export class FontProcessor {
  private options: ModuleOptions;
  private projectRoot: string;
  private outputDir: string;
  private processedFonts: ProcessedFont[] = [];

  constructor(options: ModuleOptions, projectRoot: string) {
    this.options = options;
    this.projectRoot = projectRoot;
    this.outputDir = join(projectRoot, options.outputDir || "public/fonts");
  }

  /**
   * Process all configured fonts
   * This is the main entry point that orchestrates the entire font processing pipeline
   */
  async processAll(): Promise<ProcessedFont[]> {
    this.processedFonts = [];

    // Sort fonts by priority if specified
    const sortedFonts = [...this.options.fonts].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const fontConfig of sortedFonts) {
      try {
        const result = await this.processFont(fontConfig);
        if (result) {
          this.processedFonts.push(result);
        }
      } catch (error) {
        logger.error(`Failed to process ${fontConfig.package}:`, error);

        // Add a failed entry so we can track what went wrong
        this.processedFonts.push({
          config: fontConfig,
          metadata: {} as FontMetadata,
          files: [],
          errors: [error instanceof Error ? error.message : String(error)],
        });
      }
    }

    return this.processedFonts;
  }

  /**
   * Process a single font package
   * This method handles the complete workflow for one font family
   */
  private async processFont(fontConfig: FontConfig): Promise<ProcessedFont | null> {
    logger.info(`Processing ${fontConfig.package}...`);

    // Locate the font package in node_modules
    const packagePath = this.resolvePackagePath(fontConfig.package);
    if (!packagePath) {
      throw new Error(`Package ${fontConfig.package} not found. ` + `Please install it with: npm install ${fontConfig.package}`);
    }

    // Read font metadata
    const metadata = this.readFontMetadata(packagePath, fontConfig);
    if (!metadata) {
      throw new Error(`No metadata found for ${fontConfig.package}`);
    }

    // Find all relevant font files based on configuration
    const fontFiles = await this.findFontFiles(packagePath, fontConfig, metadata);
    if (fontFiles.length === 0) {
      throw new Error(
        `No font files found for ${fontConfig.package} with the specified configuration. ` +
          `Check your subsets, styles, and axes settings.`
      );
    }

    // Copy font files to output directory with content-based hashing
    const copiedFiles = await this.copyFontFiles(fontFiles, metadata.family);

    logger.success(`Processed ${metadata.family}: ${copiedFiles.length} files`);

    return {
      config: fontConfig,
      metadata,
      files: copiedFiles,
      errors: [],
    };
  }

  /**
   * Resolve the actual path to a font package
   * Handles different package manager structures (npm, yarn, pnpm)
   */
  private resolvePackagePath(packageName: string): string | null {
    // Try common locations
    const possiblePaths = [
      join(this.projectRoot, "node_modules", packageName),
      join(this.projectRoot, "node_modules", ".pnpm", `${packageName}@*`, "node_modules", packageName),
      // Handle scoped packages in pnpm
      packageName.startsWith("@")
        ? join(this.projectRoot, "node_modules", ".pnpm", packageName.replace("/", "+") + "@*", "node_modules", packageName)
        : null,
    ].filter(Boolean) as string[];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }

      // Try glob pattern for pnpm
      const globPattern = path.includes("*") ? path : null;
      if (globPattern) {
        const matches = glob.sync(globPattern);
        if (matches.length > 0) {
          // Return the most recent version
          return matches.sort().pop()!;
        }
      }
    }

    return null;
  }

  /**
   * Read and parse font metadata from the package
   * Enriches metadata with additional configuration if needed
   */
  private readFontMetadata(packagePath: string, fontConfig: FontConfig): FontMetadata | null {
    const metadataPath = join(packagePath, "metadata.json");

    if (!existsSync(metadataPath)) {
      // Try alternative locations
      const altPath = join(packagePath, "font-metadata.json");
      if (existsSync(altPath)) {
        return JSON.parse(readFileSync(altPath, "utf-8"));
      }
      return null;
    }

    const metadata: FontMetadata = JSON.parse(readFileSync(metadataPath, "utf-8"));

    // Enrich metadata with config overrides
    if (fontConfig.unicodeRanges) {
      metadata.unicodeRange = {
        ...metadata.unicodeRange,
        ...fontConfig.unicodeRanges,
      };
    }

    return metadata;
  }

  /**
   * Find all font files matching the configuration
   * This handles the complex logic of matching files based on subsets, styles, weights, and axes
   */
  private async findFontFiles(packagePath: string, config: FontConfig, metadata: FontMetadata): Promise<FontFile[]> {
    const filesDir = join(packagePath, "files");
    if (!existsSync(filesDir)) {
      throw new Error(`No files directory found in ${packagePath}`);
    }

    const files: FontFile[] = [];

    // Determine which subsets and styles to include
    const subsets = config.subsets || metadata.subsets || ["latin"];
    const styles = config.styles || metadata.styles || ["normal"];
    const weights = config.weights || metadata.weights || [400];

    // Build file patterns based on font type
    const patterns = this.buildFilePatterns(config, metadata, subsets, styles, weights);

    // Find files matching patterns
    for (const pattern of patterns) {
      const globPattern = join(filesDir, pattern).replace(/\\/g, "/");
      const foundFiles = await glob(globPattern);

      for (const filePath of foundFiles) {
        const fileInfo = this.parseFileName(filePath, config);
        if (fileInfo) {
          files.push({
            ...fileInfo,
            path: filePath,
            size: statSync(filePath).size,
          });
        }
      }
    }

    // Sort files by priority: latin first, normal style first
    files.sort((a, b) => {
      if (a.subset === "latin" && b.subset !== "latin") return -1;
      if (a.subset !== "latin" && b.subset === "latin") return 1;
      if (a.style === "normal" && b.style !== "normal") return -1;
      if (a.style !== "normal" && b.style === "normal") return 1;
      return 0;
    });

    return files;
  }

  /**
   * Build glob patterns for finding font files
   * Different patterns are needed for variable vs static fonts and special cases like Material Symbols
   */
  private buildFilePatterns(config: FontConfig, metadata: FontMetadata, subsets: string[], styles: string[], weights: number[]): string[] {
    const patterns: string[] = [];

    if (config.variable) {
      // Variable font patterns
      const axes = config.axes || ["wght"];

      // Special handling for Material Symbols
      if (config.package.includes("material-symbols")) {
        // Material Symbols uses a different naming convention
        for (const subset of subsets) {
          for (const style of styles) {
            patterns.push(`*-${subset}-full-${style}.woff2`);
            patterns.push(`*-${subset}[*]-${style}.woff2`); // Fallback pattern
          }
        }
      } else {
        // Standard variable font pattern
        const axesPattern = axes.join("-");
        for (const subset of subsets) {
          for (const style of styles) {
            patterns.push(`*-${subset}-${axesPattern}-${style}.woff2`);
            // Also try individual axis patterns
            for (const axis of axes) {
              patterns.push(`*-${subset}-${axis}-${style}.woff2`);
            }
          }
        }
      }
    } else {
      // Static font patterns
      for (const subset of subsets) {
        for (const style of styles) {
          for (const weight of weights) {
            patterns.push(`*-${subset}-${weight}-${style}.woff2`);
          }
          // Also include generic pattern
          patterns.push(`*-${subset}-*-${style}.woff2`);
        }
      }
    }

    // Always include woff2 as primary format, but also check for woff
    const woffPatterns = patterns.map((p) => p.replace(".woff2", ".woff"));

    return [...patterns, ...woffPatterns];
  }

  /**
   * Parse font file name to extract metadata
   * Font file names follow a specific convention that we need to decode
   */
  private parseFileName(filePath: string, config: FontConfig): Partial<FontFile> | null {
    const fileName = basename(filePath);
    const ext = extname(fileName);

    if (![".woff", ".woff2"].includes(ext)) {
      return null;
    }

    // Remove extension and split by hyphens
    const parts = fileName.slice(0, -ext.length).split("-");

    if (parts.length < 3) {
      return null;
    }

    // For most fonts: [family]-[subset]-[weight/axes]-[style]
    // For Material Symbols: [family]-[subset]-[full/axes]-[style]

    const style = parts[parts.length - 1] as "normal" | "italic";
    const subset = parts[parts.length - 3];

    let weight: number | undefined;
    if (!config.variable) {
      // Try to parse weight from the parts
      const weightPart = parts[parts.length - 2];
      const parsedWeight = parseInt(weightPart, 10);
      if (!isNaN(parsedWeight)) {
        weight = parsedWeight;
      }
    }

    return {
      fileName,
      subset,
      style,
      weight,
      variable: config.variable,
    };
  }

  /**
   * Copy font files to the output directory with content-based hashing
   * This ensures cache busting when fonts change
   */
  private async copyFontFiles(files: FontFile[], family: string): Promise<FontFile[]> {
    const copiedFiles: FontFile[] = [];

    for (const file of files) {
      // Read file content
      const content = readFileSync(file.path);

      // Generate hash from content
      const hash = createHash("md5").update(content).digest("hex").substring(0, 8);

      // Create hashed filename
      const safeFamilyName = family.toLowerCase().replace(/\s+/g, "-");
      const hashedName = `${safeFamilyName}-${file.subset}-${file.style}-${hash}${extname(file.fileName)}`;

      // Copy file
      const destPath = join(this.outputDir, hashedName);
      copyFileSync(file.path, destPath);

      // Update file info with URL and hash
      copiedFiles.push({
        ...file,
        url: `/fonts/${hashedName}`,
        hash,
      });
    }

    return copiedFiles;
  }

  /**
   * Generate complete CSS with all font faces and utilities
   */
  generateCSS(results: ProcessedFont[]): string {
    const sections: string[] = [
      this.generateHeader(),
      this.generateFontFaces(results),
      this.options.customProperties ? this.generateCustomProperties(results) : "",
      this.options.utilities ? this.generateUtilities(results) : "",
      this.generatePerformanceHints(),
    ];

    return sections.filter(Boolean).join("\n");
  }

  private generateHeader(): string {
    return `/* Generated by Nuxt Variable Fonts Module */
/* Do not edit this file directly - it will be overwritten */
/* Generated at: ${new Date().toISOString()} */

`;
  }

  /**
   * Generate @font-face declarations for all fonts
   */
  private generateFontFaces(results: ProcessedFont[]): string {
    let css = "";

    for (const font of results) {
      if (font.errors && font.errors.length > 0) {
        css += `/* Error processing ${font.config.family}: ${font.errors.join(", ")} */\n\n`;
        continue;
      }

      css += `/* ${font.metadata.family} - ${font.config.package} */\n`;

      // Generate @font-face for each file
      for (const file of font.files) {
        css += this.generateSingleFontFace(font, file);
      }

      // Generate fallback font if enabled and font is variable
      if (this.options.fallbacks && font.config.variable) {
        css += this.generateFallbackFont(font);
      }

      css += "\n";
    }

    return css;
  }

  /**
   * Generate a single @font-face declaration
   */
  private generateSingleFontFace(font: ProcessedFont, file: FontFile): string {
    const { config, metadata } = font;
    const display = config.display || this.options.display || "swap";
    const isIcon = config.package.includes("icon") || config.package.includes("symbols");

    let css = "@font-face {\n";
    css += `  font-family: '${metadata.family}';\n`;
    css += `  font-style: ${file.style};\n`;
    css += `  font-display: ${isIcon ? "block" : display};\n`;

    // Handle font-weight
    if (config.variable && metadata.variable?.axes?.wght) {
      const { min, max } = metadata.variable.axes.wght;
      css += `  font-weight: ${min} ${max};\n`;
    } else if (file.weight) {
      css += `  font-weight: ${file.weight};\n`;
    } else {
      css += `  font-weight: 400;\n`;
    }

    // Source with format hints
    const format = file.fileName.endsWith(".woff2") ? "woff2" : "woff";
    const formatHint = config.variable ? `${format}-variations` : format;

    css += `  src: url('${file.url}') format('${formatHint}');\n`;

    // Unicode range
    const unicodeRange = this.getUnicodeRange(metadata, file.subset);
    if (unicodeRange) {
      css += `  unicode-range: ${unicodeRange};\n`;
    }

    css += "}\n\n";

    return css;
  }

  /**
   * Get unicode range for a specific subset
   */
  private getUnicodeRange(metadata: FontMetadata, subset: string): string | null {
    // First check if metadata has specific ranges
    if (metadata.unicodeRange?.[subset]) {
      return metadata.unicodeRange[subset];
    }

    // Use predefined ranges
    const ranges: Record<string, string> = {
      latin:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
      "latin-ext":
        "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
      cyrillic: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
      "cyrillic-ext": "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
      greek: "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF",
      "greek-ext": "U+1F00-1FFF",
      vietnamese:
        "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
      arabic: "U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC",
      hebrew: "U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F",
      thai: "U+0E01-0E5B, U+200C-200D, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026, U+2039-203A, U+2060, U+2066-2069, U+207F, U+20A8, U+2219, U+25CC",
    };

    return ranges[subset] || null;
  }

  /**
   * Generate fallback font with adjusted metrics
   */
  private generateFallbackFont(font: ProcessedFont): string {
    const metrics = this.getFallbackMetrics(font.metadata.family, font.config.fallback);

    let css = `/* Fallback font for ${font.metadata.family} */\n`;
    css += "@font-face {\n";
    css += `  font-family: '${font.metadata.family} Fallback';\n`;
    css += `  src: local('${metrics.fallback}');\n`;
    css += `  size-adjust: ${metrics.sizeAdjust};\n`;
    css += `  ascent-override: ${metrics.ascentOverride};\n`;
    css += `  descent-override: ${metrics.descentOverride};\n`;
    css += `  line-gap-override: ${metrics.lineGapOverride};\n`;
    css += "}\n\n";

    return css;
  }

  /**
   * Get fallback font metrics
   */
  private getFallbackMetrics(family: string, customFallback?: string): FallbackFontMetrics {
    // Check predefined metrics first
    if (fallbackMetrics[family]) {
      return fallbackMetrics[family];
    }

    // Return custom or default fallback
    const category = family.toLowerCase().includes("serif") ? "serif" : "sans-serif";

    return {
      fallback: customFallback || (category === "serif" ? "Georgia, serif" : "Arial, sans-serif"),
      sizeAdjust: "100%",
      ascentOverride: "normal",
      descentOverride: "normal",
      lineGapOverride: "0%",
    };
  }

  /**
   * Generate CSS custom properties for easy font usage
   */
  private generateCustomProperties(results: ProcessedFont[]): string {
    let css = "/* CSS Custom Properties */\n:root {\n";

    for (const font of results) {
      if (font.errors && font.errors.length > 0) continue;

      const varName = font.metadata.family.toLowerCase().replace(/\s+/g, "-");
      const fallback = font.config.variable && this.options.fallbacks ? `, '${font.metadata.family} Fallback'` : "";
      const genericFallback = font.config.fallback || (font.metadata.family.toLowerCase().includes("serif") ? ", serif" : ", sans-serif");

      css += `  --font-${varName}: '${font.metadata.family}'${fallback}${genericFallback};\n`;

      // Add variable font axis properties
      if (font.config.variable && font.metadata.variable?.axes) {
        for (const [axis, values] of Object.entries(font.metadata.variable.axes)) {
          css += `  --font-${varName}-${axis}-min: ${values.min};\n`;
          css += `  --font-${varName}-${axis}-max: ${values.max};\n`;
          css += `  --font-${varName}-${axis}-default: ${values.default};\n`;
        }
      }
    }

    css += "}\n\n";
    return css;
  }

  /**
   * Generate utility classes for specific font types
   */
  private generateUtilities(results: ProcessedFont[]): string {
    let css = "";

    // Check for Material Symbols
    const materialSymbols = results.find((r) => r.config.package.includes("material-symbols"));

    if (materialSymbols) {
      css += this.generateMaterialSymbolsUtilities(materialSymbols);
    }

    // Add other font-specific utilities here

    return css;
  }

  /**
   * Generate Material Symbols utility classes
   */
  private generateMaterialSymbolsUtilities(font: ProcessedFont): string {
    const familyClass = font.metadata.family.toLowerCase().replace(/\s+/g, "-");
    const axes = font.metadata.variable?.axes || {};

    let css = `/* Material Symbols Utilities */\n`;
    css += `.${familyClass} {\n`;
    css += `  font-family: var(--font-${familyClass});\n`;
    css += `  font-weight: normal;\n`;
    css += `  font-style: normal;\n`;
    css += `  font-size: 24px;\n`;
    css += `  line-height: 1;\n`;
    css += `  letter-spacing: normal;\n`;
    css += `  text-transform: none;\n`;
    css += `  display: inline-block;\n`;
    css += `  white-space: nowrap;\n`;
    css += `  word-wrap: normal;\n`;
    css += `  direction: ltr;\n`;
    css += `  -webkit-font-smoothing: antialiased;\n`;
    css += `  -moz-osx-font-smoothing: grayscale;\n`;
    css += `  text-rendering: optimizeLegibility;\n`;
    css += `  font-feature-settings: 'liga';\n`;

    // Default variation settings
    const defaultSettings: string[] = [];
    if (axes.FILL) defaultSettings.push(`'FILL' ${axes.FILL.default}`);
    if (axes.wght) defaultSettings.push(`'wght' ${axes.wght.default}`);
    if (axes.GRAD) defaultSettings.push(`'GRAD' ${axes.GRAD.default}`);
    if (axes.opsz) defaultSettings.push(`'opsz' ${axes.opsz.default}`);

    if (defaultSettings.length > 0) {
      css += `  font-variation-settings: ${defaultSettings.join(", ")};\n`;
    }

    css += `}\n\n`;

    // Variation classes
    if (axes.FILL) {
      css += `.${familyClass}.filled {\n`;
      css += `  font-variation-settings: 'FILL' 1, 'wght' ${axes.wght?.default || 400}, 'GRAD' ${axes.GRAD?.default || 0}, 'opsz' ${
        axes.opsz?.default || 24
      };\n`;
      css += `}\n\n`;
    }

    // Weight classes
    const weights = [
      { name: "thin", value: 100 },
      { name: "light", value: 300 },
      { name: "regular", value: 400 },
      { name: "medium", value: 500 },
      { name: "bold", value: 700 },
    ];

    for (const weight of weights) {
      css += `.${familyClass}.${weight.name} {\n`;
      css += `  font-variation-settings: 'FILL' ${axes.FILL?.default || 0}, 'wght' ${weight.value}, 'GRAD' ${
        axes.GRAD?.default || 0
      }, 'opsz' ${axes.opsz?.default || 24};\n`;
      css += `}\n\n`;
    }

    // Size classes
    const sizes = [20, 24, 40, 48];
    for (const size of sizes) {
      css += `.${familyClass}.size-${size} {\n`;
      css += `  font-size: ${size}px;\n`;
      css += `  font-variation-settings: 'FILL' ${axes.FILL?.default || 0}, 'wght' ${axes.wght?.default || 400}, 'GRAD' ${
        axes.GRAD?.default || 0
      }, 'opsz' ${size};\n`;
      css += `}\n\n`;
    }

    return css;
  }

  /**
   * Generate performance hints comment
   */
  private generatePerformanceHints(): string {
    return `/* Performance Optimization Tips:
 * - Critical fonts are preloaded automatically
 * - Fonts are served with immutable cache headers
 * - Variable fonts reduce total file size
 * - Fallback fonts minimize layout shift
 * - Unicode ranges enable progressive loading
 */\n`;
  }

  /**
   * Generate comprehensive documentation
   */
  generateDocumentation(results: ProcessedFont[]): string {
    const sections = [
      this.generateDocHeader(),
      this.generateDocOverview(results),
      this.generateDocUsage(results),
      this.generateDocConfiguration(),
      this.generateDocTroubleshooting(),
      this.generateDocAPI(),
    ];

    return sections.join("\n");
  }

  private generateDocHeader(): string {
    return `# Variable Fonts Documentation

Generated by Nuxt Variable Fonts Module
Last updated: ${new Date().toISOString()}

`;
  }

  private generateDocOverview(results: ProcessedFont[]): string {
    let doc = `## Overview

This project uses ${results.length} font families with optimized loading and caching strategies.

### Installed Fonts

`;

    for (const font of results) {
      if (font.errors && font.errors.length > 0) {
        doc += `- ❌ **${font.config.family}** - Failed to process: ${font.errors.join(", ")}\n`;
        continue;
      }

      doc += `- ✅ **${font.metadata.family}**\n`;
      doc += `  - Package: \`${font.config.package}\`\n`;
      doc += `  - Type: ${font.config.variable ? "Variable" : "Static"} Font\n`;
      doc += `  - Files: ${font.files.length} variants\n`;
      doc += `  - Size: ${this.formatFileSize(font.files.reduce((sum, f) => sum + (f.size || 0), 0))}\n`;

      if (font.config.variable && font.metadata.variable?.axes) {
        doc += `  - Variable Axes: ${Object.keys(font.metadata.variable.axes).join(", ")}\n`;
      }

      doc += "\n";
    }

    return doc;
  }

  private generateDocUsage(results: ProcessedFont[]): string {
    let doc = `## Usage Examples

### Using CSS Variables

The module generates CSS custom properties for each font family:

\`\`\`css
.my-heading {
  font-family: var(--font-montserrat);
}
\`\`\`

### Using the Composable

You can also use the \`useVariableFonts\` composable in your Vue components:

\`\`\`vue
<script setup>
const fonts = useVariableFonts()

// Get all available font families
console.log(fonts.families)

// Apply font to an element
onMounted(() => {
  const element = document.querySelector('.dynamic-text')
  fonts.applyFont(element, {
    family: 'montserrat',
    weight: 600,
    variationSettings: { wght: 650 }
  })
})
</script>
\`\`\`

### Font-Specific Examples

`;

    for (const font of results) {
      if (font.errors && font.errors.length > 0) continue;

      const varName = font.metadata.family.toLowerCase().replace(/\s+/g, "-");

      doc += `#### ${font.metadata.family}\n\n`;
      doc += `\`\`\`css\n`;
      doc += `.my-text {\n`;
      doc += `  font-family: var(--font-${varName});\n`;

      if (font.config.variable && font.metadata.variable?.axes?.wght) {
        const { min, max } = font.metadata.variable.axes.wght;
        doc += `  /* Variable weight: ${min} to ${max} */\n`;
        doc += `  font-weight: 600;\n`;
        doc += `  \n`;
        doc += `  /* Or use variation settings */\n`;
        doc += `  font-variation-settings: 'wght' 650;\n`;
      }

      doc += `}\n`;
      doc += `\`\`\`\n\n`;

      // Add Material Symbols specific examples
      if (font.config.package.includes("material-symbols")) {
        doc += `##### Icon Usage\n\n`;
        doc += `\`\`\`vue\n`;
        doc += `<template>\n`;
        doc += `  <!-- Basic icon -->\n`;
        doc += `  <span class="${varName}">home</span>\n`;
        doc += `  \n`;
        doc += `  <!-- Filled variant -->\n`;
        doc += `  <span class="${varName} filled">favorite</span>\n`;
        doc += `  \n`;
        doc += `  <!-- Custom size and weight -->\n`;
        doc += `  <span class="${varName} bold size-48">star</span>\n`;
        doc += `</template>\n`;
        doc += `\`\`\`\n\n`;
      }
    }

    return doc;
  }

  private generateDocConfiguration(): string {
    return `## Configuration

### Module Options

Configure the module in your \`nuxt.config.ts\`:

\`\`\`typescript
export default defineNuxtConfig({
  modules: ['~/modules/variable-fonts'],

  variableFonts: {
    fonts: [
      {
        package: '@fontsource-variable/montserrat',
        family: 'Montserrat',
        variable: true,
        preload: true,
        weights: [400, 700],
        styles: ['normal'],
        subsets: ['latin'],
        axes: ['wght']
      }
    ],

    // Optional settings
    outputDir: 'public/fonts',
    cssPath: 'assets/css/variable-fonts.css',
    caching: true,
    cacheTTL: 86400000, // 24 hours
    generateDocs: true,
    verbose: false
  }
})
\`\`\`

### Font Configuration Options

Each font can be configured with:

- \`package\`: NPM package name (required)
- \`family\`: Font family name (required)
- \`variable\`: Whether it's a variable font (required)
- \`preload\`: Preload for critical rendering path
- \`weights\`: Array of weights to include
- \`styles\`: Array of styles ('normal', 'italic')
- \`subsets\`: Character subsets to include
- \`axes\`: Variable font axes to support
- \`priority\`: Loading priority (higher loads first)
- \`display\`: Font-display strategy
- \`fallback\`: Custom fallback fonts

`;
  }

  private generateDocTroubleshooting(): string {
    return `## Troubleshooting

### Common Issues

1. **Font not found**: Ensure the package is installed:
   \`\`\`bash
   npm install @fontsource-variable/your-font
   \`\`\`

2. **No font files copied**: Check your configuration matches available files:
   - Verify subsets, styles, and axes match what's in the package
   - Enable verbose logging to see detailed errors

3. **Fonts not loading**: Check browser console for 404 errors:
   - Ensure \`outputDir\` matches your static file serving configuration
   - Check that font files were copied to the output directory

4. **Variable font features not working**: Ensure you're using a browser that supports variable fonts
   - Check caniuse.com for browser compatibility
   - Use fallback fonts for older browsers

### Debug Mode

Enable verbose logging for detailed information:

\`\`\`typescript
variableFonts: {
  verbose: true,
  // ... other options
}
\`\`\`

`;
  }

  private generateDocAPI(): string {
    return `## API Reference

### Composables

#### \`useVariableFonts()\`

Returns an object with:

- \`families\`: Array of available font family names
- \`getVariable(family)\`: Get CSS variable name for a font
- \`applyFont(element, config)\`: Apply font settings to an element

### CSS Variables

The module generates the following CSS variables:

- \`--font-[family-name]\`: Font family with fallbacks
- \`--font-[family-name]-[axis]-min\`: Minimum axis value
- \`--font-[family-name]-[axis]-max\`: Maximum axis value
- \`--font-[family-name]-[axis]-default\`: Default axis value

### Runtime API

The module provides a runtime API through \`$fonts\`:

\`\`\`typescript
// In your app
const { $fonts } = useNuxtApp()

// Get font information
$fonts.families // Array of font families
$fonts.getVariable('montserrat') // Returns '--font-montserrat'
\`\`\`

`;
  }

  /**
   * Format file size for human readability
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Get processed fonts for external use
   */
  getProcessedFonts(): ProcessedFont[] {
    return this.processedFonts;
  }
}
