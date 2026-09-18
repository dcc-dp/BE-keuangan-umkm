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
// LAPORAN LABA RUGI
// =========================
const getLabaRugi = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.query;

        // =========================
        // VALIDASI TANGGAL
        // =========================
        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(`${tanggal_awal}T00:00:00`);
        const akhir = new Date(`${tanggal_akhir}T23:59:59`);

        if (
            isNaN(awal.getTime()) ||
            isNaN(akhir.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        // ==================================================
        // PENJUALAN LUNAS
        // ==================================================
        const penjualan = await prisma.penjualan.findMany({
            where: {
                status: "LUNAS",
                tanggal: {
                    gte: awal,
                    lte: akhir,
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
        // PENDAPATAN
        // =========================
        const pendapatan = penjualan.reduce(
            (total, item) => {
                return total + Number(item.total);
            },
            0
        );

        // =========================
        // HPP
        // =========================
        const hpp = penjualan.reduce(
            (total, item) => {
                const hppPenjualan =
                    item.detail_penjualan.reduce(
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
        const labaKotor = pendapatan - hpp;

        // ==================================================
        // PENGELUARAN
        // ==================================================
        const pengeluaran =
            await prisma.pengeluaran.aggregate({
                _sum: {
                    nominal: true,
                },
                where: {
                    tanggal: {
                        gte: awal,
                        lte: akhir,
                    },
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
        // RESPONSE
        // =========================
        return res.status(200).json({
            success: true,
            message: "Laporan laba rugi berhasil diambil",
            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },

                pendapatan,
                hpp,
                laba_kotor: labaKotor,
                pengeluaran: totalPengeluaran,
                laba_bersih: labaBersih,
            }),
        });
    } catch (error) {
        console.error(
            "GET LAPORAN LABA RUGI ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil laporan laba rugi",
            error: error.message,
        });
    }
};

// =========================
// LAPORAN PENJUALAN
// =========================
const getLaporanPenjualan = async (req, res) => {
    try {
        const {
            tanggal_awal,
            tanggal_akhir,
        } = req.query;

        // =========================
        // VALIDASI TANGGAL
        // =========================
        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(
            `${tanggal_awal}T00:00:00`
        );

        const akhir = new Date(
            `${tanggal_akhir}T23:59:59`
        );

        if (
            isNaN(awal.getTime()) ||
            isNaN(akhir.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        // =========================
        // AMBIL DATA PENJUALAN
        // =========================
        const data = await prisma.penjualan.findMany({
            where: {
                tanggal: {
                    gte: awal,
                    lte: akhir,
                },
            },
            orderBy: {
                tanggal: "desc",
            },
            select: {
                id: true,
                usaha_id: true,
                pelanggan_id: true,
                rekening_id: true,
                nomor_invoice: true,
                tanggal: true,
                subtotal: true,
                diskon: true,
                pajak: true,
                biaya_lain: true,
                total: true,
                metode_pembayaran: true,
                status: true,
                catatan: true,

                pelanggan: {
                    select: {
                        id: true,
                        nama: true,
                        telepon: true,
                    },
                },

                rekening: {
                    select: {
                        id: true,
                        nama_rekening: true,
                        bank: true,
                    },
                },

                detail_penjualan: {
                    select: {
                        id: true,
                        produk_id: true,
                        qty: true,
                        harga_modal: true,
                        harga: true,
                        diskon: true,
                        subtotal: true,

                        produk: {
                            select: {
                                id: true,
                                kode_produk: true,
                                nama: true,
                                satuan: true,
                            },
                        },
                    },
                },
            },
        });

        // =========================
        // HITUNG RINGKASAN
        // =========================
        const jumlahTransaksi = data.length;

        const totalPenjualan = data.reduce(
            (total, item) => {
                return total + Number(item.total);
            },
            0
        );

        const totalDiskon = data.reduce(
            (total, item) => {
                return total + Number(item.diskon);
            },
            0
        );

        const totalPajak = data.reduce(
            (total, item) => {
                return total + Number(item.pajak);
            },
            0
        );

        const totalBiayaLain = data.reduce(
            (total, item) => {
                return total + Number(item.biaya_lain);
            },
            0
        );

        // =========================
        // RESPONSE
        // =========================
        return res.status(200).json({
            success: true,
            message: "Laporan penjualan berhasil diambil",

            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },

                ringkasan: {
                    jumlah_transaksi: jumlahTransaksi,
                    total_penjualan: totalPenjualan,
                    total_diskon: totalDiskon,
                    total_pajak: totalPajak,
                    total_biaya_lain: totalBiayaLain,
                },

                penjualan: data,
            }),
        });
    } catch (error) {
        console.error(
            "GET LAPORAN PENJUALAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil laporan penjualan",
            error: error.message,
        });
    }
};

// =========================
// LAPORAN PEMBELIAN
// =========================
const getLaporanPembelian = async (req, res) => {
    try {
        const {
            tanggal_awal,
            tanggal_akhir,
        } = req.query;

        // =========================
        // VALIDASI TANGGAL
        // =========================
        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(
            `${tanggal_awal}T00:00:00`
        );

        const akhir = new Date(
            `${tanggal_akhir}T23:59:59`
        );

        if (
            isNaN(awal.getTime()) ||
            isNaN(akhir.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        // =========================
        // AMBIL DATA PEMBELIAN
        // =========================
        const data = await prisma.pembelian.findMany({
            where: {
                tanggal: {
                    gte: awal,
                    lte: akhir,
                },
            },
            orderBy: {
                tanggal: "desc",
            },
            select: {
                id: true,
                usaha_id: true,
                supplier_id: true,
                rekening_id: true,
                nomor_faktur: true,
                tanggal: true,
                subtotal: true,
                diskon: true,
                pajak: true,
                ongkir: true,
                total: true,
                metode_pembayaran: true,
                status: true,
                catatan: true,

                supplier: {
                    select: {
                        id: true,
                        nama: true,
                        telepon: true,
                        email: true,
                    },
                },

                rekening: {
                    select: {
                        id: true,
                        nama_rekening: true,
                        bank: true,
                    },
                },

                detail_pembelian: {
                    select: {
                        id: true,
                        produk_id: true,
                        qty: true,
                        harga: true,
                        harga_jual: true,
                        subtotal: true,

                        produk: {
                            select: {
                                id: true,
                                kode_produk: true,
                                nama: true,
                                satuan: true,
                            },
                        },
                    },
                },
            },
        });

        // =========================
        // HITUNG RINGKASAN
        // =========================
        const jumlahTransaksi = data.length;

        const totalPembelian = data.reduce(
            (total, item) => {
                return total + Number(item.total);
            },
            0
        );

        const totalDiskon = data.reduce(
            (total, item) => {
                return total + Number(item.diskon);
            },
            0
        );

        const totalPajak = data.reduce(
            (total, item) => {
                return total + Number(item.pajak);
            },
            0
        );

        const totalOngkir = data.reduce(
            (total, item) => {
                return total + Number(item.ongkir);
            },
            0
        );

        // =========================
        // RESPONSE
        // =========================
        return res.status(200).json({
            success: true,
            message: "Laporan pembelian berhasil diambil",

            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },

                ringkasan: {
                    jumlah_transaksi: jumlahTransaksi,
                    total_pembelian: totalPembelian,
                    total_diskon: totalDiskon,
                    total_pajak: totalPajak,
                    total_ongkir: totalOngkir,
                },

                pembelian: data,
            }),
        });
    } catch (error) {
        console.error(
            "GET LAPORAN PEMBELIAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil laporan pembelian",
            error: error.message,
        });
    }
};

// =========================
// LAPORAN PENGELUARAN
// =========================
const getLaporanPengeluaran = async (req, res) => {
    try {
        const {
            tanggal_awal,
            tanggal_akhir,
        } = req.query;

        // =========================
        // VALIDASI TANGGAL
        // =========================
        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(
            `${tanggal_awal}T00:00:00`
        );

        const akhir = new Date(
            `${tanggal_akhir}T23:59:59`
        );

        if (
            isNaN(awal.getTime()) ||
            isNaN(akhir.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message:
                    "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        // =========================
        // AMBIL DATA PENGELUARAN
        // =========================
        const data =
            await prisma.pengeluaran.findMany({
                where: {
                    tanggal: {
                        gte: awal,
                        lte: akhir,
                    },
                },
                orderBy: {
                    tanggal: "desc",
                },
                select: {
                    id: true,
                    usaha_id: true,
                    kategori_id: true,
                    rekening_id: true,
                    tanggal: true,
                    nominal: true,
                    keterangan: true,

                    kategori: {
                        select: {
                            id: true,
                            nama: true,
                        },
                    },

                    rekening: {
                        select: {
                            id: true,
                            nama_rekening: true,
                            bank: true,
                        },
                    },
                },
            });

        // =========================
        // HITUNG RINGKASAN
        // =========================
        const jumlahTransaksi = data.length;

        const totalPengeluaran = data.reduce(
            (total, item) => {
                return total + Number(item.nominal);
            },
            0
        );

        // =========================
        // RESPONSE
        // =========================
        return res.status(200).json({
            success: true,
            message:
                "Laporan pengeluaran berhasil diambil",

            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },

                ringkasan: {
                    jumlah_transaksi: jumlahTransaksi,
                    total_pengeluaran: totalPengeluaran,
                },

                pengeluaran: data,
            }),
        });
    } catch (error) {
        console.error(
            "GET LAPORAN PENGELUARAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Gagal mengambil laporan pengeluaran",
            error: error.message,
        });
    }
};

const getLaporanArusKas = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.query;

        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message: "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(`${tanggal_awal}T00:00:00`);
        const akhir = new Date(`${tanggal_akhir}T23:59:59`);

        if (isNaN(awal.getTime()) || isNaN(akhir.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message: "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        const transaksi = await prisma.transaksiKas.findMany({
            where: {
                tanggal: {
                    gte: awal,
                    lte: akhir,
                },
            },
            orderBy: {
                tanggal: "desc",
            },
            select: {
                id: true,
                usaha_id: true,
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
                rekening: {
                    select: {
                        id: true,
                        nama_rekening: true,
                        bank: true,
                    },
                },
            },
        });

        const totalKasMasuk = transaksi
            .filter((item) => item.jenis === "MASUK")
            .reduce((total, item) => total + Number(item.nominal), 0);

        const totalKasKeluar = transaksi
            .filter((item) => item.jenis === "KELUAR")
            .reduce((total, item) => total + Number(item.nominal), 0);

        let saldoAwal = 0;
        let saldoAkhir = 0;

        if (transaksi.length > 0) {
            const transaksiTerlama = [...transaksi].sort(
                (a, b) => new Date(a.tanggal) - new Date(b.tanggal)
            )[0];

            const transaksiTerbaru = transaksi[0];

            saldoAwal = Number(transaksiTerlama.saldo_sebelum);
            saldoAkhir = Number(transaksiTerbaru.saldo_setelah);
        }

        return res.status(200).json({
            success: true,
            message: "Laporan arus kas berhasil diambil",
            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },
                ringkasan: {
                    saldo_awal: saldoAwal,
                    total_kas_masuk: totalKasMasuk,
                    total_kas_keluar: totalKasKeluar,
                    saldo_akhir: saldoAkhir,
                },
                transaksi_kas: transaksi,
            }),
        });
    } catch (error) {
        console.error("GET LAPORAN ARUS KAS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil laporan arus kas",
            error: error.message,
        });
    }
};

const getLaporanPiutang = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.query;

        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message: "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(`${tanggal_awal}T00:00:00`);
        const akhir = new Date(`${tanggal_akhir}T23:59:59`);

        if (isNaN(awal.getTime()) || isNaN(akhir.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message: "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        const data = await prisma.piutang.findMany({
            where: {
                penjualan: {
                    tanggal: {
                        gte: awal,
                        lte: akhir,
                    },
                },
            },
            orderBy: {
                jatuh_tempo: "asc",
            },
            select: {
                id: true,
                penjualan_id: true,
                pelanggan_id: true,
                total_piutang: true,
                sisa_piutang: true,
                jatuh_tempo: true,
                status: true,
                penjualan: {
                    select: {
                        id: true,
                        nomor_invoice: true,
                        tanggal: true,
                        total: true,
                    },
                },
                pelanggan: {
                    select: {
                        id: true,
                        nama: true,
                        telepon: true,
                        email: true,
                    },
                },
                pembayaran_piutang: {
                    orderBy: {
                        tanggal: "desc",
                    },
                    select: {
                        id: true,
                        rekening_id: true,
                        tanggal: true,
                        nominal: true,
                        keterangan: true,
                        rekening: {
                            select: {
                                id: true,
                                nama_rekening: true,
                                bank: true,
                            },
                        },
                    },
                },
            },
        });

        const jumlahPiutang = data.length;

        const totalPiutang = data.reduce(
            (total, item) => total + Number(item.total_piutang),
            0
        );

        const totalSisaPiutang = data.reduce(
            (total, item) => total + Number(item.sisa_piutang),
            0
        );

        const totalTerbayar = totalPiutang - totalSisaPiutang;

        const belumLunas = data.filter(
            (item) => item.status === "BELUM_LUNAS"
        ).length;

        const lunas = data.filter(
            (item) => item.status === "LUNAS"
        ).length;

        return res.status(200).json({
            success: true,
            message: "Laporan piutang berhasil diambil",
            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },
                ringkasan: {
                    jumlah_piutang: jumlahPiutang,
                    total_piutang: totalPiutang,
                    total_terbayar: totalTerbayar,
                    total_sisa_piutang: totalSisaPiutang,
                    jumlah_belum_lunas: belumLunas,
                    jumlah_lunas: lunas,
                },
                piutang: data,
            }),
        });
    } catch (error) {
        console.error("GET LAPORAN PIUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil laporan piutang",
            error: error.message,
        });
    }
};

const getLaporanHutang = async (req, res) => {
    try {
        const { tanggal_awal, tanggal_akhir } = req.query;

        if (!tanggal_awal || !tanggal_akhir) {
            return res.status(400).json({
                success: false,
                message: "tanggal_awal dan tanggal_akhir wajib diisi",
            });
        }

        const awal = new Date(`${tanggal_awal}T00:00:00`);
        const akhir = new Date(`${tanggal_akhir}T23:59:59`);

        if (isNaN(awal.getTime()) || isNaN(akhir.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        if (awal > akhir) {
            return res.status(400).json({
                success: false,
                message: "tanggal_awal tidak boleh lebih besar dari tanggal_akhir",
            });
        }

        const data = await prisma.hutang.findMany({
            where: {
                pembelian: {
                    tanggal: {
                        gte: awal,
                        lte: akhir,
                    },
                },
            },
            orderBy: {
                jatuh_tempo: "asc",
            },
            select: {
                id: true,
                pembelian_id: true,
                supplier_id: true,
                total_hutang: true,
                sisa_hutang: true,
                jatuh_tempo: true,
                status: true,

                pembelian: {
                    select: {
                        id: true,
                        nomor_faktur: true,
                        tanggal: true,
                        total: true,
                    },
                },

                supplier: {
                    select: {
                        id: true,
                        nama: true,
                        telepon: true,
                        email: true,
                    },
                },

                pembayaran_hutang: {
                    orderBy: {
                        tanggal: "desc",
                    },
                    select: {
                        id: true,
                        rekening_id: true,
                        tanggal: true,
                        nominal: true,
                        keterangan: true,

                        rekening: {
                            select: {
                                id: true,
                                nama_rekening: true,
                                bank: true,
                            },
                        },
                    },
                },
            },
        });

        const jumlahHutang = data.length;

        const totalHutang = data.reduce(
            (total, item) => total + Number(item.total_hutang),
            0
        );

        const totalSisaHutang = data.reduce(
            (total, item) => total + Number(item.sisa_hutang),
            0
        );

        const totalTerbayar = totalHutang - totalSisaHutang;

        const belumLunas = data.filter(
            (item) => item.status === "BELUM_LUNAS"
        ).length;

        const lunas = data.filter(
            (item) => item.status === "LUNAS"
        ).length;

        return res.status(200).json({
            success: true,
            message: "Laporan hutang berhasil diambil",
            data: serializeBigInt({
                periode: {
                    tanggal_awal,
                    tanggal_akhir,
                },

                ringkasan: {
                    jumlah_hutang: jumlahHutang,
                    total_hutang: totalHutang,
                    total_terbayar: totalTerbayar,
                    total_sisa_hutang: totalSisaHutang,
                    jumlah_belum_lunas: belumLunas,
                    jumlah_lunas: lunas,
                },

                hutang: data,
            }),
        });
    } catch (error) {
        console.error("GET LAPORAN HUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil laporan hutang",
            error: error.message,
        });
    }
};

const getLaporanStok = async (req, res) => {
    try {
        const data = await prisma.produk.findMany({
            orderBy: {
                nama: "asc",
            },
            select: {
                id: true,
                usaha_id: true,
                kategori_id: true,
                kode_produk: true,
                barcode: true,
                nama: true,
                harga_modal: true,
                harga_jual: true,
                stok: true,
                satuan: true,
                status: true,

                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },

                kategori: {
                    select: {
                        id: true,
                        nama: true,
                    },
                },
            },
        });

        const laporanStok = data.map((item) => {
            const hargaModal = Number(item.harga_modal);
            const hargaJual = Number(item.harga_jual);
            const stok = Number(item.stok);

            return {
                ...item,
                nilai_persediaan: stok * hargaModal,
                potensi_penjualan: stok * hargaJual,
                potensi_laba: stok * (hargaJual - hargaModal),
            };
        });

        const totalProduk = laporanStok.length;

        const totalStok = laporanStok.reduce(
            (total, item) => total + item.stok,
            0
        );

        const totalNilaiPersediaan = laporanStok.reduce(
            (total, item) => total + item.nilai_persediaan,
            0
        );

        const totalPotensiPenjualan = laporanStok.reduce(
            (total, item) => total + item.potensi_penjualan,
            0
        );

        const totalPotensiLaba = laporanStok.reduce(
            (total, item) => total + item.potensi_laba,
            0
        );

        const stokHabis = laporanStok.filter(
            (item) => item.stok === 0
        ).length;

        const stokRendah = laporanStok.filter(
            (item) => item.stok > 0 && item.stok <= 5
        ).length;

        return res.status(200).json({
            success: true,
            message: "Laporan stok berhasil diambil",
            data: serializeBigInt({
                ringkasan: {
                    total_produk: totalProduk,
                    total_stok: totalStok,
                    total_nilai_persediaan: totalNilaiPersediaan,
                    total_potensi_penjualan: totalPotensiPenjualan,
                    total_potensi_laba: totalPotensiLaba,
                    stok_habis: stokHabis,
                    stok_rendah: stokRendah,
                },
                produk: laporanStok,
            }),
        });
    } catch (error) {
        console.error("GET LAPORAN STOK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil laporan stok",
            error: error.message,
        });
    }
};

module.exports = {
    getLabaRugi,
    getLaporanPenjualan,
    getLaporanPembelian,
    getLaporanPengeluaran,
    getLaporanArusKas,
    getLaporanPiutang,
    getLaporanHutang,
    getLaporanStok,
};