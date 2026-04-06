const mongoose = require("mongoose")

const projectLinkSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        url: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2048
        },
        note: {
            type: String,
            trim: true,
            maxlength: 300,
            default: ""
        },
        createdBy: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            name: {
                type: String,
                required: true,
                trim: true
            }
        }
    },
    { timestamps: true }
)

projectLinkSchema.index({ roomId: 1, createdAt: -1 })

const projectLinkModel = mongoose.model("ProjectLink", projectLinkSchema)
module.exports = projectLinkModel
