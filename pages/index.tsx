import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, CheckSquare, FileText, Mic } from "lucide-react";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              C
            </div>
            <span className="font-semibold">Cookaholics Meeting Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Never Miss Another
            <span className="block text-primary">Meeting Insight</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AI-powered meeting intelligence for Cookaholics. Automatically transcribe,
            summarize, and extract action items from all your department meetings.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Everything You Need for Meeting Intelligence
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              From transcription to action item tracking, we&apos;ve got you covered.
            </p>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Dutch Transcription</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Accurate Dutch transcription powered by OpenAI Whisper API.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">AI Summaries</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get concise 5-bullet summaries of every meeting via Claude AI.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Action Items</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Automatically extract action items with owners and deadlines.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Weekly Reports</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Automated weekly and monthly reports for departments and MT.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Departments Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Built for All Departments
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Keuken, Sales, Marketing, and MT - each with their own dashboard and insights.
            </p>

            <div className="mt-16 grid gap-4 md:grid-cols-4">
              {["Keuken", "Sales", "Marketing", "MT"].map((dept) => (
                <div
                  key={dept}
                  className="rounded-lg border bg-card p-6 text-center transition-colors hover:border-primary"
                >
                  <h3 className="text-xl font-semibold">{dept}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {dept === "MT"
                      ? "Full visibility across all departments"
                      : `Daily, weekly, and monthly ${dept.toLowerCase()} meetings`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Cookaholics Meeting Intelligence v1.0</p>
        </div>
      </footer>
    </div>
  );
}
