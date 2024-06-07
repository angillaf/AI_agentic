#!/usr/bin/env node
import 'dotenv/config'

import { WeatherClient } from '@agentic/stdlib'
import { createAISDKTools } from '@agentic/stdlib/ai-sdk'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

async function main() {
  const weather = new WeatherClient()

  const result = await generateText({
    model: openai('gpt-4o'),
    tools: createAISDKTools(weather),
    toolChoice: 'required',
    temperature: 0,
    system: 'You are a helpful assistant. Be as concise as possible.',
    prompt: 'What is the weather in San Francisco?'
  })

  console.log(result.toolResults[0])
}

await main()
