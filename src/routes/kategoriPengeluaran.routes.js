const express = require("express");

const {
    getAllKategoriPengeluaran,
    getKategoriPengeluaranById,
    createKategoriPengeluaran,
    updateKategoriPengeluaran,
    deleteKategoriPengeluaran,
} = require("../controllers/kategoriPengeluaran.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

// GET ALL
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllKategoriPengeluaran
);

// GET BY ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getKategoriPengeluaranById
);

// CREATE
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createKategoriPengeluaran
);

// UPDATE
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updateKategoriPengeluaran
);

// DELETE
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deleteKategoriPengeluaran
);

module.exports = router;