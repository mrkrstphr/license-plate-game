import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
    "(injected at build time from GitHub Actions vars in CI, or a local .env file in dev)."
  );
}

export const supabase = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY ?? ""
);
