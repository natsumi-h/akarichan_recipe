import OpenAI from 'openai';

/**
 * Generate embedding text from recipe data
 * Creates a formatted text string suitable for embedding generation
 */
export function createRecipeText(recipe: {
  title: string;
  description: string | null;
  category: string | null;
  steps_text: string | null;
}): string {
  const parts = [
    `タイトル: ${recipe.title}`,
    recipe.description && `説明: ${recipe.description}`,
    recipe.category && `カテゴリ: ${recipe.category}`,
    recipe.steps_text && `手順: ${recipe.steps_text}`,
  ].filter(Boolean);

  return parts.join('\n');
}

/**
 * Generate embedding using OpenAI API
 * Uses text-embedding-3-small model (1536 dimensions)
 * @param openai - OpenAI client instance
 * @param text - Text to generate embedding for
 * @returns Array of embedding numbers (1536 dimensions)
 */
export async function generateEmbedding(
  openai: OpenAI,
  text: string
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('  ❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Initialize OpenAI client
 * @param apiKey - OpenAI API key
 * @returns OpenAI client instance
 */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}
