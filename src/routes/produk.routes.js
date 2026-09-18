const express = require("express");

const {
    createProduk,
    getAllProduk,
    getProdukById,
    updateProduk,
    deleteProduk,
} = require("../controllers/produk.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();


// =====================================================
// CREATE PRODUK
// OWNER dan ADMIN
// =====================================================
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createProduk
);


// =====================================================
// GET ALL PRODUK
// OWNER dan ADMIN
// =====================================================
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllProduk
);


// =====================================================
// GET PRODUK BY ID
// OWNER dan ADMIN
// =====================================================
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getProdukById
);


// =====================================================
// UPDATE PRODUK
// OWNER dan ADMIN
// =====================================================
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updateProduk
);


// =====================================================
// DELETE PRODUK
// OWNER dan ADMIN
// =====================================================
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deleteProduk
);


module.exports = router;