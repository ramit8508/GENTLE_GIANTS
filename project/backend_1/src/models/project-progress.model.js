const mongoose = require("mongoose")

const projectProgressSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        userName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        }
    },
    { timestamps: true }
)

projectProgressSchema.index({ roomId: 1, createdAt: -1 })

const projectProgressModel = mongoose.model("ProjectProgress", projectProgressSchema)
module.exports = projectProgressModel
