import { t } from "@lingui/macro";
import { CircleNotch, FilePdf } from "@phosphor-icons/react";
import { Button, ScrollArea } from "@reactive-resume/ui";
import { pageSizeMap } from "@reactive-resume/utils";
import { useCallback, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useLoaderData } from "react-router";

import { ThemeSwitch } from "@/client/components/theme-switch";
import { usePrintResume } from "@/client/services/resume";

import { Footer } from "../home/components/footer";
import { Header } from "../home/components/header";
import { HomePage } from "../home/page";

const openInNewTab = (url: string) => {
  const win = window.open(url, "_blank");
  if (win) win.focus();
};

export const RootPage = () => {
  const { resume } = useLoaderData();

  // Always call hooks at the top level
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { printResume, loading } = usePrintResume();

  const updateResumeInFrame = useCallback(() => {
    if (!resume) return;
    const message = { type: "SET_RESUME", payload: resume.data };

    setImmediate(() => {
      frameRef.current?.contentWindow?.postMessage(message, "*");
    });
  }, [resume]);

  useEffect(() => {
    if (!frameRef.current || !resume) return;
    frameRef.current.addEventListener("load", updateResumeInFrame);
    return () => frameRef.current?.removeEventListener("load", updateResumeInFrame);
  }, [updateResumeInFrame, resume]);

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
    openInNewTab(url);
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

  return (
    <div>
      <Helmet>
        <title>
          {title} - {t`Resume`}
        </title>
      </Helmet>

      <div
        style={{ width: `${pageSizeMap[format].width}mm` }}
        className="relative z-50 overflow-hidden rounded shadow-xl sm:mx-auto sm:my-16 print:m-0 print:shadow-none"
      >
        <iframe
          ref={frameRef}
          title={title}
          src="/artboard/preview"
          style={{ width: `${pageSizeMap[format].width}mm`, overflow: "hidden" }}
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
