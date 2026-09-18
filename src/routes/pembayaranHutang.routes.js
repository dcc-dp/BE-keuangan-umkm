const express = require("express");

const {
    getAllPembayaranHutang,
    getPembayaranHutangById,
    createPembayaranHutang,
} = require("../controllers/pembayaranHutang.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

// OWNER dan ADMIN
router.get(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    getAllPembayaranHutang
);

router.get(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    getPembayaranHutangById
);

router.post(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    createPembayaranHutang
);

module.exports = router;