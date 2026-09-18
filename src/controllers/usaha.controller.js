const prisma = require("../config/database");

// ========================================
// CREATE USAHA
// POST /api/usaha
// ========================================
const createUsaha = async (req, res) => {
    try {
        const {
            nama_usaha,
            pemilik,
            email,
            telepon,
            alamat,
            logo,
            jenis_usaha,
            mata_uang,
        } = req.body;

        // Validasi field wajib
        if (!nama_usaha || !pemilik) {
            return res.status(400).json({
                success: false,
                message: "Nama usaha dan pemilik wajib diisi",
            });
        }

        // Buat usaha
        const usaha = await prisma.usaha.create({
            data: {
                nama_usaha,
                pemilik,
                email: email || null,
                telepon: telepon || null,
                alamat: alamat || null,
                logo: logo || null,
                jenis_usaha: jenis_usaha || null,
                mata_uang: mata_uang || "IDR",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Usaha berhasil dibuat",
            data: {
                ...usaha,
                id: usaha.id.toString(),
            },
        });

    } catch (error) {
        console.error("CREATE USAHA ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ========================================
// GET ALL USAHA
// GET /api/usaha
// ========================================
const getAllUsaha = async (req, res) => {
    try {
        const usaha = await prisma.usaha.findMany({
            orderBy: {
                id: "desc",
            },
        });

        const data = usaha.map((item) => ({
            ...item,
            id: item.id.toString(),
        }));

        return res.status(200).json({
            success: true,
            message: "Data usaha berhasil diambil",
            data: data,
        });

    } catch (error) {
        console.error("GET ALL USAHA ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ========================================
// GET USAHA BY ID
// GET /api/usaha/:id
// ========================================
const getUsahaById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const usaha = await prisma.usaha.findUnique({
            where: {
                id: id,
            },
        });

        // Jika tidak ditemukan
        if (!usaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data usaha berhasil diambil",
            data: {
                ...usaha,
                id: usaha.id.toString(),
            },
        });

    } catch (error) {
        console.error("GET USAHA BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ========================================
// UPDATE USAHA
// PUT /api/usaha/:id
// ========================================
const updateUsaha = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            nama_usaha,
            pemilik,
            email,
            telepon,
            alamat,
            logo,
            jenis_usaha,
            mata_uang,
        } = req.body;

        // Cek usaha
        const existingUsaha = await prisma.usaha.findUnique({
            where: {
                id: id,
            },
        });

        if (!existingUsaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan",
            });
        }

        // Update
        const usaha = await prisma.usaha.update({
            where: {
                id: id,
            },
            data: {
                nama_usaha,
                pemilik,
                email,
                telepon,
                alamat,
                logo,
                jenis_usaha,
                mata_uang,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Usaha berhasil diperbarui",
            data: {
                ...usaha,
                id: usaha.id.toString(),
            },
        });

    } catch (error) {
        console.error("UPDATE USAHA ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

// ========================================
// DELETE USAHA
// DELETE /api/usaha/:id
// ========================================
const deleteUsaha = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        // Cek usaha
        const existingUsaha = await prisma.usaha.findUnique({
            where: {
                id: id,
            },
        });

        if (!existingUsaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan",
            });
        }

        // Hapus usaha
        await prisma.usaha.delete({
            where: {
                id: id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Usaha berhasil dihapus",
        });

    } catch (error) {
        console.error("DELETE USAHA ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus usaha",
            error: error.message,
        });
    }
};

module.exports = {
    createUsaha,
    getAllUsaha,
    getUsahaById,
    updateUsaha,
    deleteUsaha,
};