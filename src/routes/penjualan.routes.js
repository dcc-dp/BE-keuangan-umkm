const express = require("express");

const {
    createPenjualan,
    getAllPenjualan,
    getPenjualanById,
    updatePenjualan,
    deletePenjualan
} = require("../controllers/penjualan.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();


// ==========================================
// GET ALL
// OWNER, ADMIN, KASIR
// ==========================================
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    getAllPenjualan
);


// ==========================================
// GET BY ID
// OWNER, ADMIN, KASIR
// ==========================================
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    getPenjualanById
);


// ==========================================
// CREATE
// OWNER, ADMIN, KASIR
// ==========================================
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    createPenjualan
);


// ==========================================
// UPDATE
// OWNER, ADMIN, KASIR
// ==========================================
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    updatePenjualan
);


// ==========================================
// DELETE
// OWNER, ADMIN
// ==========================================
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deletePenjualan
);


module.exports = router;