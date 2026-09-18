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
// GET ALL NOTIFIKASI
// =========================
const getAllNotifikasi = async (req, res) => {
    try {
        const data = await prisma.notifikasi.findMany({
            orderBy: {
                created_at: "desc",
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                user: {
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
            message: "Data notifikasi berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("GET ALL NOTIFIKASI ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data notifikasi",
            error: error.message,
        });
    }
};

// =========================
// GET NOTIFIKASI BY ID
// =========================
const getNotifikasiById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.notifikasi.findUnique({
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
                user: {
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
                message: "Notifikasi tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data notifikasi berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("GET NOTIFIKASI BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data notifikasi",
            error: error.message,
        });
    }
};

// =========================
// CREATE NOTIFIKASI
// =========================
const createNotifikasi = async (req, res) => {
    try {
        const {
            usaha_id,
            user_id,
            judul,
            pesan,
            tipe,
            status_baca,
        } = req.body;

        if (
            usaha_id === undefined ||
            user_id === undefined ||
            judul === undefined ||
            pesan === undefined ||
            tipe === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "usaha_id, user_id, judul, pesan, dan tipe wajib diisi",
            });
        }

        const usahaId = BigInt(usaha_id);
        const userId = BigInt(user_id);

        const tipeValid = [
            "INFO",
            "SUCCESS",
            "WARNING",
            "ERROR",
        ];

        if (!tipeValid.includes(tipe)) {
            return res.status(400).json({
                success: false,
                message:
                    "Tipe notifikasi harus INFO, SUCCESS, WARNING, atau ERROR",
            });
        }

        if (typeof judul !== "string" || judul.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Judul notifikasi wajib diisi",
            });
        }

        if (typeof pesan !== "string" || pesan.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Pesan notifikasi wajib diisi",
            });
        }

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

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan",
            });
        }

        const data = await prisma.notifikasi.create({
            data: {
                usaha_id: usahaId,
                user_id: userId,
                judul: judul.trim(),
                pesan: pesan.trim(),
                tipe,
                status_baca:
                    status_baca === undefined
                        ? false
                        : Boolean(status_baca),
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                user: {
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
            message: "Notifikasi berhasil dibuat",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("CREATE NOTIFIKASI ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal membuat notifikasi",
            error: error.message,
        });
    }
};

// =========================
// UPDATE NOTIFIKASI
// =========================
const updateNotifikasi = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            judul,
            pesan,
            tipe,
            status_baca,
        } = req.body;

        const existingNotifikasi = await prisma.notifikasi.findUnique({
            where: {
                id,
            },
        });

        if (!existingNotifikasi) {
            return res.status(404).json({
                success: false,
                message: "Notifikasi tidak ditemukan",
            });
        }

        if (
            typeof judul !== "string" ||
            judul.trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Judul notifikasi wajib diisi",
            });
        }

        if (
            typeof pesan !== "string" ||
            pesan.trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Pesan notifikasi wajib diisi",
            });
        }

        const tipeValid = [
            "INFO",
            "SUCCESS",
            "WARNING",
            "ERROR",
        ];

        if (!tipeValid.includes(tipe)) {
            return res.status(400).json({
                success: false,
                message:
                    "Tipe notifikasi harus INFO, SUCCESS, WARNING, atau ERROR",
            });
        }

        if (typeof status_baca !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "status_baca harus berupa true atau false",
            });
        }

        const data = await prisma.notifikasi.update({
            where: {
                id,
            },
            data: {
                judul: judul.trim(),
                pesan: pesan.trim(),
                tipe,
                status_baca,
            },
            include: {
                usaha: {
                    select: {
                        id: true,
                        nama_usaha: true,
                    },
                },
                user: {
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
            message: "Notifikasi berhasil diperbarui",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error("UPDATE NOTIFIKASI ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui notifikasi",
            error: error.message,
        });
    }
};

// =========================
// DELETE NOTIFIKASI
// =========================
const deleteNotifikasi = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const existingNotifikasi = await prisma.notifikasi.findUnique({
            where: {
                id,
            },
        });

        if (!existingNotifikasi) {
            return res.status(404).json({
                success: false,
                message: "Notifikasi tidak ditemukan",
            });
        }

        await prisma.notifikasi.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Notifikasi berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE NOTIFIKASI ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus notifikasi",
            error: error.message,
        });
    }
};

module.exports = {
    getAllNotifikasi,
    getNotifikasiById,
    createNotifikasi,
    updateNotifikasi,
    deleteNotifikasi,
};