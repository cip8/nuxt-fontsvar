// modules/variable-fonts/lib/cache-manager.ts
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import type { FontConfig, ProcessedFont, CacheEntry } from "../types";
import { logger } from "./logger";

/**
 * Cache Manager for Variable Fonts Module
 *
 * This class implements an intelligent caching system that tracks:
 * 1. Font configuration changes
 * 2. Package file modifications
 * 3. Module version changes
 *
 * The cache helps avoid expensive font processing operations when nothing has changed.
 */
export class CacheManager {
  private cacheDir: string;
  private cacheFile: string;
  private ttl: number;
  private moduleVersion: string = "1.0.0";

  constructor(projectRoot: string, ttl: number = 86400000) {
    this.cacheDir = join(projectRoot, ".nuxt", "variable-fonts-cache");
    this.cacheFile = join(this.cacheDir, "cache.json");
    this.ttl = ttl;

    // Ensure cache directory exists
    mkdirSync(this.cacheDir, { recursive: true });
  }

  /**
   * Check if the cache is valid for the given font configuration
   *
   * The cache is considered valid if:
   * 1. Cache file exists and is not expired
   * 2. Configuration hash matches
   * 3. All font package files haven't been modified
   */
  async isCacheValid(fonts: FontConfig[]): Promise<boolean> {
    try {
      // Check if cache file exists
      if (!existsSync(this.cacheFile)) {
        logger.debug("Cache miss: No cache file found");
        return false;
      }

      // Read cache entry
      const cacheContent = readFileSync(this.cacheFile, "utf-8");
      const cache: CacheEntry = JSON.parse(cacheContent);

      // Check module version
      if (cache.version !== this.moduleVersion) {
        logger.debug("Cache miss: Module version mismatch");
        return false;
      }

      // Check if cache is expired based on TTL
      const age = Date.now() - cache.timestamp;
      if (age > this.ttl) {
        logger.debug(`Cache miss: Cache expired (age: ${Math.round(age / 1000)}s)`);
        return false;
      }

      // Generate current configuration hash
      const currentHash = this.generateConfigHash(fonts);
      if (currentHash !== cache.configHash) {
        logger.debug("Cache miss: Configuration changed");
        return false;
      }

      // Check if any font files have been modified
      const filesModified = await this.checkFilesModified(cache.fonts);
      if (filesModified) {
        logger.debug("Cache miss: Font files modified");
        return false;
      }

      logger.debug(`Cache hit: Using cached data (age: ${Math.round(age / 1000)}s)`);
      return true;
    } catch (error) {
      logger.debug("Cache miss: Error reading cache", error);
      return false;
    }
  }

  /**
   * Update the cache with new processing results
   */
  async updateCache(fonts: FontConfig[], results: ProcessedFont[]): Promise<void> {
    try {
      const cache: CacheEntry = {
        timestamp: Date.now(),
        configHash: this.generateConfigHash(fonts),
        fonts: this.sanitizeResults(results),
        version: this.moduleVersion,
      };

      writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
      logger.debug("Cache updated successfully");
    } catch (error) {
      logger.warn("Failed to update cache:", error);
      // Non-critical error - continue without caching
    }
  }

  /**
   * Get cached font data
   */
  getCachedData(): ProcessedFont[] | null {
    try {
      if (!existsSync(this.cacheFile)) {
        return null;
      }

      const cacheContent = readFileSync(this.cacheFile, "utf-8");
      const cache: CacheEntry = JSON.parse(cacheContent);

      return cache.fonts;
    } catch (error) {
      logger.debug("Failed to read cached data:", error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    try {
      if (existsSync(this.cacheFile)) {
        const cacheContent = readFileSync(this.cacheFile, "utf-8");
        const cache: CacheEntry = JSON.parse(cacheContent);

        // Create a backup before clearing
        const backupFile = join(this.cacheDir, `cache.backup.${Date.now()}.json`);
        writeFileSync(backupFile, cacheContent);

        // Remove the main cache file
        require("fs").unlinkSync(this.cacheFile);

        logger.info("Cache cleared successfully");
      }
    } catch (error) {
      logger.warn("Failed to clear cache:", error);
    }
  }

  /**
   * Generate a hash from the font configuration
   * This allows us to detect when configuration changes
   */
  private generateConfigHash(fonts: FontConfig[]): string {
    // Create a normalized representation of the config
    const configData = fonts.map((font) => ({
      package: font.package,
      family: font.family,
      variable: font.variable,
      weights: font.weights?.sort(),
      styles: font.styles?.sort(),
      subsets: font.subsets?.sort(),
      axes: font.axes?.sort(),
      // Include other relevant config properties
      preload: font.preload,
      display: font.display,
      priority: font.priority,
    }));

    // Sort by package name for consistent ordering
    configData.sort((a, b) => a.package.localeCompare(b.package));

    // Generate hash
    const configString = JSON.stringify(configData);
    return createHash("sha256").update(configString).digest("hex");
  }

  /**
   * Check if any font files have been modified since caching
   * This helps detect when packages are updated
   */
  private async checkFilesModified(cachedFonts: ProcessedFont[]): Promise<boolean> {
    for (const font of cachedFonts) {
      // Skip fonts that had errors
      if (font.errors && font.errors.length > 0) {
        continue;
      }

      // Check metadata file modification time
      const metadataPath = this.getMetadataPath(font.config.package);
      if (metadataPath && existsSync(metadataPath)) {
        const stats = statSync(metadataPath);
        const metadataTime = stats.mtimeMs;

        // Compare with cache timestamp (with some tolerance)
        const cacheTime = this.getCacheTimestamp();
        if (metadataTime > cacheTime + 1000) {
          logger.debug(`Package ${font.config.package} has been modified`);
          return true;
        }
      }

      // Check if font files still exist
      for (const file of font.files) {
        if (file.path && !existsSync(file.path)) {
          logger.debug(`Font file missing: ${file.path}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the path to a package's metadata file
   */
  private getMetadataPath(packageName: string): string | null {
    // Try common locations
    const possiblePaths = [
      join(process.cwd(), "node_modules", packageName, "metadata.json"),
      join(process.cwd(), "node_modules", packageName, "package.json"),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * Get cache file timestamp
   */
  private getCacheTimestamp(): number {
    try {
      const stats = statSync(this.cacheFile);
      return stats.mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Sanitize results for caching
   * Remove absolute paths and other environment-specific data
   */
  private sanitizeResults(results: ProcessedFont[]): ProcessedFont[] {
    return results.map((result) => ({
      ...result,
      files: result.files.map((file) => ({
        ...file,
        // Store relative path instead of absolute
        path: file.path ? this.makeRelativePath(file.path) : undefined,
      })),
    }));
  }

  /**
   * Make a path relative to the project root
   */
  private makeRelativePath(absolutePath: string): string {
    const projectRoot = process.cwd();
    if (absolutePath.startsWith(projectRoot)) {
      return absolutePath.slice(projectRoot.length + 1);
    }
    return absolutePath;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    exists: boolean;
    size: number;
    age: number;
    valid: boolean;
  } | null {
    try {
      if (!existsSync(this.cacheFile)) {
        return {
          exists: false,
          size: 0,
          age: 0,
          valid: false,
        };
      }

      const stats = statSync(this.cacheFile);
      const content = readFileSync(this.cacheFile, "utf-8");
      const cache: CacheEntry = JSON.parse(content);

      return {
        exists: true,
        size: stats.size,
        age: Date.now() - cache.timestamp,
        valid: Date.now() - cache.timestamp < this.ttl,
      };
    } catch {
      return null;
    }
  }

  /**
   * Perform cache maintenance
   * Clean up old backup files and optimize cache storage
   */
  async performMaintenance(): Promise<void> {
    try {
      const files = require("fs").readdirSync(this.cacheDir);
      const backupFiles = files.filter((f: string) => f.startsWith("cache.backup."));

      // Keep only the 5 most recent backups
      if (backupFiles.length > 5) {
        backupFiles
          .sort()
          .slice(0, -5)
          .forEach((file: string) => {
            const filePath = join(this.cacheDir, file);
            require("fs").unlinkSync(filePath);
            logger.debug(`Removed old backup: ${file}`);
          });
      }

      // Compact the main cache file if it's getting large
      if (existsSync(this.cacheFile)) {
        const stats = statSync(this.cacheFile);
        if (stats.size > 1024 * 1024) {
          // 1MB
          const content = readFileSync(this.cacheFile, "utf-8");
          const cache = JSON.parse(content);

          // Rewrite with minimal formatting
          writeFileSync(this.cacheFile, JSON.stringify(cache));
          logger.debug("Compacted cache file");
        }
      }
    } catch (error) {
      logger.debug("Cache maintenance error:", error);
    }
  }
}

/**
 * Singleton instance for module-wide cache management
 */
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(projectRoot: string, ttl?: number): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(projectRoot, ttl);
  }
  return cacheManagerInstance;
}
