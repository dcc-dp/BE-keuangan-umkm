const prisma = require("../config/database");

// Mengubah BigInt menjadi String agar bisa dikirim sebagai JSON
const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// ===============================
// GET ALL
// ===============================
const getAllKategoriPengeluaran = async (req, res) => {
    try {
        const data = await prisma.kategoriPengeluaran.findMany({
            orderBy: {
                id: "asc",
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
            },
        });

      res.json({
    success: true,
    message: "Data kategori pengeluaran berhasil diambil",
    data: serializeBigInt(data),
});
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data kategori pengeluaran",
            error: error.message,
        });
    }
};

// ===============================
// GET BY ID
// ===============================
const getKategoriPengeluaranById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await prisma.kategoriPengeluaran.findUnique({
            where: {
                id: BigInt(id),
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Kategori pengeluaran tidak ditemukan",
            });
        }

        res.json({
    success: true,
    message: "Data kategori pengeluaran berhasil diambil",
    data: serializeBigInt(data),
});
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data kategori pengeluaran",
            error: error.message,
        });
    }
};

// ===============================
// CREATE
// ===============================
const createKategoriPengeluaran = async (req, res) => {
    try {
        const {
            usaha_id,
            nama,
        } = req.body;

        if (!usaha_id || !nama) {
            return res.status(400).json({
                success: false,
                message: "usaha_id dan nama wajib diisi",
            });
        }

        // Cek usaha
        const usaha = await prisma.usaha.findUnique({
            where: {
                id: BigInt(usaha_id),
            },
        });

        if (!usaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan",
            });
        }

        // Cek kategori dengan nama yang sama
        const existing = await prisma.kategoriPengeluaran.findFirst({
            where: {
                usaha_id: BigInt(usaha_id),
                nama,
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Kategori pengeluaran dengan nama tersebut sudah ada",
            });
        }

        const data = await prisma.kategoriPengeluaran.create({
            data: {
                usaha_id: BigInt(usaha_id),
                nama,
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
            },
        });

       res.status(201).json({
    success: true,
    message: "Kategori pengeluaran berhasil dibuat",
    data: serializeBigInt(data),
});
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal membuat kategori pengeluaran",
            error: error.message,
        });
    }
};

// ===============================
// UPDATE
// ===============================
const updateKategoriPengeluaran = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nama,
        } = req.body;

        if (!nama) {
            return res.status(400).json({
                success: false,
                message: "nama wajib diisi",
            });
        }

        const existing = await prisma.kategoriPengeluaran.findUnique({
            where: {
                id: BigInt(id),
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Kategori pengeluaran tidak ditemukan",
            });
        }

        // Cek nama duplikat dalam usaha yang sama
        const duplicate = await prisma.kategoriPengeluaran.findFirst({
            where: {
                usaha_id: existing.usaha_id,
                nama,
                NOT: {
                    id: BigInt(id),
                },
            },
        });

        if (duplicate) {
            return res.status(400).json({
                success: false,
                message: "Kategori pengeluaran dengan nama tersebut sudah ada",
            });
        }

        const data = await prisma.kategoriPengeluaran.update({
            where: {
                id: BigInt(id),
            },
            data: {
                nama,
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
            },
        });

      res.json({
    success: true,
    message: "Kategori pengeluaran berhasil diperbarui",
    data: serializeBigInt(data),
});
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal memperbarui kategori pengeluaran",
            error: error.message,
        });
    }
};

// ===============================
// DELETE
// ===============================
const deleteKategoriPengeluaran = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.kategoriPengeluaran.findUnique({
            where: {
                id: BigInt(id),
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Kategori pengeluaran tidak ditemukan",
            });
        }

        // Cek apakah masih digunakan oleh pengeluaran
        const used = await prisma.pengeluaran.findFirst({
            where: {
                kategori_id: BigInt(id),
            },
        });

        if (used) {
            return res.status(400).json({
                success: false,
                message:
                    "Kategori pengeluaran tidak dapat dihapus karena masih digunakan oleh data pengeluaran",
            });
        }

        await prisma.kategoriPengeluaran.delete({
            where: {
                id: BigInt(id),
            },
        });

        res.json({
            success: true,
            message: "Kategori pengeluaran berhasil dihapus",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal menghapus kategori pengeluaran",
            error: error.message,
        });
    }
};

module.exports = {
    getAllKategoriPengeluaran,
    getKategoriPengeluaranById,
    createKategoriPengeluaran,
    updateKategoriPengeluaran,
    deleteKategoriPengeluaran,
};