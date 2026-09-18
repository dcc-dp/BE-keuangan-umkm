const express = require("express");

const {
    createPembelian,
    getAllPembelian,
    getPembelianById,
    updatePembelian,
    deletePembelian
} = require("../controllers/pembelian.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllPembelian
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getPembelianById
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createPembelian
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updatePembelian
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deletePembelian
);

module.exports = router;