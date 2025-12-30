// src/apiClient.ts
// ★ 型のインポートを追加
import { DiagnosisResult } from "./types";

export async function sendAudioToAPI(base64Audio: string): Promise<DiagnosisResult> {
  const baseUrl = window.location.hostname === "localhost" 
    ? "http://localhost:3000" 
    : "";

  try {
    const response = await fetch(`${baseUrl}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: base64Audio }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("apiClient success:", data);
    return data as DiagnosisResult;
  } catch (error) {
    console.error("apiClient connection error:", error);
    // 失敗しても止まらないよう、デフォルト値を返す
    return { pitch: 0, stability: 0, score: 0 };
  }
}