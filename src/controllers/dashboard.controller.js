const prisma = require("../config/database");

// =========================
// HELPER
// =========================
const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// =========================
// GET DASHBOARD
// =========================
const getDashboard = async (req, res) => {
    try {
        // =========================
        // TANGGAL BULAN BERJALAN
        // =========================
        const sekarang = new Date();

        const awalBulan = new Date(
            sekarang.getFullYear(),
            sekarang.getMonth(),
            1,
            0,
            0,
            0
        );

        const awalBulanBerikutnya = new Date(
            sekarang.getFullYear(),
            sekarang.getMonth() + 1,
            1,
            0,
            0,
            0
        );

        // =========================
        // AMBIL USAHA
        // =========================
        const usaha = await prisma.usaha.findMany({
            select: {
                id: true,
                nama_usaha: true,
            },
            orderBy: {
                id: "asc",
            },
        });

        // ==================================================
        // TOTAL KESELURUHAN PENJUALAN LUNAS
        // ==================================================
        const penjualanLunas = await prisma.penjualan.findMany({
            where: {
                status: "LUNAS",
            },
            select: {
                id: true,
                total: true,
                detail_penjualan: {
                    select: {
                        qty: true,
                        harga_modal: true,
                    },
                },
            },
        });

        // =========================
        // TOTAL PENDAPATAN
        // =========================
        const totalPendapatan = penjualanLunas.reduce(
            (total, penjualan) => {
                return total + Number(penjualan.total);
            },
            0
        );

        // =========================
        // TOTAL HPP
        // =========================
        const totalHpp = penjualanLunas.reduce(
            (total, penjualan) => {
                const hppPenjualan =
                    penjualan.detail_penjualan.reduce(
                        (subtotal, detail) => {
                            return (
                                subtotal +
                                Number(detail.harga_modal) *
                                    Number(detail.qty)
                            );
                        },
                        0
                    );

                return total + hppPenjualan;
            },
            0
        );

        // =========================
        // LABA KOTOR
        // =========================
        const labaKotor =
            totalPendapatan - totalHpp;

        // ==================================================
        // TOTAL PENGELUARAN KESELURUHAN
        // ==================================================
        const pengeluaran = await prisma.pengeluaran.aggregate({
            _sum: {
                nominal: true,
            },
        });

        const totalPengeluaran =
            Number(pengeluaran._sum.nominal || 0);

        // =========================
        // LABA BERSIH
        // =========================
        const labaBersih =
            labaKotor - totalPengeluaran;

        // =========================
        // TOTAL PIUTANG
        // =========================
        const piutang = await prisma.piutang.aggregate({
            _sum: {
                sisa_piutang: true,
            },
            where: {
                status: "BELUM_LUNAS",
            },
        });

        const totalPiutang =
            Number(piutang._sum.sisa_piutang || 0);

        // =========================
        // TOTAL HUTANG
        // =========================
        const hutang = await prisma.hutang.aggregate({
            _sum: {
                sisa_hutang: true,
            },
            where: {
                status: "BELUM_LUNAS",
            },
        });

        const totalHutang =
            Number(hutang._sum.sisa_hutang || 0);

        // =========================
        // TOTAL SALDO REKENING
        // =========================
        const rekening = await prisma.rekening.aggregate({
            _sum: {
                saldo: true,
            },
        });

        const totalSaldo =
            Number(rekening._sum.saldo || 0);

        // ==================================================
        // PENJUALAN BULAN BERJALAN
        // ==================================================
        const penjualanBulanIni =
            await prisma.penjualan.findMany({
                where: {
                    status: "LUNAS",
                    tanggal: {
                        gte: awalBulan,
                        lt: awalBulanBerikutnya,
                    },
                },
                select: {
                    id: true,
                    total: true,
                    detail_penjualan: {
                        select: {
                            qty: true,
                            harga_modal: true,
                        },
                    },
                },
            });

        // =========================
        // PENDAPATAN BULAN INI
        // =========================
        const pendapatanBulanIni =
            penjualanBulanIni.reduce(
                (total, penjualan) => {
                    return total + Number(penjualan.total);
                },
                0
            );

        // =========================
        // HPP BULAN INI
        // =========================
        const hppBulanIni =
            penjualanBulanIni.reduce(
                (total, penjualan) => {
                    const hppPenjualan =
                        penjualan.detail_penjualan.reduce(
                            (subtotal, detail) => {
                                return (
                                    subtotal +
                                    Number(detail.harga_modal) *
                                        Number(detail.qty)
                                );
                            },
                            0
                        );

                    return total + hppPenjualan;
                },
                0
            );

        // =========================
        // LABA KOTOR BULAN INI
        // =========================
        const labaKotorBulanIni =
            pendapatanBulanIni - hppBulanIni;

        // ==================================================
        // PENGELUARAN BULAN INI
        // ==================================================
        const pengeluaranBulanIni =
            await prisma.pengeluaran.aggregate({
                _sum: {
                    nominal: true,
                },
                where: {
                    tanggal: {
                        gte: awalBulan,
                        lt: awalBulanBerikutnya,
                    },
                },
            });

        const totalPengeluaranBulanIni =
            Number(
                pengeluaranBulanIni._sum.nominal || 0
            );

        // =========================
        // LABA BERSIH BULAN INI
        // =========================
        const labaBersihBulanIni =
            labaKotorBulanIni -
            totalPengeluaranBulanIni;

            // ==================================================
// PRODUK STOK RENDAH
// ==================================================
const produkStokRendah = await prisma.produk.findMany({
    where: {
        stok: {
            lte: 5,
        },
        status: "ACTIVE",
    },
    select: {
        id: true,
        usaha_id: true,
        kode_produk: true,
        nama: true,
        stok: true,
        satuan: true,
        harga_modal: true,
        harga_jual: true,
    },
    orderBy: [
        {
            stok: "asc",
        },
        {
            nama: "asc",
        },
    ],
});


// ==================================================
// TRANSAKSI KAS TERBARU
// ==================================================
const transaksiKasTerbaru =
    await prisma.transaksiKas.findMany({
        orderBy: {
            tanggal: "desc",
        },
        take: 5,
        select: {
            id: true,
            rekening_id: true,
            referensi_tipe: true,
            referensi_id: true,
            nomor_referensi: true,
            jenis: true,
            tanggal: true,
            nominal: true,
            saldo_sebelum: true,
            saldo_setelah: true,
            keterangan: true,
        },
    });

        // ==================================================
        // RESPONSE
        // ==================================================
        return res.status(200).json({
            success: true,
            message: "Data dashboard berhasil diambil",

            data: serializeBigInt({
                usaha,

                produk_stok_rendah: produkStokRendah,

                transaksi_kas_terbaru: transaksiKasTerbaru,

                periode: {
                    bulan: sekarang.getMonth() + 1,
                    tahun: sekarang.getFullYear(),
                },

                ringkasan: {
                    total_pendapatan: totalPendapatan,
                    total_hpp: totalHpp,
                    laba_kotor: labaKotor,
                    total_pengeluaran: totalPengeluaran,
                    laba_bersih: labaBersih,
                    total_saldo: totalSaldo,
                    total_piutang: totalPiutang,
                    total_hutang: totalHutang,
                },

                bulan_ini: {
                    pendapatan: pendapatanBulanIni,
                    hpp: hppBulanIni,
                    laba_kotor: labaKotorBulanIni,
                    pengeluaran: totalPengeluaranBulanIni,
                    laba_bersih: labaBersihBulanIni,
                },
            }),
        });
    } catch (error) {
        console.error("GET DASHBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data dashboard",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboard,
};