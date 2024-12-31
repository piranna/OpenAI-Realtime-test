import {ok} from 'node:assert'
import {join} from 'node:path'

import fastifyStatic from '@fastify/static'


const {OPENAI_API_KEY} = process.env

const defaultRoot = join(import.meta.dirname, 'public')
const headers = {"Content-Type": "application/json"}


export default async function(
  fastify,
  {
    baseUrl = "https://api.openai.com/v1/realtime",
    model = "gpt-4o-realtime-preview-2024-12-17",
    openaiApiKey = OPENAI_API_KEY,
    root = defaultRoot,
    voice = "verse",
    wildcard = false
  }
) {
  // Check OpenAI API key
  ok(
    openaiApiKey,
    'openaiApiKey option or OPENAI_API_KEY environment variable are required'
  )

  // Serve the static files
  fastify.register(fastifyStatic, {root, wildcard})

  // Create and serve the ephemeral token to the client
  const init = {
    method: "POST",
    headers: {...headers, Authorization: `Bearer ${openaiApiKey}`},
    body: JSON.stringify({model, voice})
  }

  fastify.get('/start', async function()
  {
    // We don't cache the token because we can consume the quota at any time
    // TODO: properly handle OpenAI API errors
    const response = await fetch(`${baseUrl}/sessions`, init);
    const data = await response.json()

    const {ok, status} = response

    const body = ok
      ? {EPHEMERAL_KEY: data.client_secret.value, baseUrl, model}
      : data.error

    return new Response(JSON.stringify(body), {headers, status});
  })
}
