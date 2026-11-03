const { jwtVerify, createRemoteJWKSet } = require("jose");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const JWKS = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks")
);

const verifyToken = async (req, res, next) => {
    try {

console.log("Cookies received:", Object.keys(req.cookies || {}));
console.log("Studio token exists:", !!req.cookies?.studio_access_token);


        // Read JWT from HTTPOnly cookie
        const token = req.cookies?.studio_access_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token is missing",
            });
        }

        const { payload } = await jwtVerify(token, JWKS, {
            issuer: "http://localhost:3000",
            audience: "http://localhost:3000",
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
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || "user",
            permissions: user.permissions || {},
        };

        next();

    } catch (error) {
        console.error("JWT verification failed:", error.message);

        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token",
        });
    }
};

module.exports = verifyToken;