import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function SignUpPage() {
  const router = useRouter();
  const afdeling = router.query.afdeling as string | undefined;

  const afterSignUpUrl = afdeling
    ? `/setup?afdeling=${afdeling}`
    : "/setup";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp afterSignUpUrl={afterSignUpUrl} />
    </div>
  );
}
