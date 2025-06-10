// modules/variable-fonts/lib/logger.ts
import { consola } from "consola";
import type { ConsolaInstance } from "consola";

/**
 * Logger for Variable Fonts Module
 *
 * This logger provides consistent, formatted output for the module's operations.
 * It wraps the Nuxt consola logger with module-specific formatting and features:
 *
 * 1. Prefixed messages for easy identification
 * 2. Verbosity control for debugging
 * 3. Structured error reporting
 * 4. Performance timing helpers
 *
 * The logger respects Nuxt's logging configuration and integrates
 * seamlessly with the framework's logging system.
 */
class VariableFontsLogger {
  private logger: ConsolaInstance;
  private prefix = "[Variable Fonts]";
  private verbose = false;
  private timers: Map<string, number> = new Map();

  constructor() {
    // Create a scoped logger instance
    this.logger = consola.withTag("variable-fonts");
  }

  /**
   * Set verbosity level
   * When verbose is true, debug messages will be shown
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
    if (verbose) {
      this.logger.level = 4; // Debug level
    }
  }

  /**
   * Log an info message
   * Used for general operational messages
   */
  info(message: string, ...args: any[]): void {
    this.logger.info(this.formatMessage(message), ...args);
  }

  /**
   * Log a success message
   * Used when operations complete successfully
   */
  success(message: string, ...args: any[]): void {
    this.logger.success(this.formatMessage(message), ...args);
  }

  /**
   * Log a warning message
   * Used for non-critical issues that should be addressed
   */
  warn(message: string, ...args: any[]): void {
    this.logger.warn(this.formatMessage(message), ...args);
  }

  /**
   * Log an error message
   * Used for critical errors that prevent normal operation
   */
  error(message: string, error?: any): void {
    const formattedMessage = this.formatMessage(message);

    if (error instanceof Error) {
      // Provide structured error output
      this.logger.error(formattedMessage, {
        message: error.message,
        stack: this.verbose ? error.stack : undefined,
      });
    } else if (error) {
      this.logger.error(formattedMessage, error);
    } else {
      this.logger.error(formattedMessage);
    }
  }

  /**
   * Log a debug message
   * Only shown when verbose mode is enabled
   */
  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      this.logger.debug(this.formatMessage(message), ...args);
    }
  }

  /**
   * Start a performance timer
   * Useful for measuring operation duration
   */
  time(label: string): void {
    this.timers.set(label, Date.now());
    this.debug(`Timer started: ${label}`);
  }

  /**
   * End a performance timer and log the duration
   */
  timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.timers.delete(label);

      const formattedDuration = this.formatDuration(duration);
      this.debug(`Timer ended: ${label} (${formattedDuration})`);

      // Log as info if it took a long time
      if (duration > 5000) {
        this.info(`${label} took ${formattedDuration}`);
      }
    }
  }

  /**
   * Log a progress update
   * Useful for long-running operations
   */
  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressMessage = message
      ? `${message} (${current}/${total} - ${percentage}%)`
      : `Progress: ${current}/${total} - ${percentage}%`;

    this.info(progressMessage);
  }

  /**
   * Create a sub-logger for a specific operation
   * This helps track nested operations
   */
  createScope(scope: string): ScopedLogger {
    return new ScopedLogger(this, scope);
  }

  /**
   * Format a message with the module prefix
   */
  private formatMessage(message: string): string {
    return `${this.prefix} ${message}`;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Log a table of data
   * Useful for displaying font information
   */
  table(data: Record<string, any>[] | Record<string, any>): void {
    if (this.verbose) {
      console.table(data);
    }
  }

  /**
   * Create a formatted box message
   * Used for important notifications
   */
  box(message: string): void {
    this.logger.box(message);
  }
}

/**
 * Scoped logger for tracking nested operations
 *
 * This allows us to maintain context when performing
 * operations within operations (e.g., processing multiple fonts)
 */
class ScopedLogger {
  constructor(private parent: VariableFontsLogger, private scope: string) {}

  private formatMessage(message: string): string {
    return `[${this.scope}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    this.parent.info(this.formatMessage(message), ...args);
  }

  success(message: string, ...args: any[]): void {
    this.parent.success(this.formatMessage(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.parent.warn(this.formatMessage(message), ...args);
  }

  error(message: string, error?: any): void {
    this.parent.error(this.formatMessage(message), error);
  }

  debug(message: string, ...args: any[]): void {
    this.parent.debug(this.formatMessage(message), ...args);
  }
}

/**
 * Singleton logger instance
 * This ensures consistent logging throughout the module
 */
export const logger = new VariableFontsLogger();

/**
 * Helper function to create a logger for tests
 * This allows tests to have their own isolated logger
 */
export function createTestLogger(verbose = false): VariableFontsLogger {
  const testLogger = new VariableFontsLogger();
  testLogger.setVerbose(verbose);
  return testLogger;
}
