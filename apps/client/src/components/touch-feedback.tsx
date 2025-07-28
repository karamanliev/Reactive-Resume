import { useMobileConfig } from "@reactive-resume/hooks";
import { cn } from "@reactive-resume/utils";
import { type ReactNode, useState } from "react";

type TouchFeedbackProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
};

export const TouchFeedback = ({
  children,
  className,
  disabled = false,
  onTouchStart,
  onTouchEnd,
}: TouchFeedbackProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const mobileConfig = useMobileConfig();

  // Only apply touch feedback on mobile devices
  if (!mobileConfig.isMobile) {
    return <div className={className}>{children}</div>;
  }

  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);
    onTouchStart?.();
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsPressed(false);
    onTouchEnd?.();
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    onTouchEnd?.();
  };

  return (
    <div
      className={cn(
        className,
        isPressed && !disabled && "scale-95 opacity-80",
        "transition-all duration-150 ease-out",
        disabled && "cursor-not-allowed opacity-50",
      )}
      style={{
        WebkitTapHighlightColor: "transparent", // Remove default mobile tap highlight
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
};
