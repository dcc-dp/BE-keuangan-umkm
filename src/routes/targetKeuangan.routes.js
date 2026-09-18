const express = require("express");

const {
    getAllTargetKeuangan,
    getTargetKeuanganById,
    createTargetKeuangan,
    updateTargetKeuangan,
    deleteTargetKeuangan,
} = require("../controllers/targetKeuangan.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    getAllTargetKeuangan
);

router.get(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    getTargetKeuanganById
);

router.post(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    createTargetKeuangan
);

router.put(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    updateTargetKeuangan
);

router.delete(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    deleteTargetKeuangan
);

module.exports = router;