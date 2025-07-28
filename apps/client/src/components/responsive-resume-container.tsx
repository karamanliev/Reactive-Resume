import { useMobileConfig } from "@reactive-resume/hooks";
import { cn, pageSizeMap } from "@reactive-resume/utils";
import type { ReactNode } from "react";

type ResponsiveResumeContainerProps = {
  format: keyof typeof pageSizeMap;
  children: ReactNode;
  className?: string;
};

export const ResponsiveResumeContainer = ({
  format,
  children,
  className,
}: ResponsiveResumeContainerProps) => {
  const mobileConfig = useMobileConfig();
  const { isMobile, isTablet } = mobileConfig;

  const pageSize = pageSizeMap[format];

  if (isMobile) {
    return (
      <div className={cn("w-full p-4", "print:m-0 print:p-0", className)}>
        <div className="w-full overflow-x-auto">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg shadow-lg",
              "bg-white dark:bg-gray-900",
              "print:rounded-none print:shadow-none",
            )}
            style={{ minWidth: `${pageSize.width * 3.78}px` }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className={cn("w-full p-6", "print:m-0 print:p-0", className)}>
        <div className="mx-auto" style={{ maxWidth: `${Math.min(pageSize.width * 3.78, 600)}px` }}>
          <div
            className={cn(
              "relative overflow-hidden rounded-xl shadow-xl",
              "bg-white dark:bg-gray-900",
              "print:rounded-none print:shadow-none",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Desktop - original behavior
  return (
    <div className={cn("sm:mx-auto sm:my-16", "print:m-0", className)}>
      <div
        style={{ width: `${pageSize.width}mm` }}
        className={cn("relative z-50 overflow-hidden rounded shadow-xl", "print:shadow-none")}
      >
        {children}
      </div>
    </div>
  );
};
