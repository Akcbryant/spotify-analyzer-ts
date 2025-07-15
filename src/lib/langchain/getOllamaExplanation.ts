export async function getOllamaExplanation(query: string, content: string): Promise<string> {
  const prompt = `
You are a helpful assistant summarizing why a song matches a user's preferences.

User request:
"${query}"

Track metadata:
${content}

In 1-2 sentences, explain why this track matches the request.
  `.trim();

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3', // or another capable chat model you've pulled
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    console.error(`❌ Ollama failed: ${res.status} ${res.statusText}`);
    return '(failed to generate explanation)';
  }

  const json = await res.json();
  return json.response.trim();
}
