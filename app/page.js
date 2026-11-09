"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ironManIcon from "../public/icon.jpg";
import {
  AlertCircle,
  ArrowUpRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import {
  api,
  getStoredUserSnapshot,
  subscribeToStoredUser,
} from "@/lib/api";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isHydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const storedUser = useSyncExternalStore(subscribeToStoredUser, getStoredUserSnapshot, () => "");
  const activeUser = useMemo(() => {
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, [storedUser]);

  useEffect(() => {
    if (isHydrated && activeUser?.appId) router.replace("/dashboard");
  }, [activeUser, isHydrated, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const appId = String(formData.get("appId") || "").trim();
    const passwordValue = String(formData.get("password") || "");

    if (!appId || !passwordValue) {
      setErrorMessage("Enter your App ID and password to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.login(appId, passwordValue);
      if (!response?.success) {
        throw new Error(response?.error || "Authentication failed. Check your credentials.");
      }

      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(error?.data?.error || error.message || "Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isHydrated || activeUser?.appId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" aria-label="Loading session" />
      </main>
    );
  }

  return (
    <main className="login-shell">
      <div className="login-art" aria-hidden="true">
        <Image
          src="/ironman-bg.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 100vw, 65vw"
          className="login-art-image"
        />
      </div>

      <div className="login-layout">
        <section className="brand-panel">
          <div className="brand-lockup">
            <span className="brand-mark">
              <Image src={ironManIcon} alt="Iron Man" width={38} height={38} />
            </span>
            <span>JARVIS<span className="brand-period">.</span></span>
          </div>
          <div className="brand-copy">
            <h1>Application health,<br />at a glance.</h1>
            <p className="brand-description">
              A simple, live view of your services and recent activity.
            </p>
          </div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-card">
            <div className="login-card-heading">
              <h2 id="login-title">Sign in</h2>
            </div>

            {errorMessage && (
              <div className="form-alert" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <label className="field-label" htmlFor="app-id">App ID</label>
              <input
                id="app-id"
                name="appId"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="Your application ID"
                defaultValue={process.env.NEXT_PUBLIC_DEFAULT_APP_ID || ""}
                key={`${isHydrated}-${process.env.NEXT_PUBLIC_DEFAULT_APP_ID || ""}`}
                required
              />

              <label className="field-label password-label" htmlFor="password">Password</label>
              <div className="password-field">
                <KeyRound size={16} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><LoaderCircle size={17} className="animate-spin" /> Connecting...</>
                ) : (
                  <>Continue <ArrowUpRight size={17} /></>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
