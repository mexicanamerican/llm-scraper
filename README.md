# LLM Scraper

<img width="1800" alt="Screenshot 2024-04-20 at 23 11 16" src="https://github.com/mishushakov/llm-scraper/assets/10400064/ab00e048-a9ff-43b6-81d5-2e58090e2e65">

LLM Scraper is a TypeScript library that allows you to convert **any** webpages into structured data using LLMs.

> [!TIP]
> Under the hood, it uses function calling to convert pages to structured data. You can find more about this approach [here](https://til.simonwillison.net/gpt3/openai-python-functions-data-extraction)

### Features

- Supports **Local (GGUF)**, OpenAI, Groq chat models
- Schemas defined with Zod
- Full type-safety with TypeScript
- Based on Playwright framework
- Streaming objects
- Supports 4 input modes:
  - `html` for loading raw HTML
  - `markdown` for loading markdown
  - `text` for loading extracted text (using [Readability.js](https://github.com/mozilla/readability))
  - `image` for loading a screenshot (multi-modal only)

**Make sure to give it a star!**

<img width="165" alt="Screenshot 2024-04-20 at 22 13 32" src="https://github.com/mishushakov/llm-scraper/assets/10400064/11e2a79f-a835-48c4-9f85-5c104ca7bb49">

## Getting started

1. Install the required dependencies from npm:

   ```
   npm i zod playwright llm-scraper
   ```

2. Initialize your LLM:

   **OpenAI**

   ```
   npm i @ai-sdk/openai
   ```

   ```js
   import { openai } from '@ai-sdk/openai'
   const llm = openai.chat('gpt-4o')
   ```

   **Groq**

   ```
   npm i @ai-sdk/openai
   ```

   ```js
   import { createOpenAI } from '@ai-sdk/openai'
   const groq = new OpenAI({
     baseURL: 'https://api.groq.com/openai/v1',
     apiKey: process.env.GROQ_API_KEY,
   })

   const llm = groq('llama3-8b-8192')
   ```

   **Local**

   ```js
   import { LlamaModel } from 'node-llama-cpp'
   const llm = new LlamaModel({ modelPath: 'model.gguf' })
   ```

3. Create a new scraper instance provided with the llm:

   ```js
   import LLMScraper from 'llm-scraper'
   const scraper = new LLMScraper(llm)
   ```

## Example

In this example, we're extracting top stories from HackerNews:

```ts
import { chromium } from 'playwright'
import { z } from 'zod'
import { openai } from '@ai-sdk/openai'
import LLMScraper from 'llm-scraper'

// Launch a browser instance
const browser = await chromium.launch()

// Initialize LLM provider
const llm = openai.chat('gpt-4o')

// Create a new LLMScraper
const scraper = new LLMScraper(llm)

// Open new page
const page = await browser.newPage()
await page.goto('https://news.ycombinator.com')

// Define schema to extract contents into
const schema = z.object({
  top: z
    .array(
      z.object({
        title: z.string(),
        points: z.number(),
        by: z.string(),
        commentsURL: z.string(),
      })
    )
    .length(5)
    .describe('Top 5 stories on Hacker News'),
})

// Run the scraper
const { data } = await scraper.run(page, {
  schema,
  mode: 'html',
})

// Show the result from LLM
console.log(data?.top)

await page.close()
await browser.close()
```

### Streaming

Replace your `run` function with `stream` to get a partial object stream (Vercel AI SDK only).

```ts
// Run the scraper
const { stream } = await scraper.stream(page, {
  schema,
  mode: 'html',
})

// Stream the result from LLM
for await (const data of stream) {
  console.log(data.top)
}
```

## Contributing

As an open-source project, we welcome contributions from the community. If you are experiencing any bugs or want to add some improvements, please feel free to open an issue or pull request.
