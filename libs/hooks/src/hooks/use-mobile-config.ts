import { useMemo } from "react";

import { useBreakpoint } from "./use-breakpoint";

export type MobileResumeConfig = {
  isMobile: boolean;
  isTablet: boolean;
  showMobileUI: boolean;
  viewport: {
    width: number;
    height: number;
    scale: number;
  };
  iframe: {
    allowFullscreen: boolean;
    sandbox: string[];
    loading: "lazy" | "eager";
    scrolling: "auto" | "yes" | "no";
  };
  download: {
    strategy: "newTab" | "direct" | "fallback";
    buttonPosition: "fixed" | "inline";
    touchTargetSize: number;
  };
};

export type MobileErrorState = {
  type: "iframe_load_failed" | "pdf_download_failed" | "viewport_error";
  message: string;
  fallbackAvailable: boolean;
  retryable: boolean;
};

export const useMobileConfig = (): MobileResumeConfig => {
  const { isMobile, isTablet, isDesktop, devicePixelRatio } = useBreakpoint();

  const config = useMemo((): MobileResumeConfig => {
    const showMobileUI = isMobile || isTablet;

    return {
      isMobile,
      isTablet,
      showMobileUI,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: devicePixelRatio,
      },
      iframe: {
        allowFullscreen: true,
        sandbox: [
          "allow-same-origin",
          "allow-scripts",
          "allow-forms",
          "allow-popups",
          "allow-popups-to-escape-sandbox",
        ],
        loading: isMobile ? "eager" : "lazy",
        scrolling: "auto",
      },
      download: {
        strategy: isMobile ? "newTab" : "direct",
        buttonPosition: "fixed",
        touchTargetSize: isMobile ? 48 : 40, // 48px minimum for mobile touch targets
      },
    };
  }, [isMobile, isTablet, devicePixelRatio]);

  return config;
};

// Mobile browser detection utility
export const detectMobileBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = userAgent.includes("android");
  const isSafari = userAgent.includes("safari") && !userAgent.includes("chrome");
  const isChrome = userAgent.includes("chrome");
  const isFirefox = userAgent.includes("firefox");
  const isSamsungBrowser = userAgent.includes("samsungbrowser");

  return {
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isSamsungBrowser,
    isMobileBrowser: isIOS || isAndroid,
    supportsDownload: !isIOS || !isSafari, // iOS Safari has download limitations
  };
};
