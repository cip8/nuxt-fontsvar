// modules/variable-fonts/runtime/server-plugin.ts
import { defineNitroPlugin } from "nitropack/runtime/plugin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Server plugin for Variable Fonts Module
 *
 * This plugin provides runtime access to font information and handles
 * server-side font operations like generating critical CSS and optimizing
 * font delivery based on user agent.
 */
export default defineNitroPlugin((nitroApp) => {
  // Read font configuration from generated files
  const projectRoot = process.cwd();
  const fontDataPath = join(projectRoot, ".nuxt/variable-fonts-cache/runtime-data.json");

  let fontData: any = {
    families: [],
    config: {},
  };

  // Load font data if available
  if (existsSync(fontDataPath)) {
    try {
      const data = readFileSync(fontDataPath, "utf-8");
      fontData = JSON.parse(data);
    } catch (error) {
      console.warn("[Variable Fonts] Failed to load runtime font data:", error);
    }
  }

  // Add font data to app context
  nitroApp.hooks.hook("render:html", (html, { event }) => {
    // Inject font data as global variable for client-side access
    const fontDataScript = `
      <script>
        window.__NUXT_FONTS__ = ${JSON.stringify(fontData)};
      </script>
    `;

    // Insert before closing head tag
    html.head.push(fontDataScript);

    // Add performance hints based on user agent
    const userAgent = event.node.req.headers["user-agent"] || "";

    // Detect if user is on a slow connection
    const connectionHeader = event.node.req.headers["save-data"];
    const isSlowConnection = connectionHeader === "on";

    if (isSlowConnection) {
      // Add reduced font loading for slow connections
      html.head.push(`
        <style>
          /* Reduce font variations on slow connections */
          @media (prefers-reduced-data: reduce) {
            :root {
              font-synthesis: weight style;
            }
            body {
              font-weight: 400 !important;
            }
          }
        </style>
      `);
    }

    // Add critical font CSS for above-the-fold content
    if (fontData.criticalCSS) {
      html.head.push(`
        <style id="critical-fonts">
          ${fontData.criticalCSS}
        </style>
      `);
    }
  });

  // Provide server API endpoints for font operations
  nitroApp.hooks.hook("request", async (event) => {
    const url = event.node.req.url || "";

    // Font subsetting API endpoint
    if (url.startsWith("/api/fonts/subset")) {
      const query = new URLSearchParams(url.split("?")[1]);
      const family = query.get("family");
      const text = query.get("text");

      if (family && text) {
        // This would connect to a font subsetting service
        // For now, return a placeholder response
        event.node.res.setHeader("Content-Type", "application/json");
        event.node.res.end(
          JSON.stringify({
            success: true,
            message: "Font subsetting not implemented in this example",
            family,
            characters: text,
          })
        );
        return;
      }
    }

    // Font metrics API endpoint
    if (url.startsWith("/api/fonts/metrics")) {
      const query = new URLSearchParams(url.split("?")[1]);
      const family = query.get("family");

      if (family) {
        const fontInfo = fontData.families.find((f: any) => f.name.toLowerCase() === family.toLowerCase());

        event.node.res.setHeader("Content-Type", "application/json");
        event.node.res.end(
          JSON.stringify({
            success: !!fontInfo,
            metrics: fontInfo?.metrics || null,
          })
        );
        return;
      }
    }
  });
});
