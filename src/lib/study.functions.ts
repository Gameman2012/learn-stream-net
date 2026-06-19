import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Normalize any GitHub folder URL into a valid GitHub REST API contents URL.
 * Accepts:
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo/tree/branch/path/to/folder
 *   - https://api.github.com/repos/owner/repo/contents/path  (passed through)
 */
export function toGithubApiUrl(url: string): string {
  let value = url.trim();
  if (!value) return "";

  // Already an API URL — keep as-is.
  if (value.includes("api.github.com")) {
    return value;
  }

  // Match a standard github.com URL.
  const match = value.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.*))?)?/i,
  );
  if (!match) return value;

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");
  const branch = match[3];
  const path = match[4] ? `/${match[4].replace(/\/+$/, "")}` : "";

  let api = `https://api.github.com/repos/${owner}/${repo}/contents${path}`;
  if (branch) {
    api += `?ref=${branch}`;
  }
  return api;
}

/** Public: fetch the active GitHub API folder URL from the cloud. */
export const getApiUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { data, error } = await supabaseAdmin
    .from("app_settings" as never)
    .select("github_api_url")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error("getApiUrl error:", error?.message);
    return { apiUrl: "" };
  }
  return { apiUrl: (data as { github_api_url: string }).github_api_url ?? "" };
});

/** Admin: verify the master password against the cloud database. */
export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("app_settings" as never)
      .select("admin_password, github_api_url")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      console.error("verifyAdmin error:", error?.message);
      return { ok: false, currentUrl: "" };
    }

    const r = row as { admin_password: string; github_api_url: string };
    if (r.admin_password !== data.password) {
      return { ok: false, currentUrl: "" };
    }
    return { ok: true, currentUrl: r.github_api_url ?? "" };
  });

/** Admin: update the active GitHub API folder URL globally. */
export const updateApiUrl = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        password: z.string().min(1).max(200),
        url: z.string().trim().max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("app_settings" as never)
      .select("id, admin_password")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      return { ok: false, message: "Could not reach the database.", apiUrl: "" };
    }

    const r = row as { id: number; admin_password: string };
    if (r.admin_password !== data.password) {
      return { ok: false, message: "Incorrect password.", apiUrl: "" };
    }

    const normalized = toGithubApiUrl(data.url);
    const { error: updateError } = await supabaseAdmin
      .from("app_settings" as never)
      .update({
        github_api_url: normalized,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", r.id);

    if (updateError) {
      return { ok: false, message: updateError.message, apiUrl: "" };
    }
    return {
      ok: true,
      message: "Repository link updated globally.",
      apiUrl: normalized,
    };
  });

/** Admin: change the master password in the cloud database. */
export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("app_settings" as never)
      .select("id, admin_password")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      return { ok: false, message: "Could not reach the database." };
    }

    const r = row as { id: number; admin_password: string };
    if (r.admin_password !== data.currentPassword) {
      return { ok: false, message: "Current password is incorrect." };
    }

    const { error: updateError } = await supabaseAdmin
      .from("app_settings" as never)
      .update({
        admin_password: data.newPassword,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", r.id);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }
    return { ok: true, message: "Password changed successfully." };
  });
