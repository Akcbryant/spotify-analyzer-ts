"use client";

import { useState, useRef } from "react";

export function LlmQueryBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSubmit = async () => {
    setAnswer("");
    setLoading(true);

    // Cancel any previous stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Start streaming SSE
    const eventSource = new EventSource("/api/llm-query-stream?question=" + encodeURIComponent(question));
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      setAnswer((prev) => prev + event.data);
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
      setLoading(false);
    };

    eventSource.addEventListener("end", () => {
      setLoading(false);
      eventSource.close();
    });
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow space-y-4">
      <h2 className="text-xl font-bold">Ask your listening history</h2>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask anything..."
        className="w-full border px-3 py-2 rounded"
      />

      <button
        onClick={handleSubmit}
        disabled={!question || loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>

      {answer && (
        <div className="p-3 bg-gray-100 rounded border whitespace-pre-wrap">
          <strong>Answer:</strong>
          <p className="mt-2">{answer}</p>
        </div>
      )}
    </div>
  );
}
