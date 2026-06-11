import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed, validated environment variables (adopted from the T3 template pattern).
 * Imported by next.config.ts so validation runs fail-fast at build/dev start.
 * Run any command with SKIP_ENV_VALIDATION=1 to bypass (e.g. Docker image builds).
 *
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are intentionally NOT declared here:
 * they are consumed by the Supabase CLI via supabase/config.toml, never read by
 * app code. SUPABASE_EXTRA_SEEDS is likewise a Supabase-CLI-only var.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Service-role key. Optional: only the auto-login backdoor / admin client
    // needs it (added in a later task). Absent in normal dev/build/CI.
    SUPABASE_SECRET_KEY: z.string().optional(),
    // Auto-login backdoor token (DEV ONLY). Empty/unset = backdoor disabled (404).
    AUTO_LOGIN_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // ISO-8601 with timezone offset. Optional: the countdown degrades gracefully
    // when absent (lib/event/config.ts), so we keep it non-required but validate
    // the format when present.
    NEXT_PUBLIC_EVENT_DATETIME: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message:
          "NEXT_PUBLIC_EVENT_DATETIME must be a valid ISO-8601 datetime with timezone offset",
      })
      .optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    AUTO_LOGIN_TOKEN: process.env.AUTO_LOGIN_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_EVENT_DATETIME: process.env.NEXT_PUBLIC_EVENT_DATETIME,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
