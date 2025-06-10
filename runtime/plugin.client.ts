// modules/variable-fonts/runtime/plugin.client.ts
import { defineNuxtPlugin } from "#app";

/**
 * Client-side plugin for Variable Fonts
 *
 * This plugin:
 * 1. Provides font data to the Vue app
 * 2. Sets up font loading observers
 * 3. Handles font-related performance optimizations
 * 4. Provides debugging tools in development
 */
export default defineNuxtPlugin({
  name: "variable-fonts",
  enforce: "pre", // Run before other plugins

  setup(nuxtApp) {
    // Get font data from server-injected script or fallback
    const fontData = (window as any).__NUXT_FONTS__ || { families: [], config: {} };

    // Create font API
    const fonts = {
      families: fontData.families.map((family: any) => ({
        name: family.name,
        cssVariable: `--font-${family.name.toLowerCase().replace(/\s+/g, "-")}`,
        isVariable: family.variable,
        axes: family.axes,
        weights: family.weights,
        styles: family.styles,
      })),

      /**
       * Get CSS variable for a font family
       */
      getVariable(family: string): string {
        const normalizedName = family.toLowerCase().replace(/\s+/g, "-");
        return `--font-${normalizedName}`;
      },

      /**
       * Apply font to an element with configuration
       */
      applyFont(element: HTMLElement, config: any): void {
        if (!element) return;

        const variable = this.getVariable(config.family);
        element.style.fontFamily = `var(${variable})`;

        if (config.weight) {
          element.style.fontWeight = String(config.weight);
        }

        if (config.variationSettings) {
          const settings = Object.entries(config.variationSettings)
            .map(([axis, value]) => `'${axis}' ${value}`)
            .join(", ");
          element.style.fontVariationSettings = settings;
        }
      },

      /**
       * Check if fonts are loaded
       */
      async whenLoaded(families?: string[]): Promise<void> {
        if ("fonts" in document) {
          await document.fonts.ready;

          if (families && families.length > 0) {
            const checks = families.map((family) => document.fonts.check(`16px ${family}`));

            if (!checks.every(Boolean)) {
              // Wait for specific fonts
              await Promise.all(
                families.map((family) =>
                  document.fonts.load(`16px ${family}`).catch(() => {
                    console.warn(`Failed to load font: ${family}`);
                  })
                )
              );
            }
          }
        } else {
          // Fallback for older browsers
          await new Promise((resolve) => {
            if (document.readyState === "complete") {
              resolve(undefined);
            } else {
              window.addEventListener("load", () => resolve(undefined));
            }
          });
        }
      },
    };

    // Provide fonts API
    nuxtApp.provide("fonts", fonts);

    // Set up font loading observer for performance tracking
    if ("fonts" in document && process.dev) {
      let loadedFonts = 0;

      document.fonts.addEventListener("loadingdone", (event) => {
        const fontfacesetEvent = event as FontFaceSetLoadEvent;
        console.log(
          `[Variable Fonts] Loaded ${fontfacesetEvent.fontfaces.length} fonts`,
          fontfacesetEvent.fontfaces.map((f) => f.family)
        );
        loadedFonts += fontfacesetEvent.fontfaces.length;
      });

      // Log loading errors
      document.fonts.addEventListener("loadingerror", (event) => {
        console.error("[Variable Fonts] Font loading error:", event);
      });
    }

    // Add performance observer for font-related metrics
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "resource" && entry.name.includes("/fonts/")) {
              // Track font loading performance
              const loadTime = entry.responseEnd - entry.startTime;

              if (process.dev) {
                console.log(`[Variable Fonts] Font loaded: ${entry.name} (${loadTime.toFixed(2)}ms)`);
              }

              // Send metrics to analytics if configured
              if (nuxtApp.$config.public.fontAnalytics) {
                nuxtApp.$gtag?.("event", "font_load", {
                  font_url: entry.name,
                  load_time: loadTime,
                  size: (entry as any).transferSize || 0,
                });
              }
            }
          }
        });

        observer.observe({ entryTypes: ["resource"] });
      } catch (e) {
        // Observer not supported
      }
    }

    // Development tools
    if (process.dev) {
      // Add debugging panel
      nuxtApp.hook("app:mounted", () => {
        // Create debug panel for font inspection
        if ((window as any).__NUXT_FONTS_DEBUG__) {
          createFontDebugPanel(fonts);
        }
      })(
        // Expose font API to window for debugging
        window as any
      ).$fonts = fonts;
    }
  },
});

/**
 * Create a debug panel for font inspection in development
 */
function createFontDebugPanel(fonts: any) {
  const panel = document.createElement("div");
  panel.id = "font-debug-panel";
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 999999;
    display: none;
  `;

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "🔤";
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: black;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    z-index: 999998;
    font-size: 20px;
  `;

  toggleBtn.onclick = () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    toggleBtn.style.display = panel.style.display === "none" ? "block" : "none";
  };

  // Populate panel content
  let content = '<h3 style="margin: 0 0 10px 0;">Variable Fonts Debug</h3>';
  content += '<div style="margin-bottom: 10px;">Loaded Fonts:</div>';

  for (const family of fonts.families) {
    content += `
      <div style="margin-bottom: 8px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
        <strong>${family.name}</strong><br>
        Type: ${family.isVariable ? "Variable" : "Static"}<br>
        CSS: <code>var(${family.cssVariable})</code><br>
        ${family.axes ? `Axes: ${Object.keys(family.axes).join(", ")}` : ""}
      </div>
    `;
  }

  // Add font loading status
  if ("fonts" in document) {
    content += `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
        Font Status: ${document.fonts.status}<br>
        Loaded: ${document.fonts.size} fonts
      </div>
    `;
  }

  panel.innerHTML = content;

  document.body.appendChild(panel);
  document.body.appendChild(toggleBtn);
}
