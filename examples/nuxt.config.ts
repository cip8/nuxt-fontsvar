// nuxt.config.ts - Example configuration
export default defineNuxtConfig({
  modules: [
    // Add the variable fonts module
    '~/modules/variable-fonts'
  ],

  // Configure the variable fonts module
  variableFonts: {
    // Font configurations
    fonts: [
      // Primary sans-serif font with variable weight
      {
        package: '@fontsource-variable/montserrat',
        family: 'Montserrat',
        variable: true,
        preload: true, // Preload for critical rendering
        priority: 10, // Highest priority
        weights: [300, 400, 600, 700, 900],
        styles: ['normal', 'italic'],
        subsets: ['latin', 'latin-ext'],
        axes: ['wght'],
        display: 'swap',
        fallback: 'Arial, sans-serif'
      },

      // Secondary serif font for body text
      {
        package: '@fontsource-variable/lora',
        family: 'Lora',
        variable: true,
        preload: true,
        priority: 9,
        weights: [400, 500, 600, 700],
        styles: ['normal', 'italic'],
        subsets: ['latin'],
        axes: ['wght'],
        display: 'swap'
      },

      // Icon font with all variable axes
      {
        package: '@fontsource-variable/material-symbols-rounded',
        family: 'Material Symbols Rounded',
        variable: true,
        preload: false, // Don't preload icons
        priority: 5,
        styles: ['normal'],
        subsets: ['latin'],
        axes: ['FILL', 'wght', 'GRAD', 'opsz'], // All icon axes
        display: 'block' // Block for icons
      },

      // Monospace font for code
      {
        package: '@fontsource-variable/jetbrains-mono',
        family: 'JetBrains Mono',
        variable: true,
        preload: false,
        priority: 3,
        weights: [400, 600],
        styles: ['normal', 'italic'],
        subsets: ['latin'],
        axes: ['wght'],
        display: 'swap'
      },

      // Display font for headings
      {
        package: '@fontsource-variable/playfair-display',
        family: 'Playfair Display',
        variable: true,
        preload: false,
        priority: 7,
        weights: [400, 700, 900],
        styles: ['normal', 'italic'],
        subsets: ['latin'],
        axes: ['wght'],
        display: 'swap',
        // Custom unicode ranges for better performance
        unicodeRanges: {
          'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
          'latin-ext': 'U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF'
        }
      }
    ],

    // Module options
    outputDir: 'public/fonts',
    cssPath: 'assets/css/variable-fonts.css',
    caching: true,
    cacheTTL: 86400000, // 24 hours
    generateDocs: true,
    docsPath: 'docs/FONTS.md',
    preconnect: true,
    crossorigin: 'anonymous',
    display: 'swap', // Default display strategy
    fallbacks: true, // Generate fallback fonts
    customProperties: true, // Generate CSS variables
    utilities: true, // Generate utility classes
    verbose: process.env.NODE_ENV === 'development'
  },

  // CSS configuration
  css: [
    // The module automatically adds the generated CSS
    // Add your other CSS files here
    '@/assets/css/main.css'
  ],

  // Tailwind configuration that works with variable fonts
  tailwindcss: {
    config: {
      theme: {
        extend: {
          fontFamily: {
            // Use CSS variables from the module
            'sans': 'var(--font-montserrat)',
            'serif': 'var(--font-lora)',
            'display': 'var(--font-playfair-display)',
            'mono': 'var(--font-jetbrains-mono)',

            // Or use the font stack directly
            'heading': ['Playfair Display', 'Georgia', 'serif'],
            'body': ['Montserrat', 'Arial', 'sans-serif']
          },

          // Add font weight utilities for variable fonts
          fontWeight: {
            'hairline': '100',
            'thin': '200',
            'light': '300',
            'normal': '400',
            'medium': '500',
            'semibold': '600',
            'bold': '700',
            'extrabold': '800',
            'black': '900',
            // Custom weights for fine control
            'book': '450',
            'heavy': '850'
          }
        }
      }
    }
  },

  // Development tools
  devtools: {
    enabled: true
  },

  // Build optimizations
  nitro: {
    prerender: {
      routes: ['/'],
      // Prerender font documentation
      crawlLinks: true
    }
  },

  // Vite optimizations for fonts
  vite: {
    optimizeDeps: {
      include: [
        '@fontsource-variable/montserrat',
        '@fontsource-variable/lora',
        '@fontsource-variable/material-symbols-rounded',
        '@fontsource-variable/jetbrains-mono',
        '@fontsource-variable/playfair-display'
      ]
    }
  }
})
