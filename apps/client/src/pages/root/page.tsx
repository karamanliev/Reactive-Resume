import { CircleNotch, FilePdf } from "@phosphor-icons/react";
import { type MobileErrorState, useMobileConfig } from "@reactive-resume/hooks";
import { Button, ScrollArea } from "@reactive-resume/ui";
import { pageSizeMap } from "@reactive-resume/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLoaderData } from "react-router";

import { IframeErrorBoundary } from "@/client/components/iframe-error-boundary";
import { MobileErrorDisplay } from "@/client/components/mobile-error-display";
import { MobileIframe } from "@/client/components/mobile-iframe";
import { ResponsiveResumeContainer } from "@/client/components/responsive-resume-container";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { TouchFeedback } from "@/client/components/touch-feedback";
import { usePrintResume } from "@/client/services/resume";
import { createIframeErrorHandler } from "@/client/utils/mobile-error-handler";

import { Footer } from "../home/components/footer";
import { Header } from "../home/components/header";
import { HomePage } from "../home/page";

// Open PDF in new tab for consistent cross-platform experience
const openPDF = (url: string) => {
  // Open PDF in new tab - gives users control over what to do with it
  const newWindow = window.open(url, "_blank");
  if (newWindow) {
    newWindow.focus();
  } else {
    // Fallback if popup is blocked - navigate to PDF directly
    window.location.href = url;
  }
};

export const RootPage = () => {
  const { resume } = useLoaderData();
  const [currentError, setCurrentError] = useState<MobileErrorState | null>(null);
  const [iframeKey, setIframeKey] = useState(0); // For forcing iframe reload

  const mobileConfig = useMobileConfig();
  const { printResume, loading } = usePrintResume();
  const errorHandler = createIframeErrorHandler();

  // Always call hooks at the top level
  const frameRef = useRef<HTMLIFrameElement>(null);

  const updateResumeInFrame = useCallback(() => {
    if (!resume) return;
    const message = { type: "SET_RESUME", payload: resume.data };

    // Send message to iframe after a short delay to ensure it's loaded
    setTimeout(() => {
      const iframe = document.querySelector(`iframe[title="${resume.title}"]`);
      if (iframe && "contentWindow" in iframe) {
        (iframe as HTMLIFrameElement).contentWindow?.postMessage(message, "*");
      }
    }, 100);
  }, [resume]);

  const handleIframeLoad = useCallback(() => {
    setCurrentError(null);
    updateResumeInFrame();
  }, [updateResumeInFrame]);

  const handleIframeError = useCallback((error: MobileErrorState) => {
    setCurrentError(error);
  }, []);

  const handleRetryIframe = useCallback(() => {
    setCurrentError(null);
    setIframeKey((prev) => prev + 1); // Force iframe reload
    errorHandler.reset();
  }, [errorHandler]);

  const handleDismissError = useCallback(() => {
    setCurrentError(null);
  }, []);

  useEffect(() => {
    if (!frameRef.current?.contentWindow || !resume) return;

    const handleMessage = (event: MessageEvent) => {
      if (!frameRef.current?.contentWindow) return;
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "PAGE_LOADED") {
        frameRef.current.width = event.data.payload.width;
        frameRef.current.height = event.data.payload.height;
        frameRef.current.contentWindow.removeEventListener("message", handleMessage);
      }
    };

    frameRef.current.contentWindow.addEventListener("message", handleMessage);

    return () => {
      frameRef.current?.contentWindow?.removeEventListener("message", handleMessage);
    };
  }, [resume]);

  const onDownloadPdf = async () => {
    if (!resume) return;
    const { url } = await printResume({ id: resume.id });
    openPDF(url);
  };

  // If no resume data is available, render the default home page with layout
  if (!resume) {
    return (
      <ScrollArea orientation="vertical" className="h-screen">
        <Header />
        <HomePage />
        <Footer />
      </ScrollArea>
    );
  }

  // Render the resume without the home layout
  const { title, data: resumeData } = resume;
  const format = resumeData.metadata.page.format as keyof typeof pageSizeMap;

  // For mobile devices, use the mobile-aware components
  if (mobileConfig.isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
          <title>{title} - Resume</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
        </Helmet>

        <ResponsiveResumeContainer format={format}>
          <IframeErrorBoundary onError={handleIframeError}>
            {currentError ? (
              <MobileErrorDisplay
                error={currentError}
                onRetry={handleRetryIframe}
                onDismiss={handleDismissError}
              />
            ) : (
              <MobileIframe
                key={iframeKey}
                src="/artboard/preview"
                title={title}
                format={format}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}
          </IframeErrorBoundary>
        </ResponsiveResumeContainer>

        {/* Mobile theme switch - left side */}
        <div className="fixed bottom-4 left-4 z-50 print:hidden">
          <TouchFeedback>
            <div className="rounded-full border bg-background/80 p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl">
              <ThemeSwitch />
            </div>
          </TouchFeedback>
        </div>

        {/* Mobile PDF download button - right side */}
        <div className="fixed bottom-4 right-4 z-50 print:hidden">
          <TouchFeedback>
            <Button
              size="icon"
              variant="ghost"
              disabled={loading}
              className="min-h-[48px] min-w-[48px] rounded-full border bg-background/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
              onClick={onDownloadPdf}
            >
              {loading ? <CircleNotch size={24} className="animate-spin" /> : <FilePdf size={24} />}
            </Button>
          </TouchFeedback>
        </div>
      </div>
    );
  }

  // For desktop, use the original layout
  return (
    <div>
      <Helmet>
        <title>
          {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
          {title} - Resume
        </title>
      </Helmet>

      <div
        style={{ width: `${pageSizeMap[format].width}mm` }}
        className="relative z-50 overflow-hidden rounded shadow-xl sm:mx-auto sm:my-16 print:m-0 print:shadow-none"
      >
        <iframe
          key={iframeKey}
          ref={frameRef}
          title={title}
          src="/artboard/preview"
          style={{
            width: `${pageSizeMap[format].width}mm`,
            height: `${pageSizeMap[format].height}mm`,
            overflow: "hidden",
          }}
          onLoad={handleIframeLoad}
        />
      </div>

      <div className="fixed bottom-5 right-5 z-0 hidden sm:block print:hidden">
        <div className="flex flex-col items-center gap-y-2">
          <Button size="icon" variant="ghost" onClick={onDownloadPdf}>
            {loading ? <CircleNotch size={20} className="animate-spin" /> : <FilePdf size={20} />}
          </Button>

          <ThemeSwitch />
        </div>
      </div>
    </div>
  );
};
