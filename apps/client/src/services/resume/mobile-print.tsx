import { t } from "@lingui/macro";
import type { UrlDto } from "@reactive-resume/dto";
import { detectMobileBrowser } from "@reactive-resume/hooks";
import { useMutation } from "@tanstack/react-query";

import { toast } from "@/client/hooks/use-toast";
import { axios } from "@/client/libs/axios";

// Enhanced mobile-aware PDF download function
export const printResumeWithMobileSupport = async (data: { id: string }) => {
  const response = await axios.get<UrlDto>(`/resume/print/${data.id}`);
  return response.data;
};

// Mobile-specific download handler
export const handleMobilePDFDownload = (url: string, filename?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const browserInfo = detectMobileBrowser();

    try {
      if (browserInfo.isIOS && browserInfo.isSafari) {
        // iOS Safari - open in new tab (download not directly supported)
        const win = window.open(url, "_blank");
        if (win) {
          win.focus();
          resolve();
        } else {
          reject(new Error(t`Popup blocked. Please allow popups for this site.`));
        }
      } else if (browserInfo.isAndroid || (browserInfo.isIOS && !browserInfo.isSafari)) {
        // Android or iOS non-Safari - try direct download first, fallback to new tab
        try {
          // Create a temporary link element for download
          const link = document.createElement("a");
          link.href = url;
          link.download = filename ?? t`resume.pdf`;
          // eslint-disable-next-line lingui/no-unlocalized-strings
          link.target = "_blank";
          // eslint-disable-next-line lingui/no-unlocalized-strings
          link.rel = "noopener noreferrer";

          // Append to body, click, and remove
          document.body.append(link);
          link.click();
          link.remove();

          resolve();
        } catch {
          // Fallback to opening in new tab
          const win = window.open(url, "_blank");
          if (win) {
            win.focus();
            resolve();
          } else {
            reject(
              new Error(t`Unable to download or open PDF. Please check your browser settings.`),
            );
          }
        }
      } else {
        // Desktop or other browsers - standard new tab approach
        const win = window.open(url, "_blank");
        if (win) {
          win.focus();
          resolve();
        } else {
          reject(new Error(t`Popup blocked. Please allow popups for this site.`));
        }
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

export const useMobilePrintResume = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: printResumeFn,
  } = useMutation({
    mutationFn: printResumeWithMobileSupport,
    onError: (error) => {
      const message = error.message;
      const browserInfo = detectMobileBrowser();

      // Mobile-specific error messages
      let errorTitle = t`Oops, the server returned an error.`;
      let errorDescription = message;

      if (browserInfo.isMobileBrowser) {
        if (message.includes("popup") || message.includes("blocked")) {
          errorTitle = t`Download Blocked`;
          errorDescription = t`Please enable popups for this site to download the PDF.`;
        } else if (browserInfo.isIOS && browserInfo.isSafari) {
          errorTitle = t`iOS Safari Limitation`;
          errorDescription = t`PDF will open in a new tab. Use the share button to save it.`;
        }
      }

      toast({
        variant: "error",
        title: errorTitle,
        description: errorDescription,
      });
    },
  });

  const downloadPDF = async (id: string, filename?: string) => {
    try {
      const { url } = await printResumeFn({ id });
      await handleMobilePDFDownload(url, filename);

      // Show success message for mobile users
      const browserInfo = detectMobileBrowser();
      if (browserInfo.isMobileBrowser) {
        toast({
          variant: "success",
          title: t`PDF Ready`,
          description:
            browserInfo.isIOS && browserInfo.isSafari
              ? t`PDF opened in new tab. Use the share button to save it.`
              : t`PDF download started successfully.`,
        });
      }
    } catch (downloadError) {
      const error = downloadError as Error;
      toast({
        variant: "error",
        title: t`Download Failed`,
        description: error.message,
      });
    }
  };

  return {
    printResume: printResumeFn,
    downloadPDF,
    loading,
    error,
  };
};
