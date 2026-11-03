

const verifyPermission = (permission) => {


    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Please login first",
            });
        }
        // Admin-এর সব permission থাকবে
        if (req.user.role === "admin") {
            return next();
        }

        // শুধু নির্দিষ্ট permission থাকলেই access পাবে
        if (
            req.user.role === "sub-admin" &&
            req.user.permissions?.[permission] === true
        ) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Forbidden: You do not have permission to perform this action",
        });
    };
};

module.exports = verifyPermission;




//         console.log("Permission Required:", permission);
// console.log("Current User:", req.user.email);
// console.log("Current Role:", req.user.role);
// console.log("Current Permissions:", req.user.permissions);
// console.log("Permission Value:", req.user.permissions?.[permission]);