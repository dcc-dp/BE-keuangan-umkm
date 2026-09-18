const express = require("express");

const {
    createPelanggan,
    getAllPelanggan,
    getPelangganById,
    updatePelanggan,
    deletePelanggan,
} = require("../controllers/pelanggan.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();


// CREATE
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    createPelanggan
);


// GET ALL
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    getAllPelanggan
);


// GET BY ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    getPelangganById
);


// UPDATE
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN", "KASIR"),
    updatePelanggan
);


// DELETE
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deletePelanggan
);


module.exports = router;