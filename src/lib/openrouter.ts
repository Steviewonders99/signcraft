export async function queryAI(prompt: string, context?: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        {
          role: 'system',
          content: 'You are a legal contract drafting assistant. Write clear, professional contract language. When asked to draft, provide the full text ready to insert into a document. Be concise and specific.',
        },
        ...(context
          ? [{ role: 'user' as const, content: `Current document context:\n${context}` }]
          : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Unable to generate response.';
}
