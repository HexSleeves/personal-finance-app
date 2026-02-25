import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { api } from './_generated/api'

const http = httpRouter()

http.route({
  path: '/plaid/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await request.text()
    const idempotencyKey =
      request.headers.get('plaid-webhook-id') ??
      request.headers.get('x-request-id') ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`

    await ctx.runAction(api.webhooks.processPlaidWebhook, {
      body,
      idempotencyKey,
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }),
})

export default http
