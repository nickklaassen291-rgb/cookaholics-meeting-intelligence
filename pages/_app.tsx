import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import ErrorBoundary from "@/components/ErrorBoundary";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ClerkProvider {...pageProps}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <Component {...pageProps} />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
