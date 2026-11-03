const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyPermission = require("../middleware/verifyPermission");

const {
    getAllStudios,
    getFeaturedStudios,
    addStudio,
    getStudioById,
    getMyListings,
    updateStudio,
    deleteStudio,
} = require("../controllers/studioController");

// Public routes
router.get("/", getAllStudios);
router.get("/featured", getFeaturedStudios);

router.get("/my-listings", verifyToken, getMyListings);

router.get("/:id", getStudioById);
// Permission protected routes
router.post(
    "/",
    verifyToken,
    verifyPermission("manageStudios"),
    addStudio
);

router.put(
    "/:id",
    verifyToken,
    verifyPermission("manageStudios"),
    updateStudio
);

router.delete(
    "/:id",
    verifyToken,
    verifyPermission("manageStudios"),
    deleteStudio
);

module.exports = router;