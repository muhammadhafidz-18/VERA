// src/lib/vera/claude.js
// Simple single-turn Claude call (no tools) for Task AI features:
// summary, issue analysis, refine, and rude-language moderation.
export async function callClaude(system, userMessage) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Anthropic API error (${response.status})`);
  const textBlock = (data.content || []).find((c) => c.type === "text");
  if (!textBlock) throw new Error("No text response from AI");
  return textBlock.text.trim();
}
