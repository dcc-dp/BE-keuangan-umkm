const express = require("express");

const {
    getAllPiutang,
    getPiutangById,
    createPiutang,
    updatePiutang,
    deletePiutang,
} = require("../controllers/piutang.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllPiutang
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getPiutangById
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createPiutang
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updatePiutang
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deletePiutang
);

module.exports = router;