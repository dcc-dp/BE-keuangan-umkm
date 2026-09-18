const prisma = require("../config/database");

// ==========================================
// SERIALIZE BIGINT
// ==========================================
const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// ==========================================
// FORMAT PIUTANG
// ==========================================
const formatPiutang = (data) => {
    if (!data) {
        return data;
    }

    return {
        ...data,
        total_piutang: Number(data.total_piutang),
        sisa_piutang: Number(data.sisa_piutang),
    };
};

// ==========================================
// GET ALL PIUTANG
// ==========================================
const getAllPiutang = async (req, res) => {
    try {
        const data = await prisma.piutang.findMany({
            orderBy: {
                id: "desc",
            },
            include: {
                penjualan: true,
                pelanggan: true,
                pembayaran_piutang: true,
            },
        });

        const formattedData = data.map(formatPiutang);

        res.json({
            success: true,
            message: "Data piutang berhasil diambil",
            data: serializeBigInt(formattedData),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data piutang",
            error: error.message,
        });
    }
};

// ==========================================
// GET PIUTANG BY ID
// ==========================================
const getPiutangById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.piutang.findUnique({
            where: {
                id,
            },
            include: {
                penjualan: true,
                pelanggan: true,
                pembayaran_piutang: true,
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Piutang tidak ditemukan",
            });
        }

        const formattedData = formatPiutang(data);

        res.json({
            success: true,
            message: "Data piutang berhasil diambil",
            data: serializeBigInt(formattedData),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data piutang",
            error: error.message,
        });
    }
};

// ==========================================
// CREATE PIUTANG
// ==========================================
const createPiutang = async (req, res) => {
    try {
        const {
            penjualan_id,
            pelanggan_id,
            total_piutang,
            sisa_piutang,
            jatuh_tempo,
            status,
        } = req.body;

        // ------------------------------------------
        // VALIDASI INPUT WAJIB
        // ------------------------------------------
        if (
            penjualan_id === undefined ||
            pelanggan_id === undefined ||
            total_piutang === undefined ||
            sisa_piutang === undefined ||
            jatuh_tempo === undefined ||
            status === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "penjualan_id, pelanggan_id, total_piutang, sisa_piutang, jatuh_tempo, dan status wajib diisi",
            });
        }

        // ------------------------------------------
        // VALIDASI NOMINAL
        // ------------------------------------------
        const totalPiutangNumber = Number(total_piutang);
        const sisaPiutangNumber = Number(sisa_piutang);

        if (
            !Number.isFinite(totalPiutangNumber) ||
            totalPiutangNumber <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "total_piutang harus lebih besar dari 0",
            });
        }

        if (
            !Number.isFinite(sisaPiutangNumber) ||
            sisaPiutangNumber < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "sisa_piutang tidak boleh kurang dari 0",
            });
        }

        if (sisaPiutangNumber > totalPiutangNumber) {
            return res.status(400).json({
                success: false,
                message:
                    "sisa_piutang tidak boleh lebih besar dari total_piutang",
            });
        }

        // ------------------------------------------
        // VALIDASI STATUS
        // ------------------------------------------
        const statusValid = ["BELUM_LUNAS", "LUNAS"];

        if (!statusValid.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status harus BELUM_LUNAS atau LUNAS",
            });
        }

        // ------------------------------------------
        // CEK PENJUALAN
        // ------------------------------------------
        const penjualan = await prisma.penjualan.findUnique({
            where: {
                id: BigInt(penjualan_id),
            },
        });

        if (!penjualan) {
            return res.status(404).json({
                success: false,
                message: "Penjualan tidak ditemukan",
            });
        }

        // ------------------------------------------
        // CEK PELANGGAN
        // ------------------------------------------
        const pelanggan = await prisma.pelanggan.findUnique({
            where: {
                id: BigInt(pelanggan_id),
            },
        });

        if (!pelanggan) {
            return res.status(404).json({
                success: false,
                message: "Pelanggan tidak ditemukan",
            });
        }

        // ------------------------------------------
        // VALIDASI USAHA
        // ------------------------------------------
        if (penjualan.usaha_id !== pelanggan.usaha_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Penjualan dan pelanggan harus berasal dari usaha yang sama",
            });
        }

        // ------------------------------------------
        // CEK PIUTANG SUDAH ADA
        // ------------------------------------------
        const existingPiutang = await prisma.piutang.findUnique({
            where: {
                penjualan_id: BigInt(penjualan_id),
            },
        });

        if (existingPiutang) {
            return res.status(400).json({
                success: false,
                message:
                    "Piutang untuk penjualan tersebut sudah ada",
            });
        }

        // ------------------------------------------
        // VALIDASI STATUS DENGAN SISA
        // ------------------------------------------
        if (
            status === "LUNAS" &&
            sisaPiutangNumber !== 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Piutang dengan status LUNAS harus memiliki sisa_piutang 0",
            });
        }

        if (
            status === "BELUM_LUNAS" &&
            sisaPiutangNumber === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Piutang dengan sisa 0 harus berstatus LUNAS",
            });
        }

        // ------------------------------------------
        // CREATE PIUTANG
        // ------------------------------------------
        const data = await prisma.piutang.create({
            data: {
                penjualan: {
                    connect: {
                        id: BigInt(penjualan_id),
                    },
                },

                pelanggan: {
                    connect: {
                        id: BigInt(pelanggan_id),
                    },
                },

                total_piutang: totalPiutangNumber,
                sisa_piutang: sisaPiutangNumber,
                jatuh_tempo: new Date(jatuh_tempo),
                status,
            },

            include: {
                penjualan: true,
                pelanggan: true,
            },
        });

        const formattedData = formatPiutang(data);

        res.status(201).json({
            success: true,
            message: "Piutang berhasil dibuat",
            data: serializeBigInt(formattedData),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal membuat piutang",
            error: error.message,
        });
    }
};

// ==========================================
// UPDATE PIUTANG
// ==========================================
const updatePiutang = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            pelanggan_id,
            total_piutang,
            sisa_piutang,
            jatuh_tempo,
            status,
        } = req.body;

        // ------------------------------------------
        // CEK PIUTANG
        // ------------------------------------------
        const existingPiutang = await prisma.piutang.findUnique({
            where: {
                id,
            },
        });

        if (!existingPiutang) {
            return res.status(404).json({
                success: false,
                message: "Piutang tidak ditemukan",
            });
        }

        // ------------------------------------------
        // VALIDASI NOMINAL
        // ------------------------------------------
        const totalPiutangNumber =
            total_piutang !== undefined
                ? Number(total_piutang)
                : Number(existingPiutang.total_piutang);

        const sisaPiutangNumber =
            sisa_piutang !== undefined
                ? Number(sisa_piutang)
                : Number(existingPiutang.sisa_piutang);

        if (
            !Number.isFinite(totalPiutangNumber) ||
            totalPiutangNumber <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "total_piutang harus lebih besar dari 0",
            });
        }

        if (
            !Number.isFinite(sisaPiutangNumber) ||
            sisaPiutangNumber < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "sisa_piutang tidak boleh kurang dari 0",
            });
        }

        if (sisaPiutangNumber > totalPiutangNumber) {
            return res.status(400).json({
                success: false,
                message:
                    "sisa_piutang tidak boleh lebih besar dari total_piutang",
            });
        }

        // ------------------------------------------
        // VALIDASI PELANGGAN
        // ------------------------------------------
        let pelangganId = existingPiutang.pelanggan_id;

        if (pelanggan_id !== undefined) {
            const pelanggan = await prisma.pelanggan.findUnique({
                where: {
                    id: BigInt(pelanggan_id),
                },
            });

            if (!pelanggan) {
                return res.status(404).json({
                    success: false,
                    message: "Pelanggan tidak ditemukan",
                });
            }

            pelangganId = BigInt(pelanggan_id);
        }

        // ------------------------------------------
        // VALIDASI STATUS
        // ------------------------------------------
        const statusBaru =
            status !== undefined
                ? status
                : existingPiutang.status;

        if (!["BELUM_LUNAS", "LUNAS"].includes(statusBaru)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status harus BELUM_LUNAS atau LUNAS",
            });
        }

        if (
            statusBaru === "LUNAS" &&
            sisaPiutangNumber !== 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Piutang LUNAS harus memiliki sisa_piutang 0",
            });
        }

        if (
            statusBaru === "BELUM_LUNAS" &&
            sisaPiutangNumber === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Piutang dengan sisa 0 harus berstatus LUNAS",
            });
        }

        // ------------------------------------------
        // UPDATE DATA
        // ------------------------------------------
        const data = await prisma.piutang.update({
            where: {
                id,
            },
            data: {
                pelanggan: {
                    connect: {
                        id: pelangganId,
                    },
                },

                total_piutang: totalPiutangNumber,
                sisa_piutang: sisaPiutangNumber,

                ...(jatuh_tempo !== undefined && {
                    jatuh_tempo: new Date(jatuh_tempo),
                }),

                status: statusBaru,
            },

            include: {
                penjualan: true,
                pelanggan: true,
                pembayaran_piutang: true,
            },
        });

        const formattedData = formatPiutang(data);

        res.json({
            success: true,
            message: "Piutang berhasil diperbarui",
            data: serializeBigInt(formattedData),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal memperbarui piutang",
            error: error.message,
        });
    }
};

// ==========================================
// DELETE PIUTANG
// ==========================================
const deletePiutang = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        // ------------------------------------------
        // CEK PIUTANG
        // ------------------------------------------
        const existingPiutang = await prisma.piutang.findUnique({
            where: {
                id,
            },
            include: {
                pembayaran_piutang: true,
            },
        });

        if (!existingPiutang) {
            return res.status(404).json({
                success: false,
                message: "Piutang tidak ditemukan",
            });
        }

        // ------------------------------------------
        // JANGAN HAPUS JIKA SUDAH ADA PEMBAYARAN
        // ------------------------------------------
        if (
            existingPiutang.pembayaran_piutang &&
            existingPiutang.pembayaran_piutang.length > 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Piutang tidak dapat dihapus karena sudah memiliki pembayaran",
            });
        }

        // ------------------------------------------
        // DELETE
        // ------------------------------------------
        await prisma.piutang.delete({
            where: {
                id,
            },
        });

        res.json({
            success: true,
            message: "Piutang berhasil dihapus",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal menghapus piutang",
            error: error.message,
        });
    }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
    getAllPiutang,
    getPiutangById,
    createPiutang,
    updatePiutang,
    deletePiutang,
};