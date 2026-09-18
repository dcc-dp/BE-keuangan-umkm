const express = require("express");

const {
    getAllHutang,
    getHutangById,
    createHutang,
    updateHutang,
    deleteHutang,
} = require("../controllers/hutang.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

// Semua endpoint hutang membutuhkan login
router.use(authMiddleware);

// OWNER dan ADMIN
router.get(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    getAllHutang
);

router.get(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    getHutangById
);

router.post(
    "/",
    roleMiddleware("OWNER", "ADMIN"),
    createHutang
);

router.put(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    updateHutang
);

router.delete(
    "/:id",
    roleMiddleware("OWNER", "ADMIN"),
    deleteHutang
);

module.exports = router;