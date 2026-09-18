const prisma = require("../config/database");

// ========================================
// SERIALIZE BIGINT
// ========================================
const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// ========================================
// FORMAT DATA
// ========================================
const formatPengeluaran = (data) => {
    return serializeBigInt(data);
};

// ========================================
// INCLUDE DATA PENGELUARAN
// ========================================
const pengeluaranInclude = {
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
    rekening: {
        select: {
            id: true,
            nama_rekening: true,
            bank: true,
            saldo: true,
        },
    },
    createdBy: {
        select: {
            id: true,
            nama: true,
            username: true,
        },
    },
};

// ========================================
// GET ALL PENGELUARAN
// ========================================
const getAllPengeluaran = async (req, res) => {
    try {
        const data = await prisma.pengeluaran.findMany({
            orderBy: {
                id: "asc",
            },
            include: pengeluaranInclude,
        });

        res.json({
            success: true,
            message: "Data pengeluaran berhasil diambil",
            data: formatPengeluaran(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data pengeluaran",
            error: error.message,
        });
    }
};

// ========================================
// GET BY ID
// ========================================
const getPengeluaranById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await prisma.pengeluaran.findUnique({
            where: {
                id: BigInt(id),
            },
            include: pengeluaranInclude,
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Pengeluaran tidak ditemukan",
            });
        }

        res.json({
            success: true,
            message: "Data pengeluaran berhasil diambil",
            data: formatPengeluaran(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data pengeluaran",
            error: error.message,
        });
    }
};

// ========================================
// CREATE PENGELUARAN
// + KURANGI SALDO REKENING
// + BUAT TRANSAKSI KAS
// ========================================
const createPengeluaran = async (req, res) => {
    try {
        const {
            usaha_id,
            kategori_id,
            rekening_id,
            tanggal,
            nominal,
            keterangan,
        } = req.body;

        // ========================================
        // VALIDASI FIELD WAJIB
        // ========================================
        if (
            !usaha_id ||
            !kategori_id ||
            !rekening_id ||
            !tanggal ||
            nominal === undefined ||
            nominal === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "usaha_id, kategori_id, rekening_id, tanggal, dan nominal wajib diisi",
            });
        }

        // ========================================
        // VALIDASI NOMINAL
        // ========================================
        const nominalNumber = Number(nominal);

        if (!Number.isFinite(nominalNumber) || nominalNumber <= 0) {
            return res.status(400).json({
                success: false,
                message: "Nominal harus lebih besar dari 0",
            });
        }

        // ========================================
        // KONVERSI ID
        // ========================================
        const usahaId = BigInt(usaha_id);
        const kategoriId = BigInt(kategori_id);
        const rekeningId = BigInt(rekening_id);
        const createdBy = BigInt(req.user.userId);

        const tanggalDate = new Date(tanggal);

        if (isNaN(tanggalDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        // ========================================
        // CEK USAHA
        // ========================================
        const usaha = await prisma.usaha.findUnique({
            where: {
                id: usahaId,
            },
        });

        if (!usaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan",
            });
        }

        // ========================================
        // CEK KATEGORI
        // ========================================
        const kategori = await prisma.kategoriPengeluaran.findUnique({
            where: {
                id: kategoriId,
            },
        });

        if (!kategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori pengeluaran tidak ditemukan",
            });
        }

        if (kategori.usaha_id !== usahaId) {
            return res.status(400).json({
                success: false,
                message: "Kategori pengeluaran bukan milik usaha tersebut",
            });
        }

        // ========================================
        // CEK REKENING
        // ========================================
        const rekening = await prisma.rekening.findUnique({
            where: {
                id: rekeningId,
            },
        });

        if (!rekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan",
            });
        }

        if (rekening.usaha_id !== usahaId) {
            return res.status(400).json({
                success: false,
                message: "Rekening bukan milik usaha tersebut",
            });
        }

        // ========================================
        // CEK SALDO
        // ========================================
        const saldoSebelum = Number(rekening.saldo);

        if (saldoSebelum < nominalNumber) {
            return res.status(400).json({
                success: false,
                message: "Saldo rekening tidak mencukupi",
            });
        }

        const saldoSetelah = saldoSebelum - nominalNumber;

        // ========================================
        // TRANSACTION
        // ========================================
        const result = await prisma.$transaction(async (tx) => {
            // ----------------------------------------
            // 1. BUAT PENGELUARAN
            // ----------------------------------------
            const pengeluaran = await tx.pengeluaran.create({
                data: {
                    usaha_id: usahaId,
                    kategori_id: kategoriId,
                    rekening_id: rekeningId,
                    tanggal: tanggalDate,
                    nominal: nominalNumber,
                    keterangan: keterangan || null,
                    created_by: createdBy,
                },
            });

            // ----------------------------------------
            // 2. UPDATE SALDO REKENING
            // ----------------------------------------
            await tx.rekening.update({
                where: {
                    id: rekeningId,
                },
                data: {
                    saldo: saldoSetelah,
                },
            });

            // ----------------------------------------
            // 3. BUAT TRANSAKSI KAS
            // ----------------------------------------
            await tx.transaksiKas.create({
                data: {
                    usaha_id: usahaId,
                    rekening_id: rekeningId,
                    referensi_tipe: "PENGELUARAN",
                    referensi_id: pengeluaran.id,
                    nomor_referensi: null,
                    jenis: "KELUAR",
                    tanggal: tanggalDate,
                    nominal: nominalNumber,
                    saldo_sebelum: saldoSebelum,
                    saldo_setelah: saldoSetelah,
                    keterangan: keterangan || null,
                    created_by: createdBy,
                },
            });

            return pengeluaran;
        });

        // ========================================
        // AMBIL DATA LENGKAP
        // ========================================
        const data = await prisma.pengeluaran.findUnique({
            where: {
                id: result.id,
            },
            include: pengeluaranInclude,
        });

        res.status(201).json({
            success: true,
            message: "Pengeluaran berhasil dibuat",
            data: formatPengeluaran(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal membuat pengeluaran",
            error: error.message,
        });
    }
};

// ========================================
// UPDATE PENGELUARAN
// + SESUAIKAN SALDO REKENING
// + UPDATE TRANSAKSI KAS
// ========================================
const updatePengeluaran = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            kategori_id,
            rekening_id,
            tanggal,
            nominal,
            keterangan,
        } = req.body;

        const pengeluaranId = BigInt(id);

        // ========================================
        // CEK DATA LAMA
        // ========================================
        const existing = await prisma.pengeluaran.findUnique({
            where: {
                id: pengeluaranId,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Pengeluaran tidak ditemukan",
            });
        }

        // ========================================
        // VALIDASI FIELD
        // ========================================
        if (
            !kategori_id ||
            !rekening_id ||
            !tanggal ||
            nominal === undefined ||
            nominal === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "kategori_id, rekening_id, tanggal, dan nominal wajib diisi",
            });
        }

        const nominalBaru = Number(nominal);

        if (!Number.isFinite(nominalBaru) || nominalBaru <= 0) {
            return res.status(400).json({
                success: false,
                message: "Nominal harus lebih besar dari 0",
            });
        }

        const kategoriId = BigInt(kategori_id);
        const rekeningIdBaru = BigInt(rekening_id);
        const tanggalDate = new Date(tanggal);

        if (isNaN(tanggalDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid",
            });
        }

        // ========================================
        // CEK KATEGORI
        // ========================================
        const kategori = await prisma.kategoriPengeluaran.findUnique({
            where: {
                id: kategoriId,
            },
        });

        if (!kategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori pengeluaran tidak ditemukan",
            });
        }

        if (kategori.usaha_id !== existing.usaha_id) {
            return res.status(400).json({
                success: false,
                message: "Kategori pengeluaran bukan milik usaha tersebut",
            });
        }

        // ========================================
        // CEK REKENING BARU
        // ========================================
        const rekeningBaru = await prisma.rekening.findUnique({
            where: {
                id: rekeningIdBaru,
            },
        });

        if (!rekeningBaru) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan",
            });
        }

        if (rekeningBaru.usaha_id !== existing.usaha_id) {
            return res.status(400).json({
                success: false,
                message: "Rekening bukan milik usaha tersebut",
            });
        }

        const rekeningIdLama = existing.rekening_id;

        // ========================================
        // TRANSACTION
        // ========================================
        const result = await prisma.$transaction(async (tx) => {
            // ========================================
            // JIKA REKENING TIDAK BERUBAH
            // ========================================
            if (rekeningIdLama === rekeningIdBaru) {
                const rekeningSaatIni = await tx.rekening.findUnique({
                    where: {
                        id: rekeningIdLama,
                    },
                });

                if (!rekeningSaatIni) {
                    throw new Error("Rekening lama tidak ditemukan");
                }

                const saldoSaatIni = Number(rekeningSaatIni.saldo);
                const nominalLama = Number(existing.nominal);

                // Selisih:
                // nominal baru - nominal lama
                const selisih = nominalBaru - nominalLama;

                const saldoSetelah = saldoSaatIni - selisih;

                if (saldoSetelah < 0) {
                    throw new Error("Saldo rekening tidak mencukupi");
                }

                // ----------------------------------------
                // UPDATE PENGELUARAN
                // ----------------------------------------
                const pengeluaran = await tx.pengeluaran.update({
                    where: {
                        id: pengeluaranId,
                    },
                    data: {
                        kategori_id: kategoriId,
                        rekening_id: rekeningIdBaru,
                        tanggal: tanggalDate,
                        nominal: nominalBaru,
                        keterangan: keterangan || null,
                    },
                });

                // ----------------------------------------
                // UPDATE SALDO
                // ----------------------------------------
                await tx.rekening.update({
                    where: {
                        id: rekeningIdLama,
                    },
                    data: {
                        saldo: saldoSetelah,
                    },
                });

                // ----------------------------------------
                // CARI TRANSAKSI KAS
                // ----------------------------------------
                const transaksiKas = await tx.transaksiKas.findFirst({
                    where: {
                        referensi_tipe: "PENGELUARAN",
                        referensi_id: pengeluaranId,
                    },
                    orderBy: {
                        id: "desc",
                    },
                });

                if (transaksiKas) {
                    await tx.transaksiKas.update({
                        where: {
                            id: transaksiKas.id,
                        },
                        data: {
                            rekening_id: rekeningIdBaru,
                            tanggal: tanggalDate,
                            nominal: nominalBaru,
                            saldo_sebelum: saldoSaatIni,
                            saldo_setelah: saldoSetelah,
                            keterangan: keterangan || null,
                        },
                    });
                } else {
                    // Jika transaksi kas belum ada,
                    // buat transaksi kas baru.
                    await tx.transaksiKas.create({
                        data: {
                            usaha_id: existing.usaha_id,
                            rekening_id: rekeningIdBaru,
                            referensi_tipe: "PENGELUARAN",
                            referensi_id: pengeluaranId,
                            nomor_referensi: null,
                            jenis: "KELUAR",
                            tanggal: tanggalDate,
                            nominal: nominalBaru,
                            saldo_sebelum: saldoSaatIni,
                            saldo_setelah: saldoSetelah,
                            keterangan: keterangan || null,
                            created_by: existing.created_by,
                        },
                    });
                }

                return pengeluaran;
            }

            // ========================================
            // JIKA REKENING BERUBAH
            // ========================================

            const rekeningLama = await tx.rekening.findUnique({
                where: {
                    id: rekeningIdLama,
                },
            });

            const rekeningBaruSaatIni = await tx.rekening.findUnique({
                where: {
                    id: rekeningIdBaru,
                },
            });

            if (!rekeningLama || !rekeningBaruSaatIni) {
                throw new Error("Rekening tidak ditemukan");
            }

            const saldoLama = Number(rekeningLama.saldo);
            const saldoBaru = Number(rekeningBaruSaatIni.saldo);

            const nominalLama = Number(existing.nominal);

            // Saldo rekening lama dikembalikan
            const saldoLamaSetelah = saldoLama + nominalLama;

            // Saldo rekening baru dikurangi
            const saldoBaruSetelah = saldoBaru - nominalBaru;

            if (saldoBaruSetelah < 0) {
                throw new Error("Saldo rekening baru tidak mencukupi");
            }

            // ----------------------------------------
            // UPDATE PENGELUARAN
            // ----------------------------------------
            const pengeluaran = await tx.pengeluaran.update({
                where: {
                    id: pengeluaranId,
                },
                data: {
                    kategori_id: kategoriId,
                    rekening_id: rekeningIdBaru,
                    tanggal: tanggalDate,
                    nominal: nominalBaru,
                    keterangan: keterangan || null,
                },
            });

            // ----------------------------------------
            // KEMBALIKAN SALDO REKENING LAMA
            // ----------------------------------------
            await tx.rekening.update({
                where: {
                    id: rekeningIdLama,
                },
                data: {
                    saldo: saldoLamaSetelah,
                },
            });

            // ----------------------------------------
            // KURANGI SALDO REKENING BARU
            // ----------------------------------------
            await tx.rekening.update({
                where: {
                    id: rekeningIdBaru,
                },
                data: {
                    saldo: saldoBaruSetelah,
                },
            });

            // ----------------------------------------
            // UPDATE TRANSAKSI KAS
            // ----------------------------------------
            const transaksiKas = await tx.transaksiKas.findFirst({
                where: {
                    referensi_tipe: "PENGELUARAN",
                    referensi_id: pengeluaranId,
                },
                orderBy: {
                    id: "desc",
                },
            });

            if (transaksiKas) {
                await tx.transaksiKas.update({
                    where: {
                        id: transaksiKas.id,
                    },
                    data: {
                        rekening_id: rekeningIdBaru,
                        tanggal: tanggalDate,
                        nominal: nominalBaru,
                        saldo_sebelum: saldoBaru,
                        saldo_setelah: saldoBaruSetelah,
                        keterangan: keterangan || null,
                    },
                });
            } else {
                await tx.transaksiKas.create({
                    data: {
                        usaha_id: existing.usaha_id,
                        rekening_id: rekeningIdBaru,
                        referensi_tipe: "PENGELUARAN",
                        referensi_id: pengeluaranId,
                        nomor_referensi: null,
                        jenis: "KELUAR",
                        tanggal: tanggalDate,
                        nominal: nominalBaru,
                        saldo_sebelum: saldoBaru,
                        saldo_setelah: saldoBaruSetelah,
                        keterangan: keterangan || null,
                        created_by: existing.created_by,
                    },
                });
            }

            return pengeluaran;
        });

        // ========================================
        // AMBIL DATA LENGKAP
        // ========================================
        const data = await prisma.pengeluaran.findUnique({
            where: {
                id: result.id,
            },
            include: pengeluaranInclude,
        });

        res.json({
            success: true,
            message: "Pengeluaran berhasil diperbarui",
            data: formatPengeluaran(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal memperbarui pengeluaran",
            error: error.message,
        });
    }
};

// ========================================
// DELETE PENGELUARAN
// + KEMBALIKAN SALDO
// + HAPUS TRANSAKSI KAS
// ========================================
const deletePengeluaran = async (req, res) => {
    try {
        const { id } = req.params;
        const pengeluaranId = BigInt(id);

        // ========================================
        // CEK DATA
        // ========================================
        const existing = await prisma.pengeluaran.findUnique({
            where: {
                id: pengeluaranId,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Pengeluaran tidak ditemukan",
            });
        }

        // ========================================
        // TRANSACTION
        // ========================================
        await prisma.$transaction(async (tx) => {
            // ----------------------------------------
            // AMBIL REKENING
            // ----------------------------------------
            const rekening = await tx.rekening.findUnique({
                where: {
                    id: existing.rekening_id,
                },
            });

            if (!rekening) {
                throw new Error("Rekening tidak ditemukan");
            }

            const saldoSaatIni = Number(rekening.saldo);
            const nominal = Number(existing.nominal);

            const saldoSetelah = saldoSaatIni + nominal;

            // ----------------------------------------
            // KEMBALIKAN SALDO
            // ----------------------------------------
            await tx.rekening.update({
                where: {
                    id: existing.rekening_id,
                },
                data: {
                    saldo: saldoSetelah,
                },
            });

            // ----------------------------------------
            // HAPUS TRANSAKSI KAS
            // ----------------------------------------
            await tx.transaksiKas.deleteMany({
                where: {
                    referensi_tipe: "PENGELUARAN",
                    referensi_id: pengeluaranId,
                },
            });

            // ----------------------------------------
            // HAPUS PENGELUARAN
            // ----------------------------------------
            await tx.pengeluaran.delete({
                where: {
                    id: pengeluaranId,
                },
            });
        });

        res.json({
            success: true,
            message: "Pengeluaran berhasil dihapus",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal menghapus pengeluaran",
            error: error.message,
        });
    }
};

// ========================================
// EXPORT
// ========================================
module.exports = {
    getAllPengeluaran,
    getPengeluaranById,
    createPengeluaran,
    updatePengeluaran,
    deletePengeluaran,
};