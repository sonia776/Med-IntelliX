/**
 * Centralized Express Error Handling Middleware.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

    const statusCode = err.status || err.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(statusCode).json({
        success: false,
        message: err.message || "An unexpected internal server error occurred.",
        ...(isDevelopment && { stack: err.stack })
    });
}

module.exports = errorHandler;
