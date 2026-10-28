/**
 * Role-Based Access Control (RBAC) middleware factory.
 * @param  {...string} allowedRoles Roles permitted to access the route ('patient', 'hospital', 'doctor', 'government', 'admin')
 * @returns Express middleware function
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const userRole = req.user.role;

        // 'admin' role always has full access, or if role matches allowed roles
        if (userRole === "admin" || allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Current role: '${userRole}'.`
        });
    };
}

/**
 * Ensures that a patient can only access their own records,
 * while healthcare providers (hospital, doctor, admin) can access if authorized.
 */
function authorizePatientOrProvider(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const { role, uhid, patientCode } = req.user;
    const requestedCode = req.params.patientCode || req.params.uhid || req.body.patientCode;

    // Hospitals, doctors, government, and admins can view patient records
    if (["hospital", "doctor", "government", "admin"].includes(role)) {
        return next();
    }

    // If patient, ensure they are requesting their own record
    const userPatientCode = uhid || patientCode;
    if (role === "patient" && requestedCode && userPatientCode === requestedCode) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Forbidden: You may only access your own patient records."
    });
}

module.exports = {
    authorize,
    authorizePatientOrProvider
};
