import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Lock, Eye, EyeOff, AlertCircle, BookOpen, User, Building2 } from "lucide-react";
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
import {
  getRegistrationErrorMessage,
  hasRegistrationErrors,
  validateAuthorRegistration,
} from "@/features/auth/registerAuthor";
import { authApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { paymentsApi } from "@/lib/api/payments";

const JournalRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectStatus, setRedirectStatus] = useState<"idle" | "prefetching" | "navigating">("idle");
  const [displayProgress, setDisplayProgress] = useState(15);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
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

    const validationErrors = validateAuthorRegistration({
      name,
      email,
      password,
      confirmPassword,
      institution,
    });

    if (hasRegistrationErrors(validationErrors)) {
      setError(getRegistrationErrorMessage(validationErrors));
      return;
    }

    setIsLoading(true);
    setRedirectStatus("idle");
    setDisplayProgress(getRedirectFeedback("idle").progress);

    try {
      const { tokens, user } = await authApi.register({
        name,
        email,
        password,
        institution: institution || undefined,
      });

      login(tokens, user);

      toast({
        title: "Account created",
        description: "Welcome! Complete your submission fee to start submitting manuscripts.",
      });

      const paymentSettings = await queryClient
        .fetchQuery({
          queryKey: ["payment-settings"],
          queryFn: () => paymentsApi.getSettings(),
        })
        .catch(() => null);

      setTimeout(() => {
        void runPostSignInRedirect(
          prefetchRoute,
          navigate,
          paymentSettings?.enabled ? routes.payment : routes.dashboard,
          (status) => {
            setRedirectStatus(status);
          },
        ).catch(() => {
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
      const message = err instanceof ApiClientError ? err.message : "Unable to create account.";
      setError(message);
      setIsLoading(false);
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    }
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
                Register as an author
              </h1>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Create an author account to submit manuscripts, track your submissions, and receive
                editorial updates.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  Create your author account
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  Pay the one-time submission fee via bank transfer
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  Upload payment proof for admin verification
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  Submit your manuscript once payment is approved
                </li>
              </ul>
              <p className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                Already have an account?{" "}
                <Link to={routes.signin} className="text-blue-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="w-full max-w-md mx-auto lg:max-w-lg">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Author registration</h1>
                <p className="text-gray-600 text-sm mb-6">
                  Staff accounts are created by administrators. This form is for authors only.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Dr. Jane Author"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError("");
                        }}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="author@university.edu"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution (optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="institution"
                        type="text"
                        placeholder="University or research institute"
                        value={institution}
                        onChange={(e) => {
                          setInstitution(e.target.value);
                          setError("");
                        }}
                        className="pl-10 h-11 rounded-xl"
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
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        className="pl-10 pr-10 h-11 rounded-xl"
                        required
                        minLength={6}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        className="pl-10 pr-10 h-11 rounded-xl"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? redirectFeedback.label : "Create Author Account"}
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
                  Already have an account?{" "}
                  <Link to={routes.signin} className="text-blue-600 font-medium hover:underline">
                    Sign in
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

export default JournalRegister;
