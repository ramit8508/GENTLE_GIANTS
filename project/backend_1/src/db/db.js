const mongoose = require("mongoose")
const dns = require("dns")

const connectOnce = async (uri) => {
    return mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
    })
}

const connectDB = async () => {
    const primaryUri = process.env.MONGODB_URI
    const fallbackUri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI_FALLBACK

    if (!primaryUri) {
        console.log("MONGODB_URI is missing in .env")
        process.exit(1)
    }

    try {
        await connectOnce(primaryUri)
        console.log("MongoDB is connected successfully")
        return
    } catch (error) {
        const isSrvDnsError = error?.code === "ECONNREFUSED" && String(error?.syscall || "").includes("querySrv")

        if (isSrvDnsError) {
            console.log("SRV DNS lookup failed. Retrying with public DNS servers...")
            try {
                dns.setServers(["8.8.8.8", "1.1.1.1"])
                await connectOnce(primaryUri)
                console.log("MongoDB is connected successfully")
                return
            } catch (dnsRetryError) {
                console.log("Primary URI failed after DNS retry:", dnsRetryError?.message || dnsRetryError)
            }
        } else {
            console.log("Primary URI failed:", error?.message || error)
        }

        if (fallbackUri) {
            try {
                await connectOnce(fallbackUri)
                console.log("MongoDB is connected successfully (fallback URI)")
                return
            } catch (fallbackError) {
                console.log("Fallback URI failed:", fallbackError?.message || fallbackError)
            }
        }

        console.log("Error in Connecting database", error)
        console.log("Tip: add MONGODB_URI_DIRECT in .env using Atlas non-SRV connection string if SRV DNS is blocked.")
        process.exit(1)
    }
}

module.exports = connectDB