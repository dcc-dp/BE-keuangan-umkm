const express = require("express");

const {
    getAllNotifikasi,
    getNotifikasiById,
    createNotifikasi,
    updateNotifikasi,
    deleteNotifikasi,
} = require("../controllers/notifikasi.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    getAllNotifikasi
);

router.get(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    getNotifikasiById
);

router.post(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    createNotifikasi
);

router.put(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    updateNotifikasi
);

router.delete(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    deleteNotifikasi
);

module.exports = router;