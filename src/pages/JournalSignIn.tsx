import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JournalHeader from "@/components/JournalHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/useAuth";
import { routes } from "@/app/routes";
import { prefetchRoute } from "@/app/prefetch";
import {
  getNextRedirectProgress,
  getRedirectFeedback,
  runPostSignInRedirect,
} from "@/features/auth/signInFlow";
import { useJournalStore } from "@/lib/store/store";
import { SEED_USERS } from "@/lib/store/seed";
import { ROLE_LABELS } from "@/lib/rbac/types";

const DEMO_ACCOUNTS = SEED_USERS.filter((u) => u.status === "active").map((u) => ({
  email: u.email,
  password: u.password,
  name: u.name,
  roles: u.roles.map((r) => ROLE_LABELS[r]).join(", "),
}));

const JournalSignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectStatus, setRedirectStatus] = useState<"idle" | "prefetching" | "navigating">("idle");
  const [displayProgress, setDisplayProgress] = useState(15);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const authenticate = useJournalStore((s) => s.authenticate);
  const redirectFeedback = getRedirectFeedback(redirectStatus);

  useEffect(() => {
    if (!isLoading) {
      setDisplayProgress(getRedirectFeedback("idle").progress);
      return;
    }

    const target = redirectStatus === "prefetching" ? 95 : redirectFeedback.progress;
    if (redirectStatus !== "prefetching") {
      setDisplayProgress(target);
      return;
    }

    const timer = window.setInterval(() => {
      setDisplayProgress((current) => getNextRedirectProgress(current, target));
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [isLoading, redirectFeedback.progress, redirectStatus]);

  if (isAuthenticated) {
    return <Navigate to={routes.dashboard} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setRedirectStatus("idle");
    setDisplayProgress(getRedirectFeedback("idle").progress);

    setTimeout(() => {
      const storeUser = authenticate(email, password);

      if (storeUser) {
        login({
          id: storeUser.id,
          name: storeUser.name,
          email: storeUser.email,
          roles: storeUser.roles,
          avatarUrl: storeUser.avatarUrl,
        });

        toast({
          title: "Welcome back!",
          description: `Signed in as ${storeUser.name}`,
        });

        setTimeout(() => {
          void runPostSignInRedirect(prefetchRoute, navigate, routes.dashboard, (status) => {
            setRedirectStatus(status);
          }).catch(() => {
            setIsLoading(false);
            setRedirectStatus("idle");
            toast({
              title: "Unable to open dashboard",
              description: "Please try again.",
              variant: "destructive",
            });
          });
        }, 500);
      } else {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
        toast({
          title: "Sign in failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    }, 400);
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="min-h-screen bg-white">
      <JournalHeader />

      <main className="pt-16 pb-20 min-h-[100dvh]">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            <div className="hidden lg:block space-y-6">
              <div className="inline-flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">SJMS</h2>
                  <p className="text-sm text-gray-600">Scientific Journal Management System</p>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                Manage the complete publication workflow
              </h1>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Sign in with a demo account below to explore role-based workflows for authors, editors, reviewers, and administrators.
              </p>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-3">Demo accounts</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemo(acc.email, acc.password)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{acc.name}</p>
                      <p className="text-xs text-gray-500">{acc.email} · {acc.roles}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto lg:max-w-lg">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
                <p className="text-gray-600 text-sm mb-6">Enter credentials or select a demo account</p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="staff@journal.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        className="pl-10 pr-10 h-11 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? redirectFeedback.label : "Sign In"}
                  </Button>

                  {isLoading && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  )}
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  New author?{" "}
                  <Link to={routes.register} className="text-blue-600 font-medium hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JournalSignIn;
