/**
 * xAI API Service
 * Handles interactions with xAI's Grok API including chat completions and document search
 */

const XAI_API_KEY = import.meta.env.VITE_ENGLISHGPT_GENERAL_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';
const MODEL = 'grok-4-1-fast-non-reasoning';

if (!XAI_API_KEY) {
  throw new Error('Missing VITE_ENGLISHGPT_GENERAL_API_KEY environment variable');
}

// Collection IDs from the requirements
export const COLLECTIONS = {
  PAPER_1: 'collection_6d4eefee-9853-435c-953a-f9a32d564bc6',
  PAPER_2: 'collection_6272e422-be1c-46c8-8c84-e3543fe83bac',
  TEXT_TYPES: 'collection_91875ea9-e1e1-4c94-99f0-78da587e1d40',
  VOCABULARY: 'collection_d421f996-e132-4f2e-a140-eb20c8d2a118',
} as const;

export const FILES = {
  PAPER_1_GUIDE: 'file_11c3edb9-19a0-4578-af95-44142442a333',
  PAPER_1_FAQ: 'file_9501c500-a579-43c0-8dcc-8ad983227156',
  PAPER_2_GUIDE: 'file_d54d22ae-098c-4ae9-8cac-2cbd6d679b2f',
  PAPER_2_FAQ: 'file_1eb7a877-90c6-4df9-a7c0-722f02f9be09',
  TEXT_TYPES_GUIDE: 'file_f33cf5cf-e038-4e32-b3e4-6e8cd8a22144',
  VOCABULARY_GUIDE: 'file_efd5a7e4-f26b-4e75-b2e3-f2d34b3fd048',
} as const;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  stream?: boolean;
  temperature?: number;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DocumentSearchRequest {
  query: string;
  source: {
    collection_ids: string[];
  };
  search_type?: 'SEARCH_TYPE_SEMANTIC' | 'SEARCH_TYPE_KEYWORD' | 'SEARCH_TYPE_HYBRID';
  limit?: number;
  instructions?: string;
  ranking_metric?: string;
  search_multiplier?: number;
}

interface DocumentSearchResponse {
  matches: Array<{
    file_id: string;
    chunk_id: string;
    chunk_content: string;
    score: number;
    collection_ids: string[];
  }>;
}

/**
 * Search documents in xAI Collections using hybrid search
 */
export async function searchDocuments(
  query: string,
  collectionIds: string[],
  options?: {
    limit?: number;
    instructions?: string;
    searchType?: 'SEARCH_TYPE_SEMANTIC' | 'SEARCH_TYPE_KEYWORD' | 'SEARCH_TYPE_HYBRID';
  }
): Promise<DocumentSearchResponse> {
  const request: DocumentSearchRequest = {
    query,
    source: {
      collection_ids: collectionIds,
    },
    search_type: options?.searchType || 'SEARCH_TYPE_HYBRID',
    limit: options?.limit || 5,
    instructions: options?.instructions,
  };

  const response = await fetch(`${XAI_BASE_URL}/documents/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Document search failed: ${error}`);
  }

  return response.json();
}

/**
 * Create a chat completion with Grok
 */
export async function createChatCompletion(
  messages: Message[],
  options?: {
    temperature?: number;
    stream?: boolean;
  }
): Promise<ChatCompletionResponse> {
  const request: ChatCompletionRequest = {
    messages,
    model: MODEL,
    stream: options?.stream || false,
    temperature: options?.temperature !== undefined ? options.temperature : 0.7,
  };

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat completion failed: ${error}`);
  }

  return response.json();
}

/**
 * Search and chat - combines document search with chat completion
 * This is useful for RAG (Retrieval Augmented Generation) flows
 */
export async function searchAndChat(
  query: string,
  collectionIds: string[],
  systemPrompt: string,
  searchInstructions?: string
): Promise<{ response: string; sources: Array<{ file_id: string; content: string }> }> {
  // First, search for relevant documents
  const searchResults = await searchDocuments(query, collectionIds, {
    limit: 5,
    instructions: searchInstructions,
  });

  // Build context from search results
  const context = searchResults.matches
    .map((match, idx) => `[Source ${idx + 1}]\n${match.chunk_content}`)
    .join('\n\n');

  // Create chat completion with context
  const messages: Message[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Context from knowledge base:\n\n${context}\n\nUser query: ${query}`,
    },
  ];

  const chatResponse = await createChatCompletion(messages, { temperature: 0.7 });

  return {
    response: chatResponse.choices[0].message.content,
    sources: searchResults.matches.map(m => ({
      file_id: m.file_id,
      content: m.chunk_content,
    })),
  };
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Retry-enabled versions of the main functions
 */
export const xai = {
  searchDocuments: (
    query: string,
    collectionIds: string[],
    options?: Parameters<typeof searchDocuments>[2]
  ) => withRetry(() => searchDocuments(query, collectionIds, options)),

  createChatCompletion: (
    messages: Message[],
    options?: Parameters<typeof createChatCompletion>[1]
  ) => withRetry(() => createChatCompletion(messages, options)),

  searchAndChat: (
    query: string,
    collectionIds: string[],
    systemPrompt: string,
    searchInstructions?: string
  ) => withRetry(() => searchAndChat(query, collectionIds, systemPrompt, searchInstructions)),
};
