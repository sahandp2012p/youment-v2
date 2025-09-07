"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    const res = await fetch("http://localhost:8000/analyze_video", {
      // localhost until buying backend host
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setResult(await res.json()); // wait for backend result and then set result
  }

  return (
    <div className="p-6">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube link"
        className="border p-2 rounded w-full"
      />
      <button
        onClick={handleAnalyze}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Analyze
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-black">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
