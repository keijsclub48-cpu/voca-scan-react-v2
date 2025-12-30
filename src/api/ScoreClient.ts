// src/api/ScoreClient.ts

export interface PitchScoreRequest {
  freq: number;
}

export interface PitchScoreResponse {
  score: number;
  message?: string;
}

export async function submitPitch(freq: number): Promise<PitchScoreResponse> {
  const res = await fetch("/api/score/pitch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ freq }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
