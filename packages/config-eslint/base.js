import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Shared ESLint v9 flat config. Architecture rules live here as lint, not prose. */
export const config = [
  { ignores: ["dist/**", "node_modules/**", ".expo/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

/**
 * Architecture guardrail: UI layers must not touch I/O directly.
 * Features' components/screens go through hooks/services, never the http client,
 * mqtt client, or the local database.
 */
export const uiBoundary = [
  {
    files: ["**/components/**/*.tsx", "app/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/api/http/*",
                "**/database/*",
                "**/sync/*",
                "paho-mqtt",
              ],
              message:
                "LỖI VI PHẠM KIẾN TRÚC: UI không được gọi trực tiếp I/O hoặc client MQTT — hãy đi qua feature hook/service.",
            },
          ],
        },
      ],
    },
  },
];
