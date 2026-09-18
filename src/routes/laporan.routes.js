const express = require("express");

const {
    getLabaRugi,
    getLaporanPenjualan,
    getLaporanPembelian,
    getLaporanPengeluaran,
    getLaporanArusKas,
    getLaporanPiutang,
    getLaporanHutang,
    getLaporanStok,
} = require("../controllers/laporan.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
    "/laba-rugi",
    roleMiddleware("OWNER", "ADMIN"),
    getLabaRugi
);

router.get(
    "/penjualan",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanPenjualan
);

router.get(
    "/pembelian",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanPembelian
);

router.get(
    "/pengeluaran",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanPengeluaran
);

router.get(
    "/arus-kas",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanArusKas
);

router.get(
    "/piutang",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanPiutang
);

router.get(
    "/hutang",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanHutang
);

router.get(
    "/stok",
    roleMiddleware("OWNER", "ADMIN"),
    getLaporanStok
);

module.exports = router;