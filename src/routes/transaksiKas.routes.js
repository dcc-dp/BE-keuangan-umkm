const express = require("express");

const {
    getAllTransaksiKas,
    getTransaksiKasById,
} = require("../controllers/transaksiKas.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllTransaksiKas
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getTransaksiKasById
);

module.exports = router;