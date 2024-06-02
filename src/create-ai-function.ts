import type { z } from 'zod'

import type * as types from './types.js'
import { parseStructuredOutput } from './parse-structured-output.js'
import { assert } from './utils.js'
import { zodToJsonSchema } from './zod-to-json-schema.js'

/**
 * Create a function meant to be used with OpenAI tool or function calling.
 *
 * The returned function will parse the arguments string and call the
 * implementation function with the parsed arguments.
 *
 * The `spec` property of the returned function is the spec for adding the
 * function to the OpenAI API `functions` property.
 */
export function createAIFunction<InputSchema extends z.ZodObject<any>, Return>(
  spec: {
    /** Name of the function. */
    name: string
    /** Description of the function. */
    description?: string
    /** Zod schema for the arguments string. */
    inputSchema: InputSchema
  },
  /** Implementation of the function to call with the parsed arguments. */
  implementation: (params: z.infer<InputSchema>) => types.MaybePromise<Return>
): types.AIFunction<InputSchema, Return> {
  assert(spec.name, 'createAIFunction missing required "spec.name"')
  assert(
    spec.inputSchema,
    'createAIFunction missing required "spec.inputSchema"'
  )
  assert(implementation, 'createAIFunction missing required "implementation"')
  assert(
    typeof implementation === 'function',
    'createAIFunction "implementation" must be a function'
  )

  /** Parse the arguments string, optionally reading from a message. */
  const parseInput = (input: string | types.Msg) => {
    if (typeof input === 'string') {
      return parseStructuredOutput(input, spec.inputSchema)
    } else {
      const args = input.function_call?.arguments
      assert(
        args,
        `Missing required function_call.arguments for function ${spec.name}`
      )
      return parseStructuredOutput(args, spec.inputSchema)
    }
  }

  // Call the implementation function with the parsed arguments.
  const aiFunction: types.AIFunction<InputSchema, Return> = (
    input: string | types.Msg
  ) => {
    const parsedInput = parseInput(input)
    return implementation(parsedInput)
  }

  aiFunction.inputSchema = spec.inputSchema
  aiFunction.parseInput = parseInput
  aiFunction.spec = {
    name: spec.name,
    description: spec.description?.trim() ?? '',
    parameters: zodToJsonSchema(spec.inputSchema)
  }
  aiFunction.impl = implementation

  return aiFunction
}
