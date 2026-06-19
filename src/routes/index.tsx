import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  FileText,
  FileType,
  Folder,
  GraduationCap,
  Home,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { getApiUrl } from "@/lib/study.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Hub — Repository Explorer" },
      {
        name: "description",
        content:
          "Browse and open the latest study materials in a live, cloud-synced GitHub file explorer.",
      },
      { property: "og:title", content: "Study Hub — Repository Explorer" },
      {
        property: "og:description",
        content:
          "A cloud-synced educational file explorer — open study materials instantly.",
      },
    ],
  }),
  component: Dashboard,
});

type GithubItem = {
  name: string;
  path: string;
  type: "dir" | "file";
  download_url: string | null;
  url: string;
  size: number;
};

type Crumb = { name: string; url: string };

function isPdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Dashboard() {
  const fetchApiUrl = useServerFn(getApiUrl);
  const [rootUrl, setRootUrl] = useState<string>("");
  const [items, setItems] = useState<GithubItem[]>([]);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFolder = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) {
        throw new Error(`GitHub responded with ${res.status}`);
      }
      const data = await res.json();
      const list: GithubItem[] = Array.isArray(data) ? data : [data];
      list.sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setItems(list);
    } catch (e) {
      console.error("Error fetching repository structure:", e);
      setError(
        "Couldn't load the repository. Check that the link is set correctly in the control panel.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchApiUrl()
      .then((res) => {
        if (!active) return;
        if (!res.apiUrl) {
          setError("No repository link has been set yet. Visit the control panel.");
          setLoading(false);
          return;
        }
        setRootUrl(res.apiUrl);
        setCrumbs([{ name: "Home", url: res.apiUrl }]);
        loadFolder(res.apiUrl);
      })
      .catch(() => {
        if (active) {
          setError("Couldn't reach the server. Please refresh.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fetchApiUrl, loadFolder]);

  const openDir = (item: GithubItem) => {
    setCrumbs((prev) => [...prev, { name: item.name, url: item.url }]);
    loadFolder(item.url);
  };

  const goToCrumb = (index: number) => {
    const target = crumbs[index];
    setCrumbs((prev) => prev.slice(0, index + 1));
    loadFolder(target.url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-5 py-4 border-b border-border md:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>Study Hub</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Control Panel · لوحة التحكم</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 py-10 md:py-14">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            استكشف الملفات
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              Repository Explorer
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Browse folders and open study materials instantly — always synced
            from the cloud.
          </p>
        </div>

        {crumbs.length > 0 && !error && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {crumbs.map((c, i) => (
                <span key={`${c.url}-${i}`} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <button
                    onClick={() => goToCrumb(i)}
                    disabled={i === crumbs.length - 1}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-secondary disabled:opacity-100 disabled:hover:bg-transparent"
                  >
                    {i === 0 && <Home className="h-3.5 w-3.5" />}
                    <span
                      className={
                        i === crumbs.length - 1
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {c.name}
                    </span>
                  </button>
                </span>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadFolder(crumbs[crumbs.length - 1].url)}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="mx-auto mt-10 max-w-md rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            This folder is empty.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            {items.map((item, idx) => {
              const isDir = item.type === "dir";
              const Icon = isDir ? Folder : isPdf(item.name) ? FileType : FileText;

              if (isDir) {
                return (
                  <button
                    key={item.path || `${item.name}-${idx}`}
                    onClick={() => openDir(item)}
                    className="group flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition last:border-b-0 hover:bg-secondary/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {item.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        مجلد · Folder
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </button>
                );
              }

              return (
                <a
                  key={item.path || `${item.name}-${idx}`}
                  href={
                    item.download_url 
                      ? item.download_url.includes("raw.githubusercontent.com")
                        ? item.download_url.replace("raw.githubusercontent.com", "github.com").replace("/main/", "/raw/main/")
                        : item.download_url
                      : "#"
                  }
                  download={item.name}
                  className="group flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition last:border-b-0 hover:bg-secondary/60"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isPdf(item.name)
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {isPdf(item.name) ? "PDF" : "File"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                </a>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-sm text-muted-foreground">
        Powered by a cloud database — updates reach every student instantly.
      </footer>
    </div>
  );
}