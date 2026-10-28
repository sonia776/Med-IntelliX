const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "medintellix-dev-secret-key-change-in-production";

/**
 * Express middleware to authenticate requests using JSON Web Tokens (JWT).
 * Attaches decoded user payload to req.user.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Bearer token missing."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token."
        });
    }
}

/**
 * Optional authentication middleware: if a Bearer token is provided, decodes it into req.user,
 * but allows the request to continue if no token is present.
 */
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch {
        req.user = null;
    }
    next();
}

module.exports = {
    authenticate,
    optionalAuthenticate,
    JWT_SECRET
};
