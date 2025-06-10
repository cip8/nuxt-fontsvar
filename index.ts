// modules/variable-fonts/index.ts
import { defineNuxtModule, createResolver, addTemplate, addImportsDir } from "@nuxt/kit";
import { join, relative } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import type { Nuxt } from "@nuxt/schema";
import { FontProcessor } from "./lib/font-processor";
import { CacheManager } from "./lib/cache-manager";
import { logger } from "./lib/logger";
import type { ModuleOptions, FontConfig } from "./types";

export * from "./types";

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-variable-fonts",
    configKey: "variableFonts",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    fonts: [],
    outputDir: "public/fonts",
    cssPath: "assets/css/variable-fonts.css",
    caching: true,
    cacheTTL: 86400000, // 24 hours
    generateDocs: true,
    docsPath: "VARIABLE_FONTS_README.md",
    preconnect: true,
    crossorigin: "anonymous",
    display: "swap",
    fallbacks: true,
    customProperties: true,
    utilities: true,
    verbose: false,
  },
  async setup(options, nuxt) {
    // Initialize logger with verbosity setting
    logger.setVerbose(options.verbose || false);

    logger.info("Variable Fonts Module: Initializing...");

    const resolver = createResolver(import.meta.url);
    const rootDir = nuxt.options.rootDir;
    const fontProcessor = new FontProcessor(options, rootDir);
    const cacheManager = new CacheManager(rootDir, options.cacheTTL || 86400000);

    // Ensure output directory exists
    const outputPath = join(rootDir, options.outputDir!);
    mkdirSync(outputPath, { recursive: true });

    // Function to process fonts
    async function processFonts(force = false) {
      try {
        // Check if we need to regenerate based on cache
        if (!force && options.caching) {
          const cacheValid = await cacheManager.isCacheValid(options.fonts);
          if (cacheValid) {
            logger.success("Using cached font files");
            return;
          }
        }

        logger.info("Processing fonts...");

        // Process all configured fonts
        const results = await fontProcessor.processAll();

        // Generate CSS file
        const cssContent = fontProcessor.generateCSS(results);
        const cssPath = join(rootDir, options.cssPath!);
        const cssDir = join(cssPath, "..");
        mkdirSync(cssDir, { recursive: true });
        writeFileSync(cssPath, cssContent);

        // Generate documentation if enabled
        if (options.generateDocs) {
          const docsContent = fontProcessor.generateDocumentation(results);
          const docsPath = join(rootDir, options.docsPath!);
          writeFileSync(docsPath, docsContent);
        }

        // Update cache
        if (options.caching) {
          await cacheManager.updateCache(options.fonts, results);
        }

        // Generate types for TypeScript support
        await generateFontTypes(nuxt, results);

        logger.success(`Processed ${results.length} font families`);
      } catch (error) {
        logger.error("Failed to process fonts:", error);
        throw error;
      }
    }

    // Process fonts on initial setup
    await processFonts();

    // Add CSS to Nuxt config
    nuxt.options.css.push(`@/${options.cssPath}`);

    // Configure nitro for proper font serving
    nuxt.options.nitro = nuxt.options.nitro || {};
    nuxt.options.nitro.publicAssets = nuxt.options.nitro.publicAssets || [];
    nuxt.options.nitro.publicAssets.push({
      baseURL: "/fonts",
      dir: outputPath,
      maxAge: 31536000, // 1 year cache
    });

    // Add route rules for font caching
    nuxt.options.routeRules = nuxt.options.routeRules || {};
    nuxt.options.routeRules["/fonts/**"] = {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
    };

    // Add preload links and preconnect hints
    if (options.preconnect || options.fonts.some((f) => f.preload)) {
      nuxt.hook("app:resolved", (app) => {
        const head = app.head as any;
        head.link = head.link || [];

        // Add preconnect hints
        if (options.preconnect) {
          head.link.push({
            rel: "preconnect",
            href: "/fonts",
            crossorigin: options.crossorigin,
          });
        }

        // Add preload links for specific fonts
        const processedFonts = fontProcessor.getProcessedFonts();
        for (const font of processedFonts) {
          if (font.config.preload && font.files.length > 0) {
            const mainFile = font.files.find((f) => f.subset === "latin" && f.style === "normal") || font.files[0];

            head.link.push({
              rel: "preload",
              as: "font",
              type: "font/woff2",
              href: mainFile.url,
              crossorigin: options.crossorigin,
            });
          }
        }
      });
    }

    // Add composables
    addImportsDir(resolver.resolve("./runtime/composables"));

    // Watch for font configuration changes in development
    if (nuxt.options.dev) {
      nuxt.hook("builder:watch", async (event, path) => {
        const relativePath = relative(rootDir, path);

        // Check if the changed file is related to fonts
        if (
          relativePath.includes("nuxt.config") ||
          relativePath.includes("variable-fonts.config") ||
          path.includes("node_modules/@fontsource")
        ) {
          logger.info("Font configuration changed, regenerating...");
          await processFonts(true);

          // Trigger HMR
          nuxt.callHook("builder:generateApp");
        }
      });
    }

    // Add server plugin for runtime font management
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.plugins = nitroConfig.plugins || [];
      nitroConfig.plugins.push(resolver.resolve("./runtime/server-plugin"));
    });

    // Provide font utilities to the app
    nuxt.hook("imports:extend", (imports) => {
      imports.push({
        name: "useVariableFonts",
        as: "useVariableFonts",
        from: resolver.resolve("./runtime/composables/useVariableFonts"),
      });
    });

    logger.success("Variable Fonts Module: Setup complete");
  },
});

// Helper function to generate TypeScript types
async function generateFontTypes(nuxt: Nuxt, results: any[]) {
  const fontNames = results.map((r) => r.metadata.family.toLowerCase().replace(/\s+/g, "-"));

  const typeContent = `// Auto-generated font types
export type VariableFontFamily = ${fontNames.map((n) => `'${n}'`).join(" | ")}

export interface VariableFontConfig {
  family: VariableFontFamily
  weight?: number | string
  style?: 'normal' | 'italic'
  variationSettings?: Record<string, number>
}

declare module '#app' {
  interface NuxtApp {
    $fonts: {
      families: VariableFontFamily[]
      getVariable: (family: VariableFontFamily) => string
      applyFont: (element: HTMLElement, config: VariableFontConfig) => void
    }
  }
}

export {}
`;

  addTemplate({
    filename: "types/variable-fonts.d.ts",
    getContents: () => typeContent,
    write: true,
  });
}
