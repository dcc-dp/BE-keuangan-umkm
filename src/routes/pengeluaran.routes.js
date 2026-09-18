const express = require("express");

const {
    getAllPengeluaran,
    getPengeluaranById,
    createPengeluaran,
    updatePengeluaran,
    deletePengeluaran,
} = require("../controllers/pengeluaran.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

// GET ALL
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllPengeluaran
);

// GET BY ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getPengeluaranById
);

// CREATE
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createPengeluaran
);

// UPDATE
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updatePengeluaran
);

// DELETE
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deletePengeluaran
);

module.exports = router;