export async function queryLlm(question: string): Promise<any> {
  const res = await fetch('/api/llm-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch");
  }

  const data = await res.json();
  return data;
}
