import { useState, useCallback } from "react";

export function useRoomAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState("");

  const analyze = useCallback(async ({ photo, length, width, height, windows, roomType }) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const steps = [
      "Uploading photo...",
      "Analyzing room with AI...",
      "Detecting furniture & style...",
      "Generating suggestions...",
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setLoadingStep(steps[stepIdx]);
    }, 1800);

    try {
      const formData = new FormData();
      if (photo) formData.append("photo", photo);
      formData.append("length", length);
      formData.append("width", width);
      formData.append("height", height);
      formData.append("windows", windows);
      formData.append("roomType", roomType);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingStep("");
    }
  }, []);

  return { analysis, loading, error, loadingStep, analyze };
}
