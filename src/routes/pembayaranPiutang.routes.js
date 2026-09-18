const express = require("express");

const {
    getAllPembayaranPiutang,
    getPembayaranPiutangById,
    createPembayaranPiutang,
} = require("../controllers/pembayaranPiutang.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

// GET ALL
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllPembayaranPiutang
);

// GET BY ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getPembayaranPiutangById
);

// CREATE
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createPembayaranPiutang
);

module.exports = router;