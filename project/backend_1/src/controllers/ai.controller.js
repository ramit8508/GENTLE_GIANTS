const { generateAIResponse, matchTeammates, extractJSON } = require("../service/ai.service.js")

async function matchTeammatesController(req, res) {
    const { project, users } = req.body
    if (!project || !Array.isArray(users)) {
        return res.status(400).json({ error: "Valid project and users array required" })
    }
    try {
        const result = await matchTeammates(project, users)
        const validIds = new Set(users.map((u) => String(u?._id || u?.id)).filter(Boolean))
        const normalized = (Array.isArray(result) ? result : [])
            .map((rec) => ({ ...rec, id: String(rec?.id || "") }))
            .filter((rec) => validIds.has(rec.id))

        if (normalized.length > 0) {
            return res.status(200).json({ result: normalized })
        }

        const fallback = users.slice(0, 4).map((u) => ({
            id: String(u?._id || u?.id),
            name: u?.name || "Unknown",
            reason: "Recommended based on available profile data.",
            percentage: 0,
        }))
        return res.status(200).json({ result: fallback })
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