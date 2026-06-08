const express = require("express");
const router = express.Router();

const {
  addLocation,
  getMyLocations,
  deleteLocation,
} = require("../controllers/manageLocationController");

const { protect } = require("../middlewares/authMiddleware");

router.post("/add-location", protect, addLocation);
router.get("/my-locations", protect, getMyLocations);
router.delete("/delete-location/:locationId", protect, deleteLocation);

module.exports = router;