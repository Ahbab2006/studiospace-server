
const getAdminDashboard = async (req, res) => {
    try {
const isAdmin = req.user.role === "admin";

const permissions = {
    viewSales: isAdmin || req.user.permissions?.viewSales === true,
    manageBookings: isAdmin || req.user.permissions?.manageBookings === true,
    manageUsers: isAdmin || req.user.permissions?.manageUsers === true,
    manageStudios: isAdmin || req.user.permissions?.manageStudios === true,
};

        const db = getDB();

        const usersCollection = db.collection("user");
        const studiosCollection = db.collection("studios");
        const bookingsCollection = db.collection("bookings");

        // Current date boundaries
        const now = new Date();

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const monthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const nextMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        // Basic counts
        const totalUsers = await usersCollection.countDocuments({
            role: { $ne: "admin" },
        });

        const totalStudios = await studiosCollection.countDocuments();

        const totalBookings = await bookingsCollection.countDocuments();

        const pendingBookings = await bookingsCollection.countDocuments({
            status: "pending",
        });

        const confirmedBookings = await bookingsCollection.countDocuments({
            status: "confirmed",
        });

        const completedBookings = await bookingsCollection.countDocuments({
            status: "completed",
        });

        const cancelledBookings = await bookingsCollection.countDocuments({
            status: "cancelled",
        });

        // Revenue from completed bookings only
        const totalRevenueResult = await bookingsCollection.aggregate([
            {
                $match: {
                    status: "completed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: {
                            $convert: {
                                input: "$totalPrice",
                                to: "double",
                                onError: 0,
                                onNull: 0,
                            },
                        },
                    },
                },
            },
        ]).toArray();

        const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

        // Today's completed sales
        const todayRevenueResult = await bookingsCollection.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: {
                        $gte: todayStart,
                        $lt: tomorrowStart,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    revenue: {
                        $sum: {
                            $convert: {
                                input: "$totalPrice",
                                to: "double",
                                onError: 0,
                                onNull: 0,
                            },
                        },
                    },
                },
            },
        ]).toArray();

        const todayRevenue = todayRevenueResult[0]?.revenue || 0;

        // Current month's completed sales
        const monthlyRevenueResult = await bookingsCollection.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: {
                        $gte: monthStart,
                        $lt: nextMonthStart,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    revenue: {
                        $sum: {
                            $convert: {
                                input: "$totalPrice",
                                to: "double",
                                onError: 0,
                                onNull: 0,
                            },
                        },
                    },
                },
            },
        ]).toArray();

        const monthlyRevenue = monthlyRevenueResult[0]?.revenue || 0;

        // Most booked studios
        const topStudios = await bookingsCollection.aggregate([
            {
                $match: {
                    status: { $in: ["confirmed", "completed"] },
                },
            },
            {
                $group: {
                    _id: "$studioId",
                    bookingCount: { $sum: 1 },
                    studioTitle: { $first: "$studioTitle" },
                    totalRevenue: {
                        $sum: {
                            $convert: {
                                input: "$totalPrice",
                                to: "double",
                                onError: 0,
                                onNull: 0,
                            },
                        },
                    },
                },
            },
            {
                $sort: {
                    bookingCount: -1,
                },
            },
            {
                $limit: 5,
            },
        ]).toArray();

        // Recent bookings
        const recentBookings = await bookingsCollection
            .find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

return res.status(200).json({
    success: true,
    message: "Dashboard data fetched successfully",

    admin: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
    },

    permissions,

    stats: {
        totalUsers: permissions.manageUsers ? totalUsers : null,

        totalStudios: permissions.manageStudios
            ? totalStudios
            : null,

        totalBookings: permissions.manageBookings
            ? totalBookings
            : null,

        pendingBookings: permissions.manageBookings
            ? pendingBookings
            : null,

        confirmedBookings: permissions.manageBookings
            ? confirmedBookings
            : null,

        completedBookings: permissions.manageBookings
            ? completedBookings
            : null,

        cancelledBookings: permissions.manageBookings
            ? cancelledBookings
            : null,

        totalRevenue: permissions.viewSales ? totalRevenue : null,

        todayRevenue: permissions.viewSales ? todayRevenue : null,

        monthlyRevenue: permissions.viewSales ? monthlyRevenue : null,
    },

    topStudios: permissions.viewSales ? topStudios : [],

    recentBookings: permissions.manageBookings ? recentBookings : [],
});

    } catch (error) {
        console.error("Admin Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load admin dashboard",
        });
    }
};



const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

// সাধারণ User-কে Sub-admin বানানো
const promoteToSubAdmin = async (req, res) => {
    try {
        const { userId, permissions } = req.body;

        if (!userId || !ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "A valid userId is required",
            });
        }

        const allowedPermissions = [
            "manageStudios",
            "manageBookings",
            "viewSales",
            "manageUsers",
        ];

        const safePermissions = {};

        for (const permission of allowedPermissions) {
            safePermissions[permission] =
                permissions?.[permission] === true;
        }

        const db = getDB();

        const result = await db.collection("user").updateOne(
           {
    _id: new ObjectId(userId),
    $or: [
        { role: "user" },
        { role: { $exists: false } },
    ],
},
            {
                $set: {
                    role: "sub-admin",
                    permissions: safePermissions,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found or user already has a privileged role",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User promoted to Sub-admin successfully",
            permissions: safePermissions,
        });
    } catch (error) {
        console.error("Promote Sub-admin error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to promote user",
        });
    }
};

// Sub-admin-এর Permission Update করা
const updateSubAdminPermissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permissions } = req.body;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "A valid userId is required",
            });
        }

        if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "Valid permissions are required",
            });
        }

        const allowedPermissions = [
            "manageStudios",
            "manageBookings",
            "viewSales",
            "manageUsers",
        ];

        const safePermissions = {};

        for (const permission of allowedPermissions) {
            safePermissions[permission] =
                permissions[permission] === true;
        }

        const db = getDB();

        const result = await db.collection("user").updateOne(
            {
                _id: new ObjectId(userId),
                role: "sub-admin",
            },
            {
                $set: {
                    permissions: safePermissions,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Sub-admin not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Sub-admin permissions updated successfully",
            permissions: safePermissions,
        });
    } catch (error) {
        console.error("Update permissions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update permissions",
        });
    }
};


// সব User এবং Sub-admin-এর তালিকা
const getAllUsers = async (req, res) => {
    try {
        const db = getDB();

        const users = await db.collection("user")
            .find(
                {},
                {
                    projection: {
                        name: 1,
                        email: 1,
                        role: 1,
                        permissions: 1,
                        image: 1,
                        createdAt: 1,
                    },
                }
            )
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
        });
    } catch (error) {
        console.error("Get All Users Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};


// Sub-admin-কে সাধারণ User করা
// Sub-admin-কে সাধারণ User করা
const demoteSubAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!userId || !ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "A valid userId is required",
            });
        }

        const db = getDB();

        const result = await db.collection("user").updateOne(
            {
                _id: new ObjectId(userId),
                role: "sub-admin",
            },
            {
                $set: {
                    role: "user",
                    permissions: {
                        manageStudios: false,
                        manageBookings: false,
                        viewSales: false,
                        manageUsers: false,
                    },
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Sub-admin not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Sub-admin successfully demoted to User",
        });

    } catch (error) {
        console.error("Demote Sub-admin error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to demote Sub-admin",
        });
    }
};


module.exports = {
    getAdminDashboard,
    getAllUsers,
    promoteToSubAdmin,
    updateSubAdminPermissions,
     demoteSubAdmin,
};
