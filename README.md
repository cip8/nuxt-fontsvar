# Nuxt Variable Fonts Module

A powerful, production-ready Nuxt 3 module for managing variable fonts with automatic optimization, caching, and best practices built-in.

The module handles everything automatically: scanning packages, copying files, generating CSS, and optimizing delivery.

It's designed to be both powerful for advanced users and simple for beginners: a solution which transforms font management from a manual, error-prone process into an automated, optimized system that follows best practices by default while remaining flexible for advanced use cases.

## Features

- 🚀 **Automatic Font Processing** - Scans installed packages and copies only needed files
- ⚡ **Smart Caching** - Avoids regenerating unchanged fonts
- 🎨 **Variable Font Support** - Full support for all variable font axes
- 📦 **Optimal Loading** - Preload critical fonts, lazy load others
- 🔧 **Zero Config** - Works out of the box with sensible defaults
- 📊 **Performance Metrics** - Built-in performance tracking
- 🎯 **TypeScript Support** - Full type safety and IntelliSense
- 🛠️ **Developer Tools** - Debug panel and detailed logging
- 📱 **Responsive** - Adapts to connection speed and device capabilities
- ♿ **Accessible** - Follows best practices for font loading

## Project Structure:

```
modules/
  fontsvar/
    index.ts
    types.ts
    lib/
      font-processor.ts
      cache-manager.ts
      logger.ts
      fallback-metrics.ts
    runtime/
      composables/
        useVariableFonts.ts
      plugin.client.ts
      server-plugin.ts
```

## Installation

1. Install the required font packages:

```bash
pnpm add @fontsource-variable/montserrat @fontsource-variable/lora
# or
npm install @fontsource-variable/montserrat @fontsource-variable/lora
```

2. Install the module by copying all the files to your modules/fontsvar directory

3. Add and configure the module in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ["~/modules/fontsvar"],

  variableFonts: {
    fonts: [
      {
        package: "@fontsource-variable/montserrat",
        family: "Montserrat",
        variable: true,
        preload: true,
        weights: [400, 700],
        styles: ["normal"],
        subsets: ["latin"],
      },
    ],
  },
});
```

4. Use in your components with CSS variables or the composable API

## Configuration

### Module Options

| Option         | Type           | Default                           | Description                          |
| -------------- | -------------- | --------------------------------- | ------------------------------------ |
| `fonts`        | `FontConfig[]` | `[]`                              | Array of font configurations         |
| `outputDir`    | `string`       | `'public/fonts'`                  | Output directory for font files      |
| `cssPath`      | `string`       | `'assets/css/variable-fonts.css'` | Generated CSS file path              |
| `caching`      | `boolean`      | `true`                            | Enable caching to avoid regenerating |
| `cacheTTL`     | `number`       | `86400000`                        | Cache time-to-live (24 hours)        |
| `generateDocs` | `boolean`      | `true`                            | Generate documentation file          |
| `preconnect`   | `boolean`      | `true`                            | Add preconnect hints                 |
| `fallbacks`    | `boolean`      | `true`                            | Generate fallback fonts              |
| `utilities`    | `boolean`      | `true`                            | Generate utility classes             |
| `verbose`      | `boolean`      | `false`                           | Enable verbose logging               |

### Font Configuration

Each font in the `fonts` array accepts:

```typescript
{
  package: string           // NPM package name
  family: string           // Font family name
  variable: boolean        // Is variable font
  preload?: boolean        // Preload for critical rendering
  weights?: number[]       // Weights to include
  styles?: string[]        // 'normal' | 'italic'
  subsets?: string[]       // Character subsets
  axes?: string[]          // Variable font axes
  priority?: number        // Loading priority
  display?: string         // font-display value
  fallback?: string        // Custom fallback fonts
}
```

## Usage

### Basic Usage

```vue
<template>
  <h1 class="font-montserrat">Hello World</h1>
</template>

<style>
.font-montserrat {
  font-family: var(--font-montserrat);
  font-weight: 700;
}
</style>
```

### Using the Composable

```vue
<script setup>
const fonts = useVariableFonts();

// Get all available fonts
console.log(fonts.families.value);

// Apply font dynamically
onMounted(() => {
  const element = document.querySelector(".dynamic-text");
  fonts.applyFont(element, {
    family: "montserrat",
    weight: 600,
    variationSettings: { wght: 650 },
  });
});

// Animate font weight
const animateHeading = async () => {
  const heading = document.querySelector("h1");
  await fonts.animateWeight(heading, 400, 700, 500);
};

// Preload a font
await fonts.preloadFont("lora");
</script>
```

### Material Symbols Icons

```vue
<template>
  <!-- Basic icon -->
  <span class="material-symbols-rounded">home</span>

  <!-- Filled variant -->
  <span class="material-symbols-rounded filled">favorite</span>

  <!-- Custom weight and size -->
  <span class="material-symbols-rounded bold size-48">star</span>

  <!-- Fine-tuned with CSS -->
  <span
    class="material-symbols-rounded"
    :style="{
      fontVariationSettings: `'FILL' 0.5, 'wght' 600, 'GRAD' 100, 'opsz' 40`,
    }"
  >
    settings
  </span>
</template>
```

### With Tailwind CSS

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-montserrat)",
        serif: "var(--font-lora)",
        display: "var(--font-playfair-display)",
      },
    },
  },
};
```

Then use in templates:

```vue
<template>
  <h1 class="font-display text-5xl font-bold">Beautiful Typography</h1>
  <p class="font-serif text-lg leading-relaxed">Body text with elegant serif font</p>
</template>
```

## Advanced Features

### Variable Font Animation

```typescript
const { animateAxes } = useVariableFontAnimation();

// Animate multiple axes simultaneously
await animateAxes(
  element,
  {
    wght: { from: 400, to: 700 },
    slnt: { from: 0, to: -10 },
  },
  500
);
```

### Responsive Font Sizing

```vue
<script setup>
const { useResponsiveFontSize } = useVariableFontAnimation();

// Font size scales from 16px to 24px based on viewport
const fontSize = useResponsiveFontSize(20, 16, 24, 320, 1200);
</script>

<template>
  <p :style="{ fontSize }">Responsive text that scales smoothly</p>
</template>
```

### Performance Optimization

The module automatically:

1. **Generates content-hashed filenames** for long-term caching
2. **Creates fallback fonts** with adjusted metrics to prevent layout shift
3. **Preloads critical fonts** in the document head
4. **Uses font-display: swap** for better perceived performance
5. **Supports subsetting** via unicode-range for progressive loading

### Debugging

Enable verbose logging in development:

```typescript
variableFonts: {
  verbose: true;
}
```

Access the debug panel in development:

```javascript
// In browser console
window.__NUXT_FONTS_DEBUG__ = true;
// Reload the page to see the debug panel
```

## Best Practices

1. **Limit Font Variations**

   - Only include weights and styles you actually use
   - Use 2-3 font families maximum for most projects

2. **Prioritize Critical Fonts**

   - Set `preload: true` for above-the-fold fonts
   - Use `priority` to control loading order

3. **Optimize for Performance**

   - Enable caching in production
   - Use appropriate `font-display` values
   - Consider connection speed with Save-Data header

4. **Use Variable Fonts**

   - Reduce total file size
   - Enable smooth animations
   - Provide better design flexibility

5. **Test Fallback Fonts**
   - Ensure fallbacks match metrics
   - Test with slow network conditions
   - Verify layout doesn't shift

## API Reference

### Module Options

See [Configuration](#configuration) section above.

### Composables

#### `useVariableFonts()`

Main composable for font operations.

**Returns:**

- `families`: Ref<FontFamilyInfo[]> - Available font families
- `currentFont`: Ref<FontFamilyInfo | null> - Currently selected font
- `isLoading`: Ref<boolean> - Loading state
- `error`: Ref<Error | null> - Error state
- `getFamily(name)`: Get font family info
- `getVariable(family)`: Get CSS variable name
- `applyFont(element, config)`: Apply font to element
- `preloadFont(family)`: Preload a font family
- `measureText(text, config)`: Measure text dimensions
- `animateWeight(element, from, to, duration)`: Animate weight
- `createFontStack(families)`: Create font stack string

#### `useVariableFontAnimation()`

Advanced animation features.

**Returns:**

- `animateAxes(element, animations, duration)`: Animate multiple axes
- `useResponsiveFontSize(base, min, max, minVp, maxVp)`: Responsive sizing

### Runtime API

Access via `useNuxtApp()`:

```typescript
const { $fonts } = useNuxtApp();

$fonts.families; // Array of font families
$fonts.getVariable("montserrat"); // Get CSS variable
$fonts.applyFont(element, config); // Apply font
```

## Troubleshooting

### Font files not found

```bash
# Ensure packages are installed
npm ls @fontsource-variable/montserrat

# Check verbose logs
npm run dev -- --verbose
```

### Fonts not loading

1. Check browser DevTools Network tab for 404s
2. Verify output directory matches static serving
3. Check font file permissions

### Variable features not working

1. Check browser support for variable fonts
2. Verify axes configuration matches font capabilities
3. Use fallback fonts for older browsers

### Cache issues

```bash
# Clear cache manually
rm -rf .nuxt/variable-fonts-cache

# Or disable caching
variableFonts: {
  caching: false
}
```

## Suggested Future Enhancements

- Advanced Features:

```typescript
// Color font support (COLRv1)
fonts: [{
  package: '@fontsource/noto-color-emoji',
  family: 'Noto Color Emoji',
  colorFont: true
}]

// Automatic subsetting based on content
variableFonts: {
  autoSubset: true,
  scanContent: ['pages/**/*.vue', 'components/**/*.vue']
}
```

- Performance Monitoring:

```typescript
// Built-in Core Web Vitals tracking
variableFonts: {
  metrics: {
    trackCLS: true,
    trackFCP: true,
    reportTo: '/api/metrics'
  }
}
```

- Advanced Caching:

```typescript
// Service worker integration
variableFonts: {
  serviceWorker: {
    strategy: 'cache-first',
    maxAge: 31536000
  }
}
```

- Font Testing Tools:

```typescript
// A/B testing different font configurations
const { experimentalFont } = useVariableFonts();

experimentalFont.test("heading-font", {
  control: { family: "montserrat", weight: 700 },
  variant: { family: "inter", weight: 600 },
});
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Tests are encouraged

## License

MIT License

## Credits

- Built with [Nuxt 3](https://nuxt.com)
- Fonts from [Fontsource](https://fontsource.org)
- Inspired by [@nuxt/fonts](https://github.com/nuxt/fonts)
