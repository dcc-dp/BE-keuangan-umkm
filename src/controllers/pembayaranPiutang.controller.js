const prisma = require("../config/database");

const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// ==========================================
// GET ALL PEMBAYARAN PIUTANG
// ==========================================
const getAllPembayaranPiutang = async (req, res) => {
    try {
        const data = await prisma.pembayaranPiutang.findMany({
            orderBy: {
                tanggal: "desc",
            },
            include: {
                piutang: {
                    include: {
                        pelanggan: true,
                        penjualan: true,
                    },
                },
                rekening: true,
            },
        });

        res.json({
            success: true,
            message: "Data pembayaran piutang berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data pembayaran piutang",
            error: error.message,
        });
    }
};

// ==========================================
// GET PEMBAYARAN PIUTANG BY ID
// ==========================================
const getPembayaranPiutangById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.pembayaranPiutang.findUnique({
            where: {
                id,
            },
            include: {
                piutang: {
                    include: {
                        pelanggan: true,
                        penjualan: true,
                    },
                },
                rekening: true,
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Pembayaran piutang tidak ditemukan",
            });
        }

        res.json({
            success: true,
            message: "Data pembayaran piutang berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil pembayaran piutang",
            error: error.message,
        });
    }
};

// ==========================================
// CREATE PEMBAYARAN PIUTANG
// ==========================================
const createPembayaranPiutang = async (req, res) => {
    try {
        const {
            piutang_id,
            rekening_id,
            tanggal,
            nominal,
            keterangan,
        } = req.body;

        // ------------------------------
        // VALIDASI INPUT
        // ------------------------------
        if (
            piutang_id === undefined ||
            rekening_id === undefined ||
            nominal === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "piutang_id, rekening_id, dan nominal wajib diisi",
            });
        }

        const nominalNumber = Number(nominal);

        if (!Number.isFinite(nominalNumber) || nominalNumber <= 0) {
            return res.status(400).json({
                success: false,
                message: "Nominal pembayaran harus lebih besar dari 0",
            });
        }

        // ------------------------------
        // CARI PIUTANG
        // ------------------------------
        const piutang = await prisma.piutang.findUnique({
            where: {
                id: BigInt(piutang_id),
            },
        });

        if (!piutang) {
            return res.status(404).json({
                success: false,
                message: "Piutang tidak ditemukan",
            });
        }

       const sisaPiutang = Number(piutang.sisa_piutang);

        if (sisaPiutang <= 0 || piutang.status === "LUNAS") {
            return res.status(400).json({
                success: false,
                message: "Piutang sudah lunas",
            });
        }

        // Tidak boleh membayar lebih dari sisa piutang
        if (nominalNumber > sisaPiutang) {
            return res.status(400).json({
                success: false,
                message: `Nominal pembayaran tidak boleh lebih dari sisa piutang Rp${sisaPiutang}`,
            });
        }

        // ------------------------------
        // CARI REKENING
        // ------------------------------
        const rekening = await prisma.rekening.findUnique({
            where: {
                id: BigInt(rekening_id),
            },
        });

        if (!rekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan",
            });
        }

        // ------------------------------
        // HITUNG SALDO DAN SISA PIUTANG
        // ------------------------------
        const saldoSebelum = Number(rekening.saldo);
        const saldoSetelah = saldoSebelum + nominalNumber;

        const sisaSetelah = sisaPiutang - nominalNumber;

        const statusBaru =
            sisaSetelah === 0 ? "LUNAS" : "BELUM_LUNAS";

        // ------------------------------
        // TRANSACTION
        // ------------------------------
        const result = await prisma.$transaction(async (tx) => {

            // 1. Buat pembayaran piutang
           const pembayaran = await tx.pembayaranPiutang.create({
    data: {
        piutang: {
            connect: {
                id: BigInt(piutang_id),
            },
        },

        rekening: {
            connect: {
                id: BigInt(rekening_id),
            },
        },

        tanggal: tanggal
            ? new Date(tanggal)
            : new Date(),

        nominal: nominalNumber,

        keterangan: keterangan || null,
    },
});

            // 2. Update piutang
           await tx.piutang.update({
    where: {
        id: BigInt(piutang_id),
    },
    data: {
        sisa_piutang: sisaSetelah,
        status: statusBaru,
    },
});

            // 3. Update saldo rekening
            await tx.rekening.update({
                where: {
                    id: BigInt(rekening_id),
                },
                data: {
                    saldo: saldoSetelah,
                },
            });

            // 4. Ambil usaha dari pelanggan
const pelanggan = await tx.pelanggan.findUnique({
    where: {
        id: piutang.pelanggan_id,
    },
    select: {
        usaha_id: true,
    },
});

if (!pelanggan) {
    throw new Error("Pelanggan dari piutang tidak ditemukan");
}

// 5. Buat transaksi kas
await tx.transaksiKas.create({
    data: {
        usaha_id: pelanggan.usaha_id,
        rekening_id: BigInt(rekening_id),

        referensi_tipe: "PEMBAYARAN_PIUTANG",
        referensi_id: pembayaran.id,

        jenis: "MASUK",

        tanggal: tanggal
            ? new Date(tanggal)
            : new Date(),

        nominal: nominalNumber,

        saldo_sebelum: saldoSebelum,
        saldo_setelah: saldoSetelah,

        keterangan:
            keterangan ||
            `Pembayaran piutang ID ${piutang_id}`,

        created_by: BigInt(req.user.userId),
    },
});

            return pembayaran;
        });

        // ------------------------------
        // RESPONSE
        // ------------------------------
        res.status(201).json({
            success: true,
            message: "Pembayaran piutang berhasil dibuat",
            data: serializeBigInt(result),
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal membuat pembayaran piutang",
            error: error.message,
        });
    }
};

module.exports = {
    getAllPembayaranPiutang,
    getPembayaranPiutangById,
    createPembayaranPiutang,
};