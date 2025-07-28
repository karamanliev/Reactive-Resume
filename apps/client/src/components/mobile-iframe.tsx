import { t } from "@lingui/macro";
import { type MobileErrorState, useMobileConfig } from "@reactive-resume/hooks";
import { pageSizeMap } from "@reactive-resume/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { createMobileIframeConfig } from "@/client/utils/mobile-iframe-config";

type MobileIframeProps = {
  src: string;
  title: string;
  format: keyof typeof pageSizeMap;
  onLoad?: () => void;
  onError?: (error: MobileErrorState) => void;
  onMessage?: (event: MessageEvent) => void;
};

export const MobileIframe = ({
  src,
  title,
  format,
  onLoad,
  onError,
  onMessage,
}: MobileIframeProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const mobileConfig = useMobileConfig();
  const iframeConfig = createMobileIframeConfig(mobileConfig, format, pageSizeMap);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);

    const error: MobileErrorState = {
      type: "iframe_load_failed",
      message: t`Failed to load resume content. This may be due to mobile browser restrictions.`,
      fallbackAvailable: retryCount < 2,
      retryable: true,
    };

    onError?.(error);
  }, [onError, retryCount]);

  const handleRetry = useCallback(() => {
    if (retryCount < 2) {
      setRetryCount((prev) => prev + 1);
      setIsLoading(true);
      setHasError(false);

      // Force iframe reload
      if (frameRef.current) {
        const currentSrc = frameRef.current.src;
        frameRef.current.src = "";
        frameRef.current.src = currentSrc;
      }
    }
  }, [retryCount]);

  // Handle postMessage communication
  useEffect(() => {
    const currentFrame = frameRef.current;
    if (!currentFrame?.contentWindow) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      // Handle mobile-specific message types
      if (event.data.type === "PAGE_LOADED") {
        // For mobile, keep the original dimensions to allow horizontal scrolling
        const { width, height } = event.data.payload;
        currentFrame.width = width;
        currentFrame.height = height;
      }

      onMessage?.(event);
    };

    currentFrame.contentWindow.addEventListener("message", handleMessage);

    return () => {
      currentFrame.contentWindow?.removeEventListener("message", handleMessage);
    };
  }, [mobileConfig, onMessage]);

  // Loading timeout for mobile devices
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(
      () => {
        if (!hasError) {
          handleError();
        }
      },
      mobileConfig.isMobile ? 10_000 : 15_000,
    ); // Shorter timeout for mobile

    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading, hasError, handleError, mobileConfig.isMobile]);

  if (hasError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-gray-50 p-8 dark:bg-gray-900">
        <div className="space-y-4 text-center">
          <div className="text-lg font-semibold text-red-500">{t`Resume Loading Error`}</div>
          <p className="max-w-md text-gray-600 dark:text-gray-400">
            {mobileConfig.isMobile
              ? t`Unable to display resume on this mobile device. This may be due to browser restrictions.`
              : t`Failed to load resume content. Please try refreshing the page.`}
          </p>
          {retryCount < 2 && (
            <button
              className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              onClick={handleRetry}
            >
              {t`Try Again`} ({2 - retryCount} {t`attempts left`})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center space-y-2">
            <div className="size-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t`Loading resume...`}</p>
          </div>
        </div>
      )}

      <iframe
        ref={frameRef}
        title={title}
        src={src}
        width={iframeConfig.width}
        height={iframeConfig.height}
        style={iframeConfig.style}
        sandbox={iframeConfig.sandbox}
        allowFullScreen={iframeConfig.allowFullScreen}
        loading={iframeConfig.loading}
        className="transition-opacity duration-300"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};
