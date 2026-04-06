const mongoose = require("mongoose")

const projectTodoSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 240
        },
        source: {
            type: String,
            enum: ["manual", "ai"],
            default: "manual",
            index: true
        },
        aiBatch: {
            type: Number,
            default: null
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
        },
        completed: {
            type: Boolean,
            default: false,
            index: true
        },
        completedBy: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },
            name: {
                type: String,
                trim: true,
                default: null
            }
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
)

projectTodoSchema.index({ roomId: 1, createdAt: -1 })

const projectTodoModel = mongoose.model("ProjectTodo", projectTodoSchema)
module.exports = projectTodoModel
