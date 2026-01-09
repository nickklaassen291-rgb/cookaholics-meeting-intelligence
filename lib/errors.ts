/**
 * Error handling utilities for the application
 */

// Custom error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Je moet ingelogd zijn om deze actie uit te voeren") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Je hebt geen toestemming voor deze actie") {
    super(message, "AUTHORIZATION_ERROR", 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} niet gevonden`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Te veel verzoeken. Probeer het later opnieuw.") {
    super(message, "RATE_LIMIT", 429);
    this.name = "RateLimitError";
  }
}

export class ServerError extends AppError {
  constructor(message: string = "Er is een serverfout opgetreden") {
    super(message, "SERVER_ERROR", 500);
    this.name = "ServerError";
  }
}

// Error message mapping for user-friendly messages
const errorMessages: Record<string, string> = {
  UNAUTHENTICATED: "Je moet ingelogd zijn om deze actie uit te voeren",
  UNAUTHORIZED: "Je hebt geen toestemming voor deze actie",
  FORBIDDEN: "Je hebt geen toegang tot deze resource",
  NOT_FOUND: "De gevraagde informatie kon niet worden gevonden",
  VALIDATION_ERROR: "De ingevoerde gegevens zijn ongeldig",
  RATE_LIMIT: "Te veel verzoeken. Probeer het later opnieuw.",
  SERVER_ERROR: "Er is een serverfout opgetreden. Probeer het later opnieuw.",
  NETWORK_ERROR: "Geen internetverbinding. Controleer je verbinding en probeer opnieuw.",
  TIMEOUT: "Het verzoek duurde te lang. Probeer het opnieuw.",
  UNKNOWN: "Er is een onverwachte fout opgetreden",
};

// Get user-friendly error message
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for Convex error patterns
    if (error.message.includes("AuthError")) {
      const match = error.message.match(/AuthError: (.+)/);
      return match ? match[1] : errorMessages.FORBIDDEN;
    }

    // Check for network errors
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return errorMessages.NETWORK_ERROR;
    }

    // Check for timeout
    if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      return errorMessages.TIMEOUT;
    }

    // Return the error message if it seems user-friendly (contains Dutch text)
    if (/[a-z]+ (je|de|het|een|geen|niet|zijn|wordt|kan|moet)/i.test(error.message)) {
      return error.message;
    }
  }

  return errorMessages.UNKNOWN;
}

// Parse API error response
export async function parseApiError(response: Response): Promise<AppError> {
  try {
    const data = await response.json();
    return new AppError(
      data.error || data.message || errorMessages.UNKNOWN,
      data.code || "API_ERROR",
      response.status,
      data.details
    );
  } catch {
    return new AppError(
      errorMessages.UNKNOWN,
      "API_ERROR",
      response.status
    );
  }
}

// Error logger for client-side errors
interface ErrorLogContext {
  userId?: string;
  action?: string;
  component?: string;
  extra?: Record<string, unknown>;
}

export function logClientError(error: unknown, context?: ErrorLogContext): void {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
    ...context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Client Error]", errorDetails);
  }

  // In production, send to error tracking service
  // sendToErrorService(errorDetails);
}

// API fetch wrapper with error handling
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new AppError(errorMessages.NETWORK_ERROR, "NETWORK_ERROR", 0);
    }

    throw new ServerError();
  }
}

// Convex error handler for use in React components
export function handleConvexError(error: unknown): string {
  if (error instanceof Error) {
    // Extract message from Convex error format
    const message = error.message;

    // Check for AuthError pattern
    if (message.includes("AuthError:")) {
      const match = message.match(/AuthError: ([^"]+)/);
      if (match) return match[1].trim();
    }

    // Check if it's a user-friendly Dutch message
    if (/[a-z]+ (je|de|het|een|geen|niet|zijn|wordt|kan|moet)/i.test(message)) {
      return message;
    }
  }

  return getUserFriendlyMessage(error);
}
