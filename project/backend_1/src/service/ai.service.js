const axios=require("axios")

const withRetry=async(fn,maxRetries=3)=>{
      try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    return withRetry(fn, retries - 1);
  }
}

const extractJSON=async(text)=>{
  try {
    if (!text) return null;

    const cleaned = text.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

    if (!match) throw new Error("No JSON found");

    return JSON.parse(match[0]);
  } catch (err) {
    console.error("JSON Parse Error:", err.message);
    return null;
  }
}
const generateAIResponse=async(prompt)=>{
  try {
    const response = await withRetry(() =>
      axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      )
    );

    return response.data?.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("generateAIResponse Error:", error.message);
    throw new Error("AI service failed");
  }
}
async function matchTeammates(project, developers) {
  try {
    const safeProject = JSON.parse(JSON.stringify(project));
    const safeDevelopers = developers.map((d) =>
      JSON.parse(JSON.stringify(d))
    );

    const prompt = `
You are a software team recruiter.

STRICT RULES:
- Output MUST be valid JSON
- No explanation
- No markdown
- No backticks

FORMAT:
[
  { "id": "string", "name": "string", "reason": "string", "percentage": number }
]

Instructions:
1. "id" is the developer's unique ID provided in the Developers list.
2. Calculate a "percentage" (0-100) based on how well the developer's skills match the project's tech stack and roles needed.
3. Provide a brief "reason" for the match.

Project:
${JSON.stringify(safeProject)}

Developers:
${JSON.stringify(safeDevelopers)}
`;
    const aiResponse = await generateAIResponse(prompt);
    const parsed = extractJSON(aiResponse);
    if (!parsed || parsed.length === 0) {
      return developers.slice(0, 3).map((dev) => ({
        id: dev._id || dev.id,
        name: dev.name || "Unknown",
        reason: "Default selection (AI unavailable)",
        percentage: 0,
      }));
    }
    return parsed;
  } catch (error) {
    console.error("matchTeammates Error:", error.message);

    return developers.slice(0, 3).map((dev) => ({
      id: dev._id || dev.id,
      name: dev.name || "Unknown",
      reason: "Fallback due to system error",
      percentage: 0,
    }));
  }
}
module.exports = {
  generateAIResponse,
  matchTeammates,
  extractJSON,
};



    
