import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { JournalLogo } from "@/components/JournalLogo";
import JournalHeader from "@/components/JournalHeader";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/useAuth";
import { routes } from "@/app/routes";
import { prefetchRoute } from "@/app/prefetch";
import {
  getNextRedirectProgress,
  getRedirectFeedback,
  runPostSignInRedirect,
} from "@/features/auth/signInFlow";
import { authApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { SEED_DEMO_AUTHORS, SEED_USERS } from "@/lib/store/seed";
import { ROLE_LABELS } from "@/lib/rbac/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80";

const DEMO_ACCOUNTS = [...SEED_USERS, ...SEED_DEMO_AUTHORS]
  .filter((u) => u.status === "active")
  .map((u) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setRedirectStatus("idle");
    setDisplayProgress(getRedirectFeedback("idle").progress);

    try {
      const { tokens, user } = await authApi.login(email, password);
      login(tokens, user);

      toast({
        title: "Welcome back!",
        description: `Signed in as ${user.name}`,
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
      }, 300);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Invalid email or password. Please try again.";
      setError(message);
      setIsLoading(false);
      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <JournalHeader />

      <main className="pb-16">
        <section className="flex min-h-[100dvh] flex-col bg-white">
          <div className="relative flex flex-[1.05] flex-col justify-end overflow-hidden px-6 pb-10 pt-24 md:px-12 lg:px-16 lg:pb-14">
            <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-12 md:items-end md:gap-12">
              <div className="md:col-span-4">
                <p className="font-sans text-sm font-semibold text-gray-900">Editorial workspace</p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
                  Sign in to manage submissions, reviews, and publication for TUES Economics Journal.
                </p>
                <Link
                  to={routes.home}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 transition-colors hover:text-gray-700"
                >
                  Back to journal
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="md:col-span-8">
                <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-wide text-black sm:text-5xl md:text-6xl">
                  Sign in
                </h1>
                <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
                  For authors, editors, reviewers, and editorial staff.
                </p>

                {error && (
                  <div className="mt-6 flex max-w-xl items-start gap-3 border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-5">
                  <label className="group flex items-center gap-3 border-b border-gray-900/15 pb-3 transition-colors focus-within:border-oxford-blue">
                    <span className="sr-only">Email</span>
                    <Mail
                      className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-focus-within:text-oxford-blue"
                      aria-hidden
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Email address"
                      autoComplete="email"
                      required
                      className="min-w-0 flex-1 border-0 bg-transparent py-2 text-lg leading-none text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </label>

                  <label className="group flex items-center gap-3 border-b border-gray-900/15 pb-3 transition-colors focus-within:border-oxford-blue">
                    <span className="sr-only">Password</span>
                    <Lock
                      className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-focus-within:text-oxford-blue"
                      aria-hidden
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                      className="min-w-0 flex-1 border-0 bg-transparent py-2 text-lg leading-none text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="shrink-0 text-gray-400 transition-colors hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </label>

                  <div className="flex flex-col gap-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#1a3a2f] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[#142e26] disabled:opacity-70"
                    >
                      {isLoading ? redirectFeedback.label : "Sign in"}
                    </button>
                    <Link
                      to={routes.register}
                      className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      New author? Create an account →
                    </Link>
                  </div>

                  {isLoading && (
                    <div className="h-1 max-w-xl overflow-hidden bg-gray-100">
                      <div
                        className="h-full bg-[#1a3a2f] transition-all duration-300"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          <div className="relative h-[40%] min-h-[200px] overflow-hidden bg-oxford-dark">
            <img
              src={HERO_IMAGE}
              alt=""
              className="h-full w-full object-cover animate-hero-image-zoom"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <JournalLogo
              alt=""
              className="absolute bottom-6 left-6 h-10 w-auto drop-shadow-md md:bottom-8 md:left-10 md:h-11"
            />
          </div>
        </section>

        <section className="bg-white px-6 py-20 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Demo</p>
                <h2 className="mt-1 font-serif text-3xl font-bold tracking-wide text-black md:text-4xl">
                  Try a role
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-gray-600">
                Pick an account to pre-fill the form above, then sign in.
              </p>
            </div>

            <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button
                    type="button"
                    onClick={() => fillDemo(acc.email, acc.password)}
                    className="group flex w-full items-center justify-between border-b border-gray-200 py-3.5 text-left transition-colors hover:border-gray-400"
                  >
                    <span className="min-w-0 pr-3">
                      <span className="block text-sm font-medium text-gray-900 group-hover:text-black">
                        {acc.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-gray-500">{acc.roles}</span>
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                    >
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default JournalSignIn;
