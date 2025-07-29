import type { MobileResumeConfig } from "@reactive-resume/hooks";

export type IframeConfig = {
  width: string;
  height: string;
  style: React.CSSProperties;
  sandbox: string;
  allowFullScreen: boolean;
  loading: "lazy" | "eager";
};

export const createMobileIframeConfig = (
  config: MobileResumeConfig,
  format: string,
  pageSizeMap: Record<string, { width: number; height: number }>,
): IframeConfig => {
  const { isMobile, isTablet, iframe } = config;
  const pageSize = pageSizeMap[format] ?? pageSizeMap.a4;

  // Calculate responsive dimensions
  let width: string;
  let height: string;
  let style: React.CSSProperties;

  if (isMobile) {
    // On mobile, keep the original resume size but allow horizontal scrolling
    width = `${pageSize.width * 3.78}px`;
    height = `${pageSize.height * 3.78}px`;

    style = {
      width: `${pageSize.width}mm`,
      // eslint-disable-next-line lingui/no-unlocalized-strings
      overflow: "hidden",
      // eslint-disable-next-line lingui/no-unlocalized-strings
      border: "none",
      // eslint-disable-next-line lingui/no-unlocalized-strings
      display: "block",
      // eslint-disable-next-line lingui/no-unlocalized-strings
      margin: "0 auto",
    };
  } else if (isTablet) {
    // On tablet, use a balanced approach
    width = `${pageSize.width * 3.78}px`;
    height = `${pageSize.height * 3.78}px`;

    style = {
      width: `${pageSize.width}mm`,
      // eslint-disable-next-line lingui/no-unlocalized-strings
      overflow: "hidden",
      // eslint-disable-next-line lingui/no-unlocalized-strings
      border: "none",
    };
  } else {
    // Desktop - use original dimensions
    width = `${pageSize.width * 3.78}px`;
    height = `${pageSize.height * 3.78}px`;

    style = {
      width: `${pageSize.width}mm`,
      // eslint-disable-next-line lingui/no-unlocalized-strings
      overflow: "hidden",
      // eslint-disable-next-line lingui/no-unlocalized-strings
      border: "none",
    };
  }

  return {
    width,
    height,
    style,
    // eslint-disable-next-line lingui/no-unlocalized-strings
    sandbox: iframe.sandbox.join(" "),
    allowFullScreen: iframe.allowFullscreen,
    loading: iframe.loading,
  };
};
