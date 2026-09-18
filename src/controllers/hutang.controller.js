const prisma = require("../config/database");

// ======================================================
// Helper BigInt & Decimal
// ======================================================

function serializeBigInt(obj) {
    return JSON.parse(
        JSON.stringify(obj, (_, value) =>
            typeof value === "bigint" ? Number(value) : value
        )
    );
}

function formatHutang(data) {
    if (!data) return null;

    return serializeBigInt({
        ...data,
        total_hutang: Number(data.total_hutang),
        sisa_hutang: Number(data.sisa_hutang),
    });
}

// ======================================================
// GET SEMUA HUTANG
// ======================================================

const getAllHutang = async (req, res) => {
    try {
        const data = await prisma.hutang.findMany({
            include: {
                pembelian: true,
                supplier: true,
                pembayaran_hutang: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        return res.json({
            success: true,
            message: "Data hutang berhasil diambil",
            data: data.map(formatHutang),
        });
    } catch (error) {
        console.error("GET HUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data hutang",
            error: error.message,
        });
    }
};

// ======================================================
// GET HUTANG BY ID
// ======================================================

const getHutangById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.hutang.findUnique({
            where: {
                id: id,
            },
            include: {
                pembelian: true,
                supplier: true,
                pembayaran_hutang: true,
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Data hutang tidak ditemukan",
            });
        }

        return res.json({
            success: true,
            message: "Data hutang berhasil diambil",
            data: formatHutang(data),
        });
    } catch (error) {
        console.error("GET HUTANG BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data hutang",
            error: error.message,
        });
    }
};

// ======================================================
// CREATE HUTANG
// ======================================================

const createHutang = async (req, res) => {
    try {
        const {
            pembelian_id,
            supplier_id,
            total_hutang,
            sisa_hutang,
            jatuh_tempo,
            status,
        } = req.body;

        // Validasi field wajib
        if (
            pembelian_id === undefined ||
            supplier_id === undefined ||
            total_hutang === undefined ||
            jatuh_tempo === undefined ||
            status === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Field wajib belum lengkap",
            });
        }

        const total = Number(total_hutang);
        const sisa =
            sisa_hutang !== undefined
                ? Number(sisa_hutang)
                : total;

        if (isNaN(total) || total <= 0) {
            return res.status(400).json({
                success: false,
                message: "total_hutang harus lebih dari 0",
            });
        }

        if (isNaN(sisa) || sisa < 0 || sisa > total) {
            return res.status(400).json({
                success: false,
                message: "sisa_hutang tidak valid",
            });
        }

        if (!["BELUM_LUNAS", "LUNAS"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status hutang tidak valid",
            });
        }

        if (status === "LUNAS" && sisa !== 0) {
            return res.status(400).json({
                success: false,
                message: "Hutang LUNAS harus memiliki sisa_hutang 0",
            });
        }

        if (status === "BELUM_LUNAS" && sisa === 0) {
            return res.status(400).json({
                success: false,
                message: "Hutang BELUM_LUNAS harus memiliki sisa_hutang lebih dari 0",
            });
        }

        // Cek pembelian
        const pembelian = await prisma.pembelian.findUnique({
            where: {
                id: BigInt(pembelian_id),
            },
        });

        if (!pembelian) {
            return res.status(404).json({
                success: false,
                message: "Data pembelian tidak ditemukan",
            });
        }

        // Cek supplier
        const supplier = await prisma.supplier.findUnique({
            where: {
                id: BigInt(supplier_id),
            },
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Data supplier tidak ditemukan",
            });
        }

        // Supplier harus berada pada usaha yang sama
        if (BigInt(supplier.usaha_id) !== BigInt(pembelian.usaha_id)) {
            return res.status(400).json({
                success: false,
                message: "Supplier dan pembelian harus berasal dari usaha yang sama",
            });
        }

        // Satu pembelian hanya boleh memiliki satu hutang
        const existing = await prisma.hutang.findUnique({
            where: {
                pembelian_id: BigInt(pembelian_id),
            },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Pembelian tersebut sudah memiliki hutang",
            });
        }

        const data = await prisma.hutang.create({
            data: {
                pembelian_id: BigInt(pembelian_id),
                supplier_id: BigInt(supplier_id),
                total_hutang: total,
                sisa_hutang: sisa,
                jatuh_tempo: new Date(jatuh_tempo),
                status,
            },
            include: {
                pembelian: true,
                supplier: true,
                pembayaran_hutang: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Hutang berhasil dibuat",
            data: formatHutang(data),
        });
    } catch (error) {
        console.error("CREATE HUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal membuat hutang",
            error: error.message,
        });
    }
};

// ======================================================
// UPDATE HUTANG
// ======================================================

const updateHutang = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const existing = await prisma.hutang.findUnique({
            where: {
                id: id,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Data hutang tidak ditemukan",
            });
        }

        const {
            total_hutang,
            sisa_hutang,
            jatuh_tempo,
            status,
        } = req.body;

        const total =
            total_hutang !== undefined
                ? Number(total_hutang)
                : Number(existing.total_hutang);

        const sisa =
            sisa_hutang !== undefined
                ? Number(sisa_hutang)
                : Number(existing.sisa_hutang);

        const newStatus =
            status !== undefined
                ? status
                : existing.status;

        if (isNaN(total) || total <= 0) {
            return res.status(400).json({
                success: false,
                message: "total_hutang harus lebih dari 0",
            });
        }

        if (isNaN(sisa) || sisa < 0 || sisa > total) {
            return res.status(400).json({
                success: false,
                message: "sisa_hutang tidak valid",
            });
        }

        if (!["BELUM_LUNAS", "LUNAS"].includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: "Status hutang tidak valid",
            });
        }

        if (newStatus === "LUNAS" && sisa !== 0) {
            return res.status(400).json({
                success: false,
                message: "Hutang LUNAS harus memiliki sisa_hutang 0",
            });
        }

        if (newStatus === "BELUM_LUNAS" && sisa === 0) {
            return res.status(400).json({
                success: false,
                message: "Hutang BELUM_LUNAS harus memiliki sisa_hutang lebih dari 0",
            });
        }

        const data = await prisma.hutang.update({
            where: {
                id: id,
            },
            data: {
                total_hutang: total,
                sisa_hutang: sisa,
                jatuh_tempo:
                    jatuh_tempo !== undefined
                        ? new Date(jatuh_tempo)
                        : undefined,
                status: newStatus,
            },
            include: {
                pembelian: true,
                supplier: true,
                pembayaran_hutang: true,
            },
        });

        return res.json({
            success: true,
            message: "Hutang berhasil diperbarui",
            data: formatHutang(data),
        });
    } catch (error) {
        console.error("UPDATE HUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui hutang",
            error: error.message,
        });
    }
};

// ======================================================
// DELETE HUTANG
// ======================================================

const deleteHutang = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const existing = await prisma.hutang.findUnique({
            where: {
                id: id,
            },
            include: {
                pembayaran_hutang: true,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Data hutang tidak ditemukan",
            });
        }

        // Jangan hapus hutang yang sudah memiliki pembayaran
        if (existing.pembayaran_hutang.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Hutang tidak dapat dihapus karena sudah memiliki pembayaran",
            });
        }

        await prisma.hutang.delete({
            where: {
                id: id,
            },
        });

        return res.json({
            success: true,
            message: "Hutang berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE HUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus hutang",
            error: error.message,
        });
    }
};

module.exports = {
    getAllHutang,
    getHutangById,
    createHutang,
    updateHutang,
    deleteHutang,
};