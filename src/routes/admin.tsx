import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  Github,
  KeyRound,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";
import { verifyAdmin, updateApiUrl, changePassword } from "@/lib/study.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Control Panel — Study Hub" },
      { name: "description", content: "Admin control panel for Study Hub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Banner = { type: "success" | "error"; text: string } | null;

function AdminPage() {
  const login = useServerFn(verifyAdmin);
  const saveUrl = useServerFn(updateApiUrl);
  const changePw = useServerFn(changePassword);

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [apiUrl, setApiUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlBanner, setUrlBanner] = useState<Banner>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwBanner, setPwBanner] = useState<Banner>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await login({ data: { password } });
      if (res.ok) {
        setApiUrl(res.currentUrl);
        setAuthed(true);
      } else {
        setLoginError("Incorrect password. Please try again.");
      }
    } catch {
      setLoginError("Couldn't reach the server. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUrl(true);
    setUrlBanner(null);
    try {
      const res = await saveUrl({ data: { password, url: apiUrl } });
      if (res.ok) setApiUrl(res.apiUrl);
      setUrlBanner({ type: res.ok ? "success" : "error", text: res.message });
    } catch {
      setUrlBanner({ type: "error", text: "Something went wrong." });
    } finally {
      setSavingUrl(false);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBanner(null);
    if (newPassword !== confirmPassword) {
      setPwBanner({ type: "error", text: "Passwords do not match." });
      return;
    }
    setSavingPw(true);
    try {
      const res = await changePw({
        data: { currentPassword: password, newPassword },
      });
      if (res.ok) {
        setPassword(newPassword);
        setNewPassword("");
        setConfirmPassword("");
      }
      setPwBanner({ type: res.ok ? "success" : "error", text: res.message });
    } catch {
      setPwBanner({ type: "error", text: "Something went wrong." });
    } finally {
      setSavingPw(false);
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to study hub
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-semibold">Control Panel</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the master password to continue
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">Master password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  autoFocus
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              <Button type="submit" className="w-full" disabled={loggingIn}>
                {loggingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Unlock
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 md:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Control Panel
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Exit
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-5 py-10">
        {/* Repository link */}
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Github className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">
              مستودع المواد · Repository Link
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Paste a GitHub folder link or API URL. Regular browser links (e.g.
            <code className="mx-1 rounded bg-secondary px-1 py-0.5 text-xs">
              github.com/owner/repo/tree/main/folder
            </code>
            ) are automatically converted to the GitHub API format before
            saving. Every student sees the change instantly.
          </p>
          {urlBanner && (
            <div className="mb-4">
              <BannerView banner={urlBanner} />
            </div>
          )}
          <form onSubmit={handleSaveUrl} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">GitHub folder / API URL</Label>
              <Input
                id="apiUrl"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/tree/main/folder"
              />
            </div>
            <Button type="submit" disabled={savingUrl}>
              {savingUrl ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save & Update Globally
            </Button>
          </form>
        </section>

        {/* Change password */}
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
          <form onSubmit={handleChangePw} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newpw">New password</Label>
              <Input
                id="newpw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmpw">Confirm new password</Label>
              <Input
                id="confirmpw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {pwBanner && <BannerView banner={pwBanner} />}
            <Button type="submit" disabled={savingPw}>
              {savingPw ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Update Password
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}

function BannerView({ banner }: { banner: NonNullable<Banner> }) {
  const ok = banner.type === "success";
  return (
    <p
      className={`rounded-lg border px-4 py-2.5 text-sm ${
        ok
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
    >
      {banner.text}
    </p>
  );
}
