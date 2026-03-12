import { getSystemPrompt, getMaxTokens, type AIMode } from './legal-knowledge';

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export async function queryAI(
  prompt: string,
  context?: string,
  mode: AIMode = 'draft'
): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const systemPrompt = getSystemPrompt(mode);
  const maxTokens = getMaxTokens(mode);

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (context) {
    messages.push({
      role: 'user',
      content: `Current document content:\n\n${context}`,
    });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Unable to generate response.';
}
