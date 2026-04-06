const express = require("express")
const { matchTeammatesController, improveIdea, enhanceProfile } = require("../controllers/ai.controller.js")
const { authmiddleware } = require("../middlewares/auth.middleware.js")
const rateLimit = require("express-rate-limit")

const router = express.Router()

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many AI requests. Please try again later.",
})

router.use(authmiddleware)
router.use(aiLimiter)

router.post("/match", matchTeammatesController)
router.post("/improve-idea", improveIdea)
router.post("/enhance-profile", enhanceProfile)

module.exports = router