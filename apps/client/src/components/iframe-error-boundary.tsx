import { t } from "@lingui/macro";
import type { MobileErrorState } from "@reactive-resume/hooks";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onError?: (error: MobileErrorState) => void;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class IframeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    const mobileError: MobileErrorState = {
      type: "iframe_load_failed",
      message: error.message || t`An unexpected error occurred while loading the resume.`,
      fallbackAvailable: true,
      retryable: true,
    };

    this.props.onError?.(mobileError);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
          <div className="space-y-4 text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {t`Something went wrong`}
            </div>
            <p className="max-w-md text-sm text-red-600 dark:text-red-400">
              {this.state.error?.message ??
                t`An unexpected error occurred while loading the resume content.`}
            </p>
            <button
              className="rounded bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
              onClick={() => {
                window.location.reload();
              }}
            >
              {t`Reload Page`}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
