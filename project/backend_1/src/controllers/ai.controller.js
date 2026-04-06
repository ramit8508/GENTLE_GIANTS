const { generateAIResponse, matchTeammates, extractJSON } = require("../service/ai.service.js")

async function matchTeammatesController(req, res) {
    const { project, users } = req.body
    if (!project || !Array.isArray(users)) {
        return res.status(400).json({ error: "Valid project and users array required" })
    }
    try {
        const result = await matchTeammates(project, users)
        res.status(200).json({ result })
    } catch (error) {
        console.error("Match Teammates Error:", error)
        res.status(500).json({ error: error.message })
    }
}

async function improveIdea(req, res) {
    const { idea } = req.body
    if (!idea || typeof idea !== "string") {
        return res.status(400).json({ error: "Valid idea is required" })
    }
    const prompt = `
Improve the following project idea professionally.

STRICT RULES:
- Output MUST be valid JSON
- No markdown or explanation

FORMAT:
{
  "title": "string",
  "description": "string",
  "keyFeatures": ["string"],
  "techStack": ["string"],
  "rolesNeeded": ["string"]
}

Idea:
${idea}
`
    try {
        const raw = await generateAIResponse(prompt)
        const parsed = extractJSON(raw)
        if (!parsed) {
            return res.status(500).json({ error: "Invalid AI response" })
        }
        res.status(200).json(parsed)
    } catch (error) {
        console.error("Improve Idea Error:", error.message)
        res.status(500).json({ error: "Failed to improve idea" })
    }
}

async function enhanceProfile(req, res) {
    const { bio } = req.body
    if (!bio || typeof bio !== "string") {
        return res.status(400).json({ error: "Valid bio is required" })
    }
    const prompt = `
Rewrite the following developer bio professionally and concisely.

RULES:
- Plain text only
- No JSON
- No markdown

Bio:
${bio}
`
    try {
        const enhanced = await generateAIResponse(prompt)
        res.status(200).json({ result: enhanced.trim() })
    } catch (error) {
        console.error("Enhance Profile Error:", error)
        res.status(500).json({ error: "Failed to enhance profile" })
    }
}

module.exports = { matchTeammatesController, improveIdea, enhanceProfile }