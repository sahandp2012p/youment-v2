"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function ScrollBox({ text, height }: { text: string; height: number }) {
  if (!text) return null;
  return (
    <div
      className="p-4 rounded-xl bg-gray-200 shadow-inner text-gray-700 whitespace-pre-wrap overflow-y-auto"
      style={{ maxHeight: `${height}px` }}
    >
      {text}
    </div>
  );
}

export default function Results() {
  const [result, setResult] = useState<any>(null);
  const [rating, setRating] = useState<{
    content_score: string;
    explanation: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("analysisResult");
    if (stored) {
      const parsed = JSON.parse(stored);
      setResult(parsed);

      // Parse GPT rating (try-catch in case it's malformed)
      try {
        // Remove the first and last lines from parsed.rating before parsing
        const lines = parsed.rating.split("\n");
        const trimmed = lines.slice(1, -1).join("\n");
        const parsedRating = JSON.parse(trimmed);
        setRating(parsedRating);
      } catch (error) {
        console.error("Failed to parse rating:", error);
        setRating({ content_score: "N/A", explanation: parsed.rating });
      }
    } else {
      router.push("/"); // Redirect if no results
    }
  }, [router]);

  if (!result) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-2xl p-8 rounded-2xl bg-gray-200 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
        <h1 className="text-2xl font-bold mb-6 text-gray-700 text-center">
          📊 Analysis Results
        </h1>

        {/* Transcript */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg text-gray-700 mb-2">
            Transcript
          </h2>
          <ScrollBox text={result.transcript} height={200} />
        </div>

        {/* Rating */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg text-gray-700 mb-2">Rating</h2>
          {rating ? (
            <div className="space-y-3">
              <p className="text-gray-800 font-medium">
                Score: {rating.content_score}/10
              </p>
              <ScrollBox text={rating.explanation} height={150} />
            </div>
          ) : (
            <p className="text-gray-500">No rating available</p>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-md hover:shadow-inner transition"
        >
          🔙 Back
        </button>
      </div>
    </div>
  );
}
