const express = require("express");

const {
    createUsaha,
    getAllUsaha,
    getUsahaById,
    updateUsaha,
    deleteUsaha,
} = require("../controllers/usaha.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

// ========================================
// CREATE USAHA
// OWNER saja
// POST /api/usaha
// ========================================
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER"),
    createUsaha
);

// ========================================
// GET ALL USAHA
// OWNER saja
// GET /api/usaha
// ========================================
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER"),
    getAllUsaha
);

// ========================================
// GET USAHA BY ID
// OWNER saja
// GET /api/usaha/:id
// ========================================
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER"),
    getUsahaById
);

// ========================================
// UPDATE USAHA
// OWNER saja
// PUT /api/usaha/:id
// ========================================
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER"),
    updateUsaha
);

// ========================================
// DELETE USAHA
// OWNER saja
// DELETE /api/usaha/:id
// ========================================
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER"),
    deleteUsaha
);

module.exports = router;