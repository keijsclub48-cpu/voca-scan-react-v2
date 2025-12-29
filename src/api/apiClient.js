// src/apiClient.js
export async function sendAudioToAPI(payload, signal) {
  if (!payload) throw new Error("payload is required");

  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/score`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json();
}
