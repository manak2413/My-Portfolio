// api/chat.js
// Vercel Serverless Function — ye automatically ek API endpoint ban jata hai:
// https://your-project.vercel.app/api/chat
// Alag se server run karne ki zaroorat nahi — Vercel khud handle karta hai.

const SYSTEM_PROMPT = `Tum ek friendly AI Assistant ho jo ek portfolio website par baithe ho.
Tum users ke normal questions ka jawab do — chahe wo English, Hindi ya Hinglish me poochein, usi language me reply karo.
Portfolio owner ke about, skills, projects, ya contact info se related sawal ho to helpful jawab do.
Agar sawal general ho to bhi sahi aur seedha jawab do.
Jawab chota, clear aur conversational rakho.`;

// ===== YAHA APNI ORIGIN LIST DAALO (jo domains widget use karenge) =====
const ALLOWED_ORIGINS = [
  "http://localhost:5500",
  "https://yourportfolio.com",           // apna custom domain (agar hai)
  "https://yourusername.github.io",      // agar GitHub Pages use kar rahe ho
  "https://your-portfolio.vercel.app"    // agar portfolio khud Vercel par hai
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ reply: "ANTHROPIC_API_KEY set nahi hai Vercel Environment Variables me." });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ reply: "AI error: " + data.error.message });
    }

    const reply = data.content?.[0]?.text || "Maaf kijiye, jawab nahi mil paya.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Server error aaya." });
  }
}