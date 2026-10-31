import type { APIRoute } from 'astro'

// /api is excluded from the middleware, so it gets no locale
export const GET: APIRoute = ({ locals }) => {
  return Response.json({ locale: locals.locale ?? null })
}
