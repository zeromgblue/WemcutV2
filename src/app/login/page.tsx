import Link from "next/link";
import { Scissors } from "lucide-react";
import { loginWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm space-y-8 text-center">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-700">
            <Scissors className="w-4 h-4 text-black" />
          </div>
          <span className="text-lg font-medium tracking-tight">
            Wem<span className="text-amber-500">Cut</span>
          </span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">เข้าสู่ระบบ WemCut</h1>
          <p className="text-sm text-muted-foreground">
            เข้าสู่ระบบหรือสมัครสมาชิกด้วยบัญชี Google
          </p>
        </div>

        <form action={loginWithGoogle}>
          <Button type="submit" variant="outline" className="w-full gap-2.5">
            <GoogleIcon />
            เข้าสู่ระบบด้วย Google
          </Button>
        </form>

        {error && (
          <p className="text-sm text-destructive">
            เข้าสู่ระบบไม่สำเร็จ: {error}
          </p>
        )}
      </div>
    </div>
  );
}
