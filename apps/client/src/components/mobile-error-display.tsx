import { t } from "@lingui/macro";
import { ArrowClockwise, DeviceMobileCamera, Globe, Warning } from "@phosphor-icons/react";
import type { MobileErrorState } from "@reactive-resume/hooks";
import { Button } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

import { getGracefulFallback } from "@/client/utils/mobile-error-handler";

type MobileErrorDisplayProps = {
  error: MobileErrorState;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export const MobileErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
  className,
}: MobileErrorDisplayProps) => {
  const fallback = getGracefulFallback(error);

  const getErrorIcon = () => {
    switch (error.type) {
      case "iframe_load_failed": {
        return <Globe size={48} className="text-red-500" />;
      }
      case "pdf_download_failed": {
        return <DeviceMobileCamera size={48} className="text-orange-500" />;
      }
      case "viewport_error": {
        return <DeviceMobileCamera size={48} className="text-yellow-500" />;
      }
      default: {
        return <Warning size={48} className="text-red-500" />;
      }
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case "iframe_load_failed": {
        return t`Resume Loading Failed`;
      }
      case "pdf_download_failed": {
        return t`PDF Download Failed`;
      }
      case "viewport_error": {
        return t`Display Issue`;
      }
      default: {
        return t`Something Went Wrong`;
      }
    }
  };

  const handleAction = (action: string | (() => void)) => {
    if (typeof action === "function") {
      action();
    } else if (action === "retry" && onRetry) {
      onRetry();
    } else
      switch (action) {
        case "open_browser": {
          // For mobile browsers, suggest opening in default browser
          const currentUrl = window.location.href;
          if ("share" in navigator) {
            void navigator.share({ url: currentUrl });
          } else {
            window.open(currentUrl, "_blank");
          }

          break;
        }
        case "browser_suggestion": {
          // Show browser suggestion message
          alert(t`Try opening this page in Chrome, Firefox, or Safari for better compatibility.`);

          break;
        }
        case "rotate_suggestion": {
          // Show rotation suggestion
          alert(t`Try rotating your device to landscape mode for better viewing.`);

          break;
        }
        case "window_suggestion": {
          // Show window adjustment suggestion
          alert(t`Try adjusting your browser window size or zoom level.`);

          break;
        }
        // No default
      }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border p-8",
        "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
        "mx-auto min-h-[300px] max-w-md space-y-6 text-center",
        className,
      )}
    >
      {/* Error Icon */}
      <div className="shrink-0">{getErrorIcon()}</div>

      {/* Error Title */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getErrorTitle()}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{error.message}</p>
      </div>

      {/* Action Buttons */}
      {fallback.actions.length > 0 && (
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          {fallback.actions.map((actionItem, index) => (
            <Button
              key={index}
              variant={index === 0 ? "primary" : "outline"}
              size="sm"
              className="flex min-h-[40px] items-center gap-2"
              onClick={() => {
                handleAction(actionItem.action);
              }}
            >
              {actionItem.action === "retry" && <ArrowClockwise size={16} />}
              {actionItem.label}
            </Button>
          ))}
        </div>
      )}

      {/* Dismiss Button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onDismiss}
        >
          {t`Dismiss`}
        </Button>
      )}

      {/* Additional Help Text */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {error.type === "iframe_load_failed" && (
          <p>{t`If the problem persists, try refreshing the page or using a different browser.`}</p>
        )}
        {error.type === "pdf_download_failed" && (
          <p>{t`Some mobile browsers have limitations with PDF downloads. Try using the share button instead.`}</p>
        )}
        {error.type === "viewport_error" && (
          <p>{t`This issue is usually temporary and can be resolved by adjusting your device orientation.`}</p>
        )}
      </div>
    </div>
  );
};
