/**
 * AI Service for Deep Executive Resume Critique
 * Uses Google Gemini REST API (or OpenAI) when an API key is configured.
 */

async function getAiEvaluation(resumeText, targetRole = "", apiKey = process.env.GEMINI_API_KEY) {
  if (!apiKey) {
    return {
      enabled: false,
      message: "AI qualitative deep analysis is ready to be enabled. Add your GEMINI_API_KEY in .env or the Settings panel."
    };
  }

  try {
    const prompt = `You are a Principal Talent Acquisition Lead and Executive Career Coach.
Analyze the following resume for the target role: "${targetRole || "Software Engineering / Tech"}".

Resume Content:
"""
${resumeText.slice(0, 4000)}
"""

Provide a concise, constructive evaluation in valid JSON format with this exact structure:
{
  "executive_summary": "2-3 sentences evaluating the candidate's core seniority and market positioning.",
  "top_strengths": ["strength 1", "strength 2", "strength 3"],
  "high_priority_fixes": ["fix 1", "fix 2", "fix 3"],
  "interview_prep_advice": "Key technical topics or questions this candidate should expect based on their listed experience."
}
Do not include markdown fences like \`\`\`json. Output raw JSON only.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Gemini API error:", errText);
      return { enabled: false, error: "Failed to generate AI evaluation from Gemini API." };
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      const parsed = JSON.parse(candidateText);
      return {
        enabled: true,
        ...parsed
      };
    }
  } catch (err) {
    console.error("AI Evaluation exception:", err.message);
    return { enabled: false, error: err.message };
  }

  return { enabled: false };
}

module.exports = {
  getAiEvaluation
};
