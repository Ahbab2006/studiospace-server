
const { getDB } = require("../config/db");

const { ObjectId } = require("mongodb");

// Get all studios
const getAllStudios = async (req, res) => {
    try {
        const db = getDB();

        const studios = await db
            .collection("studios")
            .find({})
            .sort({ _id: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Studios fetched successfully",
            data: studios,
        });
    } catch (error) {
        console.error("Get studios error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch studios",
        });
    }
};

// Get featured studios
const getFeaturedStudios = async (req, res) => {
    try {
        const db = getDB();

        const studios = await db
            .collection("studios")
            .find({})
            .sort({ _id: -1 })
            .limit(6)
            .toArray();

        res.status(200).json({
            success: true,
            message: "Featured studios fetched successfully",
            data: studios,
        });
    } catch (error) {
        console.error("Featured studios error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch featured studios",
        });
    }
};


// Add a new studio
// Add a new studio
const addStudio = async (req, res) => {
    try {
        const db = getDB();

        const {
            title,
            category,
            hourlyRate,
            securityDeposit,
            maxCapacity,
            openingTime,
            closingTime,
            location,
            image,
            amenities,
            overview,
        } = req.body;

        if (
            !title ||
            !category ||
            hourlyRate === undefined ||
            securityDeposit === undefined ||
            !maxCapacity ||
            !openingTime ||
            !closingTime ||
            !location ||
            !image ||
            !amenities ||
            !overview
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Validate studio opening and closing time
        if (closingTime <= openingTime) {
            return res.status(400).json({
                success: false,
                message: "Closing time must be later than opening time",
            });
        }

        const newStudio = {
            title,
            category,
            hourlyRate: Number(hourlyRate),
            securityDeposit: Number(securityDeposit),
            maxCapacity: Number(maxCapacity),
            openingTime,
            closingTime,
            location,
            image,
            amenities: Array.isArray(amenities)
                ? amenities
                : amenities.split(",").map((item) => item.trim()),
            overview,
            hostEmail: req.user.email,
            hostName: req.user.name,
            createdAt: new Date(),
        };

        const result = await db.collection("studios").insertOne(newStudio);

        res.status(201).json({
            success: true,
            message: "Studio added successfully",
            data: {
                ...newStudio,
                _id: result.insertedId,
            },
        });
    } catch (error) {
        console.error("Add studio error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to add studio",
        });
    }
};


const getMyListings = async (req, res) => {
    try {
        const email = req.user.email;

        if (!email) {
            return res.status(401).json({
                success: false,
                message: "User email not found",
            });
        }

        const db = getDB();

        const myStudios = await db
            .collection("studios")
            .find({ hostEmail: email })
            .toArray();

        res.status(200).json({
            success: true,
            data: myStudios,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};




const updateStudio = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            category,
            hourlyRate,
            securityDeposit,
            maxCapacity,
            openingTime,
            closingTime,
            location,
            image,
            amenities,
            overview,
        } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Studio ID",
            });
        }

        if (
            openingTime &&
            closingTime &&
            closingTime <= openingTime
        ) {
            return res.status(400).json({
                success: false,
                message: "Closing time must be later than opening time",
            });
        }

        const db = getDB();

        const filter = {
            _id: new ObjectId(id),
        };

        if (req.user.role === "user") {
            filter.hostEmail = req.user.email;
        }

        const updateData = {
            title,
            category,
            hourlyRate: Number(hourlyRate),
            securityDeposit: Number(securityDeposit),
            maxCapacity: Number(maxCapacity),
            openingTime,
            closingTime,
            location,
            image,
            amenities: Array.isArray(amenities)
                ? amenities
                : amenities?.split(",").map((item) => item.trim()),
            overview,
            updatedAt: new Date(),
        };

        const updatedStudio = await db.collection("studios").findOneAndUpdate(
            filter,
            {
                $set: updateData,
            },
            { returnDocument: "after" }
        );

        if (!updatedStudio) {
            return res.status(404).json({
                success: false,
                message: "Studio not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Studio updated successfully",
            data: updatedStudio,
        });
    } catch (error) {
        console.error("Update studio error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteStudio = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Studio ID",
            });
        }

        const db = getDB();

      const filter = {
    _id: new ObjectId(id),
};

// Normal user শুধু নিজের Studio delete করতে পারবে
if (req.user.role === "user") {
    filter.hostEmail = req.user.email;
}

const result = await db.collection("studios").deleteOne(filter);

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Studio not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Studio deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



const getStudioById = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid studio ID",
            });
        }

        const studio = await db.collection("studios").findOne({
            _id: new ObjectId(id),
        });

        if (!studio) {
            return res.status(404).json({
                success: false,
                message: "Studio not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Studio fetched successfully",
            data: studio,
        });
    } catch (error) {
        console.error("Get studio by ID error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch studio",
        });
    }
};


module.exports = {
    getAllStudios,
    getFeaturedStudios,
    addStudio,
    getStudioById,
    getMyListings,
    updateStudio,
    deleteStudio,
};
