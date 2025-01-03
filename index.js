import {ok} from 'node:assert'
import {join} from 'node:path'

import fastifySensible, {httpErrors} from '@fastify/sensible'
import fastifyStatic from '@fastify/static'

const {
  createError: {
    BadGateway: {prototype: {status: BadGateway}},
    BadRequest: {prototype: {status: BadRequest}},
    ServiceUnavailable: {prototype: {status: ServiceUnavailable}}
  },
  getHttpError
} = httpErrors


const {OPENAI_API_KEY} = process.env

const defaultRoot = join(import.meta.dirname, 'public')
const headers = {"Content-Type": "application/json"}
const options = {sharedSchemaId: 'HttpError'}
const schema = {
  body: {
    type: 'object',
    properties: {
      model: {type: 'string'},
      voice: {type: 'string'}
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        EPHEMERAL_KEY: {type: 'string'},
        baseUrl: {type: 'string'},
        model: {type: 'string'}
      }
    },
    [BadGateway]: {$ref: 'HttpError'},
    [BadRequest]: {$ref: 'HttpError'},
    [ServiceUnavailable]: {$ref: 'HttpError'}
  }
}


export default async function(
  fastify,
  {
    baseUrl = "https://api.openai.com/v1/realtime",
    defaultModel = "gpt-4o-realtime-preview",
    openaiApiKey = OPENAI_API_KEY,
    root = defaultRoot,
    defaultVoice,
    wildcard = false
  }
) {
  // Check OpenAI API key
  ok(
    openaiApiKey,
    'openaiApiKey option or OPENAI_API_KEY environment variable are required'
  )

  // Serve the static files
  fastify.register(fastifySensible, options)
  fastify.register(fastifyStatic, {root, wildcard})

  // Create and serve the ephemeral token to the client
  const init = {
    method: "POST",
    headers: {...headers, Authorization: `Bearer ${openaiApiKey}`}
  }

  fastify.post(
    '/start',
    {schema},
    async function({body: {model = defaultModel, voice = defaultVoice}})
    {
      fastify.assert(
        model.includes(baseUrl.split('/').pop()), BadRequest, 'Invalid model'
      )
      fastify.assert(voice, BadRequest, 'Voice is required')

      const body = JSON.stringify({model, voice})

      let response
      try
      {
        // We don't cache the token because we can consume the quota at any time
        response = await fetch(`${baseUrl}/sessions`, {...init, body});
      }
      catch(error)
      {
        throw getHttpError(ServiceUnavailable, error)
      }

      const {ok, status} = response

      let data
      try
      {
        data = await response.json()
      }
      catch(error)
      {
        throw getHttpError(status < BadRequest ? BadGateway : status, error)
      }

      const responseBody = ok
        ? {EPHEMERAL_KEY: data.client_secret.value, baseUrl, model}
        : data.error

      return new Response(JSON.stringify(responseBody), {headers, status});
    }
  )
}
