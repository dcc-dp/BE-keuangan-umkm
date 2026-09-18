const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const usahaRoutes = require("./routes/usaha.routes");
const kategoriProdukRoutes = require("./routes/kategoriProduk.routes");
const produkRoutes = require("./routes/produk.routes");
const pelangganRoutes = require("./routes/pelanggan.routes");
const supplierRoutes = require("./routes/supplier.routes");
const rekeningRoutes = require("./routes/rekening.routes");
const penjualanRoutes = require("./routes/penjualan.routes");
const pembelianRoutes = require("./routes/pembelian.routes");
const kategoriPengeluaranRoutes = require("./routes/kategoriPengeluaran.routes");
const pengeluaranRoutes = require("./routes/pengeluaran.routes");
const transaksiKasRoutes = require("./routes/transaksiKas.routes");
const piutangRoutes = require("./routes/piutang.routes");
const pembayaranPiutangRoutes = require("./routes/pembayaranPiutang.routes");
const hutangRoutes = require("./routes/hutang.routes");
const pembayaranHutangRoutes = require("./routes/pembayaranHutang.routes");
const targetKeuanganRoutes = require("./routes/targetKeuangan.routes");
const notifikasiRoutes = require("./routes/notifikasi.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const laporanRoutes = require("./routes/laporan.routes");
const authMiddleware = require("./middlewares/auth.middleware");
const roleMiddleware = require("./middlewares/role.middleware");

const app = express();

// ================================
// MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// ROUTES
// ================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend UMKM Finance API berhasil berjalan",
    });
});

// Authentication
app.use("/api/auth", authRoutes);
// Usaha
app.use("/api/usaha", usahaRoutes);
//kategori Produk
app.use("/api/kategori-produk", kategoriProdukRoutes);
// Produk
app.use("/api/produk", produkRoutes);
// Supplier
app.use("/api/supplier", supplierRoutes);
// Pelanggan
app.use("/api/pelanggan", pelangganRoutes);
// Rekening
app.use("/api/rekening", rekeningRoutes);
// Penjualan
app.use("/api/penjualan", penjualanRoutes);
// Pembelian
app.use("/api/pembelian", pembelianRoutes);
// Kategori Pengeluaran
app.use("/api/kategori-pengeluaran", kategoriPengeluaranRoutes);
// Pengeluaran
app.use("/api/pengeluaran", pengeluaranRoutes);
// Transaksi Kas
app.use("/api/transaksi-kas", transaksiKasRoutes);
// Piutang
app.use("/api/piutang", piutangRoutes);
// Pembayaran Piutang
app.use("/api/pembayaran-piutang", pembayaranPiutangRoutes);
// Hutang
app.use("/api/hutang", hutangRoutes);
// Pembayaran Hutang
app.use("/api/pembayaran-hutang", pembayaranHutangRoutes);
// Target Keuangan
app.use("/api/target-keuangan", targetKeuanganRoutes);
// Notifikasi
app.use("/api/notifikasi", notifikasiRoutes);
// Dashboard
app.use("/api/dashboard", dashboardRoutes);
// Laporan
app.use("/api/laporan", laporanRoutes);

// ========================================
// TEST ROLE ADMIN
// ========================================
app.get(
    "/api/admin-test",
    authMiddleware,
    roleMiddleware("ADMIN"),
    (req, res) => {
        res.json({
            success: true,
            message: "Akses ADMIN berhasil",
            user: req.user,
        });
    }
);

// ========================================
// TEST ROLE OWNER
// ========================================
app.get(
    "/api/owner-test",
    authMiddleware,
    roleMiddleware("OWNER"),
    (req, res) => {
        res.json({
            success: true,
            message: "Akses OWNER berhasil",
            user: req.user,
        });
    }
);

// ========================================
// TEST PROTECTED ROUTE
// ========================================
app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Akses berhasil. Token valid.",
        user: req.user,
    });
});

// Test database
app.get("/api/test-db", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            success: true,
            message: "Koneksi Prisma ke MySQL berhasil",
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Koneksi database gagal",
            error: error.message,
        });
    }
});

// ================================
// SERVER
// ================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});