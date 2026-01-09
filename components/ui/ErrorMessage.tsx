import { AlertCircle, AlertTriangle, XCircle, Info, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorSeverity = "error" | "warning" | "info";

interface ErrorMessageProps {
  message: string;
  title?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
}

const severityConfig = {
  error: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-800",
    textColor: "text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-500",
    titleColor: "text-yellow-800",
    textColor: "text-yellow-700",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },
};

export function ErrorMessage({
  message,
  title,
  severity = "error",
  onRetry,
  onDismiss,
  className,
  showIcon = true,
}: ErrorMessageProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        )}

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn("font-semibold mb-1", config.titleColor)}>
              {title}
            </h3>
          )}
          <p className={cn("text-sm", config.textColor)}>{message}</p>

          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className={cn("mt-3 -ml-2", config.textColor)}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Opnieuw proberen
            </Button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors",
              config.textColor
            )}
            aria-label="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Inline error for form fields
interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <p className={cn("text-sm text-red-600 mt-1 flex items-center gap-1", className)}>
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

// Full page error state
interface FullPageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function FullPageError({
  title = "Er is iets misgegaan",
  message = "We konden de gevraagde informatie niet laden. Probeer het later opnieuw.",
  onRetry,
  onGoBack,
}: FullPageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Opnieuw proberen
          </Button>
        )}
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            Ga terug
          </Button>
        )}
      </div>
    </div>
  );
}

// Empty state (not an error, but often used together)
interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-12 h-12 mb-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {message && <p className="text-gray-500 mb-4 max-w-sm">{message}</p>}

      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
