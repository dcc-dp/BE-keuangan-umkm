const express = require("express");

const {
    createKategoriProduk,
    getAllKategoriProduk,
    getKategoriProdukById,
    updateKategoriProduk,
    deleteKategoriProduk,
} = require("../controllers/kategoriProduk.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createKategoriProduk
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllKategoriProduk
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getKategoriProdukById
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updateKategoriProduk
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deleteKategoriProduk
);

module.exports = router;