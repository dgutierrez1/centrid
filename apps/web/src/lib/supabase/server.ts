import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@/lib/types'

/**
 * Server Supabase Client for Pages Router
 *
 * Creates a Supabase client for use in server-side code (getServerSideProps, API routes).
 * Handles cookie-based session management for server-side rendering.
 *
 * Usage in getServerSideProps:
 *   export const getServerSideProps = async (context: GetServerSidePropsContext) => {
 *     const supabase = createServerClient(context)
 *     const { data: { user } } = await supabase.auth.getUser()
 *     return { props: { user } }
 *   }
 *
 * Usage in API routes:
 *   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *     const supabase = createServerClientForAPI(req, res)
 *     const { data } = await supabase.from('table').select('*')
 *     res.json({ data })
 *   }
 */

/**
 * Create Supabase client for use in getServerSideProps
 */
export const createServerClient = (context: GetServerSidePropsContext) => {
  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: any) {
          context.res.setHeader(
            'Set-Cookie',
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''}`
          )
        },
        remove(name: string, options: any) {
          context.res.setHeader(
            'Set-Cookie',
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
          )
        },
      },
    }
  )
}

/**
 * Create Supabase client for use in API routes
 */
export const createServerClientForAPI = (req: NextApiRequest, res: NextApiResponse) => {
  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name]
        },
        set(name: string, value: string, options: any) {
          res.setHeader(
            'Set-Cookie',
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''}`
          )
        },
        remove(name: string, options: any) {
          res.setHeader(
            'Set-Cookie',
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
          )
        },
      },
    }
  )
}
