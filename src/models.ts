import OpenAI from 'openai'
import { z } from 'zod'
import { ScraperLoadResult, ScraperCompletionResult } from './index.js'
import {
  LlamaModel,
  LlamaJsonSchemaGrammar,
  LlamaContext,
  LlamaChatSession,
} from 'node-llama-cpp'
import { JsonSchema7Type } from 'zod-to-json-schema'

const defaultPrompt =
  'You are a satistified web scraper. Extract the contents of the webpage'

function prepareOpenAIPage(
  page: ScraperLoadResult
): OpenAI.Chat.Completions.ChatCompletionContentPart[] {
  if (page.mode === 'image') {
    return [
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${page.content}` },
      },
    ]
  }

  return [{ type: 'text', text: page.content }]
}

export async function generateOpenAICompletions<T extends z.ZodSchema<any>>(
  client: OpenAI,
  model: string,
  page: Promise<ScraperLoadResult>,
  schema: JsonSchema7Type,
  prompt: string = defaultPrompt,
  temperature?: number
): Promise<ScraperCompletionResult<T>> {
  const openai = client as OpenAI
  const p = await page
  const content = prepareOpenAIPage(p)

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      { role: 'user', content },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'extract_content',
          description: 'Extracts the content from the given webpage(s)',
          parameters: schema,
        },
      },
    ],
    tool_choice: 'auto',
    temperature,
  })

  const c = completion.choices[0].message.tool_calls[0].function.arguments
  return {
    data: JSON.parse(c),
    url: p.url,
  }
}

export async function generateLlamaCompletions<T extends z.ZodSchema<any>>(
  model: LlamaModel,
  page: Promise<ScraperLoadResult>,
  schema: JsonSchema7Type,
  prompt: string = defaultPrompt,
  temperature?: number
): Promise<ScraperCompletionResult<T>> {
  const p = await page
  const grammar = new LlamaJsonSchemaGrammar(schema as any)
  const context = new LlamaContext({ model })
  const session = new LlamaChatSession({ context })
  const pagePrompt = `${prompt}\n${p.content}`

  const result = await session.prompt(pagePrompt, {
    grammar,
    temperature,
  })

  const parsed = grammar.parse(result)
  return {
    data: parsed,
    url: p.url,
  }
}