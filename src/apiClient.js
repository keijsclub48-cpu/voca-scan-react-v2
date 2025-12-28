// src/apiClient.js
export async function sendAudioToAPI(base64Audio) {
  if (!base64Audio) throw new Error("audio is required");

  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
    },
    body: JSON.stringify({ audio: base64Audio }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json();
}
