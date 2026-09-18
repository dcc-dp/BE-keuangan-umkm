const express = require("express");

const {
    createRekening,
    getAllRekening,
    getRekeningById,
    updateRekening,
    deleteRekening
} = require("../controllers/rekening.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();


// ==========================================
// GET ALL REKENING
// OWNER & ADMIN
// ==========================================
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllRekening
);


// ==========================================
// GET REKENING BY ID
// OWNER & ADMIN
// ==========================================
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getRekeningById
);


// ==========================================
// CREATE REKENING
// OWNER
// ==========================================
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER"),
    createRekening
);


// ==========================================
// UPDATE REKENING
// OWNER
// ==========================================
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER"),
    updateRekening
);


// ==========================================
// DELETE REKENING
// OWNER
// ==========================================
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER"),
    deleteRekening
);


module.exports = router;