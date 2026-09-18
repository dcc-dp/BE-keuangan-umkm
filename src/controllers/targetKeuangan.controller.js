const prisma = require("../config/database");

// =====================================================
// HELPER
// =====================================================

const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// =====================================================
// GET SEMUA TARGET KEUANGAN
// =====================================================

const getAllTargetKeuangan = async (req, res) => {
    try {
        const data = await prisma.targetKeuangan.findMany({
            orderBy: [
                { tahun: "desc" },
                { bulan: "desc" },
            ],
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        nama: true,
                        username: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Data target keuangan berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("GET ALL TARGET KEUANGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data target keuangan",
            error: error.message,
        });
    }
};

// =====================================================
// GET TARGET KEUANGAN BY ID
// =====================================================

const getTargetKeuanganById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.targetKeuangan.findUnique({
            where: {
                id,
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        nama: true,
                        username: true,
                    },
                },
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Target keuangan tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data target keuangan berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("GET TARGET KEUANGAN BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data target keuangan",
            error: error.message,
        });
    }
};

// =====================================================
// CREATE TARGET KEUANGAN
// =====================================================

const createTargetKeuangan = async (req, res) => {
    try {
        const {
            usaha_id,
            bulan,
            tahun,
            target_pendapatan,
            target_pengeluaran,
            target_laba,
        } = req.body;

        // Validasi field wajib
        if (
            usaha_id === undefined ||
            bulan === undefined ||
            tahun === undefined ||
            target_pendapatan === undefined ||
            target_pengeluaran === undefined ||
            target_laba === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Semua field target keuangan wajib diisi",
            });
        }

        const usahaId = BigInt(usaha_id);
        const createdBy = BigInt(req.user.userId);

        const bulanNumber = Number(bulan);
        const tahunNumber = Number(tahun);
        const targetPendapatan = Number(target_pendapatan);
        const targetPengeluaran = Number(target_pengeluaran);
        const targetLaba = Number(target_laba);

        // Validasi bulan
        if (
            !Number.isInteger(bulanNumber) ||
            bulanNumber < 1 ||
            bulanNumber > 12
        ) {
            return res.status(400).json({
                success: false,
                message: "Bulan harus berupa angka 1 sampai 12",
            });
        }

        // Validasi tahun
        if (
            !Number.isInteger(tahunNumber) ||
            tahunNumber < 2000 ||
            tahunNumber > 2100
        ) {
            return res.status(400).json({
                success: false,
                message: "Tahun tidak valid",
            });
        }

        // Validasi nominal
        if (
            !Number.isFinite(targetPendapatan) ||
            !Number.isFinite(targetPengeluaran) ||
            !Number.isFinite(targetLaba) ||
            targetPendapatan < 0 ||
            targetPengeluaran < 0 ||
            targetLaba < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Nilai target tidak boleh negatif dan harus berupa angka",
            });
        }

        // Cek usaha
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

        // Cek target bulan + tahun sudah ada
        const existingTarget = await prisma.targetKeuangan.findUnique({
            where: {
                usaha_id_bulan_tahun: {
                    usaha_id: usahaId,
                    bulan: bulanNumber,
                    tahun: tahunNumber,
                },
            },
        });

        if (existingTarget) {
            return res.status(409).json({
                success: false,
                message:
                    "Target keuangan untuk usaha, bulan, dan tahun tersebut sudah ada",
            });
        }

        const data = await prisma.targetKeuangan.create({
            data: {
                usaha_id: usahaId,
                bulan: bulanNumber,
                tahun: tahunNumber,
                target_pendapatan: targetPendapatan,
                target_pengeluaran: targetPengeluaran,
                target_laba: targetLaba,
                created_by: createdBy,
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        nama: true,
                        username: true,
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "Target keuangan berhasil dibuat",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("CREATE TARGET KEUANGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal membuat target keuangan",
            error: error.message,
        });
    }
};

// =====================================================
// UPDATE TARGET KEUANGAN
// =====================================================

const updateTargetKeuangan = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            bulan,
            tahun,
            target_pendapatan,
            target_pengeluaran,
            target_laba,
        } = req.body;

        // Cek data
        const existingTarget = await prisma.targetKeuangan.findUnique({
            where: {
                id,
            },
        });

        if (!existingTarget) {
            return res.status(404).json({
                success: false,
                message: "Target keuangan tidak ditemukan",
            });
        }

        const bulanNumber = Number(bulan);
        const tahunNumber = Number(tahun);
        const targetPendapatan = Number(target_pendapatan);
        const targetPengeluaran = Number(target_pengeluaran);
        const targetLaba = Number(target_laba);

        // Validasi bulan
        if (
            !Number.isInteger(bulanNumber) ||
            bulanNumber < 1 ||
            bulanNumber > 12
        ) {
            return res.status(400).json({
                success: false,
                message: "Bulan harus berupa angka 1 sampai 12",
            });
        }

        // Validasi tahun
        if (
            !Number.isInteger(tahunNumber) ||
            tahunNumber < 2000 ||
            tahunNumber > 2100
        ) {
            return res.status(400).json({
                success: false,
                message: "Tahun tidak valid",
            });
        }

        // Validasi nominal
        if (
            !Number.isFinite(targetPendapatan) ||
            !Number.isFinite(targetPengeluaran) ||
            !Number.isFinite(targetLaba) ||
            targetPendapatan < 0 ||
            targetPengeluaran < 0 ||
            targetLaba < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Nilai target tidak boleh negatif dan harus berupa angka",
            });
        }

        // Cek duplikat jika bulan/tahun berubah
        const duplicateTarget = await prisma.targetKeuangan.findFirst({
            where: {
                usaha_id: existingTarget.usaha_id,
                bulan: bulanNumber,
                tahun: tahunNumber,
                NOT: {
                    id,
                },
            },
        });

        if (duplicateTarget) {
            return res.status(409).json({
                success: false,
                message:
                    "Target keuangan untuk bulan dan tahun tersebut sudah ada",
            });
        }

        const data = await prisma.targetKeuangan.update({
            where: {
                id,
            },
            data: {
                bulan: bulanNumber,
                tahun: tahunNumber,
                target_pendapatan: targetPendapatan,
                target_pengeluaran: targetPengeluaran,
                target_laba: targetLaba,
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        nama: true,
                        username: true,
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Target keuangan berhasil diperbarui",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("UPDATE TARGET KEUANGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui target keuangan",
            error: error.message,
        });
    }
};

// =====================================================
// DELETE TARGET KEUANGAN
// =====================================================

const deleteTargetKeuangan = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const existingTarget = await prisma.targetKeuangan.findUnique({
            where: {
                id,
            },
        });

        if (!existingTarget) {
            return res.status(404).json({
                success: false,
                message: "Target keuangan tidak ditemukan",
            });
        }

        await prisma.targetKeuangan.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Target keuangan berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE TARGET KEUANGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus target keuangan",
            error: error.message,
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getAllTargetKeuangan,
    getTargetKeuanganById,
    createTargetKeuangan,
    updateTargetKeuangan,
    deleteTargetKeuangan,
};