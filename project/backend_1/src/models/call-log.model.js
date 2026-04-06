const mongoose = require("mongoose")

const callLogSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        callType: {
            type: String,
            enum: ["voice", "video"],
            default: "video"
        },
        participants: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                joinedAt: {
                    type: Date,
                    required: true
                },
                leftAt: {
                    type: Date,
                    default: null
                }
            }
        ],
        startedAt: {
            type: Date,
            required: true
        },
        endedAt: {
            type: Date,
            default: null
        },
        durationSeconds: {
            type: Number,
            default: 0
        },
        endReason: {
            type: String,
            enum: ["manual", "all_left", "server_disconnect"],
            default: "manual"
        }
    },
    { timestamps: true }
)

callLogSchema.index({ roomId: 1, startedAt: -1 })

const callLogModel = mongoose.model("CallLog", callLogSchema)
module.exports = callLogModel