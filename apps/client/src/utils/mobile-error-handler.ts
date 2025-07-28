import { t } from "@lingui/macro";
import { detectMobileBrowser, type MobileErrorState } from "@reactive-resume/hooks";

export type ErrorRecoveryOptions = {
  maxRetries: number;
  retryDelay: number;
  fallbackEnabled: boolean;
  userFeedback: boolean;
};

export class MobileErrorHandler {
  private retryCount = 0;
  private maxRetries: number;
  private retryDelay: number;
  private fallbackEnabled: boolean;
  private userFeedback: boolean;

  constructor(options: Partial<ErrorRecoveryOptions> = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 2000;
    this.fallbackEnabled = options.fallbackEnabled ?? true;
    this.userFeedback = options.userFeedback ?? true;
  }

  createError(
    type: MobileErrorState["type"],
    message: string,
    _originalError?: Error,
  ): MobileErrorState {
    const browserInfo = detectMobileBrowser();

    return {
      type,
      message: this.getLocalizedMessage(type, message, browserInfo),
      fallbackAvailable: this.fallbackEnabled && this.retryCount < this.maxRetries,
      retryable: this.retryCount < this.maxRetries,
    };
  }

  private getLocalizedMessage(
    type: MobileErrorState["type"],
    originalMessage: string,
    browserInfo: ReturnType<typeof detectMobileBrowser>,
  ): string {
    switch (type) {
      case "iframe_load_failed": {
        if (browserInfo.isMobileBrowser) {
          return t`Unable to display resume on this mobile device. This may be due to browser security restrictions.`;
        }
        return t`Failed to load resume content. Please check your internet connection and try again.`;
      }

      case "pdf_download_failed": {
        if (browserInfo.isIOS && browserInfo.isSafari) {
          return t`PDF downloads are limited on iOS Safari. The PDF will open in a new tab instead.`;
        }
        if (browserInfo.isMobileBrowser) {
          return t`PDF download failed on mobile device. Please try again or use a different browser.`;
        }
        return t`PDF download failed. Please check your browser settings and try again.`;
      }

      case "viewport_error": {
        if (browserInfo.isMobileBrowser) {
          return t`Display issue detected on mobile device. Try rotating your device or refreshing the page.`;
        }
        return t`Display issue detected. Please try refreshing the page or adjusting your browser window.`;
      }

      default: {
        return originalMessage || t`An unexpected error occurred. Please try again.`;
      }
    }
  }

  async handleError<T>(
    error: Error,
    type: MobileErrorState["type"],
    retryFn?: () => Promise<T>,
  ): Promise<{ success: boolean; result?: T; error?: MobileErrorState }> {
    const mobileError = this.createError(type, error.message, error);

    // If retry is available and function is provided
    if (mobileError.retryable && retryFn && this.retryCount < this.maxRetries) {
      this.retryCount++;

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

      try {
        const result = await retryFn();
        this.retryCount = 0; // Reset on success
        return { success: true, result };
      } catch (retryError) {
        // If we've exhausted retries, return the error
        if (this.retryCount >= this.maxRetries) {
          return {
            success: false,
            error: this.createError(type, (retryError as Error).message, retryError as Error),
          };
        }
        // Otherwise, try again
        return this.handleError(retryError as Error, type, retryFn);
      }
    }

    return { success: false, error: mobileError };
  }

  reset() {
    this.retryCount = 0;
  }

  getRetryCount() {
    return this.retryCount;
  }

  canRetry() {
    return this.retryCount < this.maxRetries;
  }
}

// Utility functions for common error scenarios
export const createIframeErrorHandler = () =>
  new MobileErrorHandler({
    maxRetries: 2,
    retryDelay: 3000,
    fallbackEnabled: true,
    userFeedback: true,
  });

export const createPDFDownloadErrorHandler = () =>
  new MobileErrorHandler({
    maxRetries: 1,
    retryDelay: 1000,
    fallbackEnabled: true,
    userFeedback: true,
  });

// Graceful degradation utilities
export const getGracefulFallback = (error: MobileErrorState) => {
  const browserInfo = detectMobileBrowser();

  switch (error.type) {
    case "iframe_load_failed": {
      return {
        showFallback: true,
        fallbackType: "error_message" as const,
        message: error.message,
        actions: [
          {
            label: t`Refresh Page`,
            action: () => {
              window.location.reload();
            },
          },
          ...(error.retryable ? [{ label: t`Try Again`, action: "retry" as const }] : []),
        ],
      };
    }

    case "pdf_download_failed": {
      return {
        showFallback: true,
        fallbackType: "alternative_download" as const,
        message: error.message,
        actions: [
          ...(browserInfo.isMobileBrowser
            ? [{ label: t`Open in Browser`, action: "open_browser" as const }]
            : [{ label: t`Try Different Browser`, action: "browser_suggestion" as const }]),
          ...(error.retryable ? [{ label: t`Try Again`, action: "retry" as const }] : []),
        ],
      };
    }

    case "viewport_error": {
      return {
        showFallback: true,
        fallbackType: "viewport_adjustment" as const,
        message: error.message,
        actions: [
          ...(browserInfo.isMobileBrowser
            ? [{ label: t`Rotate Device`, action: "rotate_suggestion" as const }]
            : [{ label: t`Adjust Window`, action: "window_suggestion" as const }]),
          {
            label: t`Refresh Page`,
            action: () => {
              window.location.reload();
            },
          },
        ],
      };
    }

    default: {
      return {
        showFallback: true,
        fallbackType: "generic_error" as const,
        message: error.message,
        actions: [
          {
            label: t`Refresh Page`,
            action: () => {
              window.location.reload();
            },
          },
        ],
      };
    }
  }
};
