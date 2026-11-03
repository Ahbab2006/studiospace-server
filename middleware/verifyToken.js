const { jwtVerify, createRemoteJWKSet } = require("jose");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { decodeJwt } = require("jose");

const AUTH_URL = process.env.BETTER_AUTH_URL;

if (!AUTH_URL) {
    throw new Error("BETTER_AUTH_URL is not configured");
}

const JWKS = createRemoteJWKSet(
    new URL(`${AUTH_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
    try {

console.log("Authorization header:", !!req.headers.authorization);
console.log("Bearer token exists:", req.headers.authorization?.startsWith("Bearer "));


        // Read token from Authorization header
        const authHeader = req.headers.authorization;

        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.cookies?.studio_access_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token is missing",
            });
        }

       const decoded = decodeJwt(token);

console.log("JWT issuer:", decoded.iss);
console.log("JWT audience:", decoded.aud);
console.log("Expected AUTH_URL:", AUTH_URL);

const { payload } = await jwtVerify(token, JWKS, {
    audience: AUTH_URL,
});

        if (!payload.sub) {
            return res.status(401).json({
                success: false,
                message: "Invalid token: User ID is missing",
            });
        }

        const db = getDB();

        let user = null;

        if (ObjectId.isValid(payload.sub)) {
            user = await db.collection("user").findOne({
                _id: new ObjectId(payload.sub),
            });
        }

        if (!user) {
            user = await db.collection("user").findOne({
                id: payload.sub,
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = {
            id: user._id?.toString() || user.id,
            email: user.email,
            name: user.name,
            role: user.role || "user",
            permissions: user.permissions || {},
        };

        next();

   } catch (error) {
    console.error("JWT verification failed:", {
        name: error.name,
        code: error.code,
        message: error.message,
    });

    return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
    });
}
};

module.exports = verifyToken;