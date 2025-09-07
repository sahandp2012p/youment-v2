"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleAnalyze() {
    if (!url) return;
    setSteps([]);
    setResult(null);
    setLoading(true);

    const eventSource = new EventSource(
      `http://localhost:8000/analyze_stream?url=${encodeURIComponent(url)}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.step) {
        setSteps((prev) => [...prev, data.step]);
      }
      if (data.done) {
        setResult(data.result);
        setLoading(false);
        eventSource.close();
      }
      if (data.error) {
        setSteps((prev) => [...prev, "❌ Error: " + data.error]);
        setLoading(false);
        eventSource.close();
      }
    };
  }

  function goToResults() {
    if (result) {
      // Save result in localStorage so results page can pick it up
      localStorage.setItem("analysisResult", JSON.stringify(result));
      router.push("/results");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-md p-8 rounded-2xl bg-gray-200 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-700">
          🎥 Youment Analyzer
        </h1>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube link"
          className="w-full mb-4 p-3 rounded-xl bg-gray-200 shadow-inner text-gray-700"
        />

        <button
          onClick={handleAnalyze}
          className="w-full py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold
                     shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] active:shadow-inner"
        >
          Analyze
        </button>

        {/* Spinner + Steps */}
        <div className="mt-6 space-y-2 text-center">
          {loading && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-600">Processing...</p>
            </div>
          )}
          {steps.map((s, i) => (
            <p key={i} className="text-gray-600">
              ➡️ {s}
            </p>
          ))}
        </div>

        {/* Show "View Results" button once done */}
        {result && (
          <button
            onClick={goToResults}
            className="mt-6 w-full py-3 rounded-xl bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 transition"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  );
}
