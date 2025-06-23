"use client";

import { useState } from "react";
import { queryLlm } from "@/hooks/useLlmQuery";

interface Props {
  onResult: (data: any) => void;
}

export function LlmQueryForm({ onResult }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await queryLlm(question);
      onResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
        className="border rounded px-2 py-1 w-full"
      />
      <button type="submit" disabled={loading} className="px-4 py-1 bg-blue-500 text-white rounded">
        {loading ? "Loading..." : "Ask"}
      </button>
    </form>
  );
}
