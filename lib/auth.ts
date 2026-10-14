import { betterAuth } from 'better-auth'
import { compare, hash } from 'bcryptjs'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL ??
          'http://localhost:3000'),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: (password) => hash(password, 12),
      verify: async ({ password, hash: passwordHash }) => {
        try {
          return await compare(password, passwordHash)
        } catch {
          return false
        }
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user"
      }
    }
  },
  trustedOrigins: [
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...[
            process.env.V0_RUNTIME_URL,
            process.env.V0_DEV_APP_URL,
            process.env.V0_BUILD_URL,
            process.env.V0_SANDBOX_URL,
          ].filter((origin): origin is string => Boolean(origin)),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
