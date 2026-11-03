const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const verifyPermission = require("../middleware/verifyPermission");

const {
    getAdminDashboard,
    getAllUsers,
    promoteToSubAdmin,
    updateSubAdminPermissions,
    demoteSubAdmin,
} = require("../controllers/adminController");

// Admin Dashboard
router.get(
    "/dashboard",
    verifyToken,
    getAdminDashboard
);

router.get("/users", verifyToken, verifyAdmin, getAllUsers);

// সাধারণ User-কে Sub-admin বানানো
router.patch("/users/promote", verifyToken, verifyAdmin, promoteToSubAdmin);



// Sub-admin-এর Permission পরিবর্তন
router.patch(
    "/users/:userId/permissions",
    verifyToken,
    verifyAdmin,
    updateSubAdminPermissions
);

// Sub-admin-কে সাধারণ User করা
router.patch(
    "/users/:userId/demote",
    verifyToken,
    verifyAdmin,
    demoteSubAdmin
);


module.exports = router;



// const express = require("express");
// const router = express.Router();

// const verifyToken = require("../middleware/verifyToken");
// const verifyAdmin = require("../middleware/verifyAdmin");

// const {
//     getAdminDashboard,
//     promoteToSubAdmin,
//     updateSubAdminPermissions,
// } = require("../controllers/adminController");

// // Admin Dashboard
// router.get("/dashboard", verifyToken, verifyAdmin, getAdminDashboard);

// // সাধারণ User-কে Sub-admin বানানো
// router.patch("/users/promote", verifyToken, verifyAdmin, promoteToSubAdmin);

// // Sub-admin-এর Permission পরিবর্তন
// router.patch(
//     "/users/:userId/permissions",
//     verifyToken,
//     verifyAdmin,
//     updateSubAdminPermissions
// );

// module.exports = router;