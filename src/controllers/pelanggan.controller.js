const prisma = require("../config/database");

// =====================================================
// CREATE PELANGGAN
// =====================================================
const createPelanggan = async (req, res) => {
    try {
        const {
            usaha_id,
            nama,
            telepon,
            email,
            alamat,
            poin,
        } = req.body;

        // Validasi
        if (!usaha_id || !nama) {
            return res.status(400).json({
                success: false,
                message: "usaha_id dan nama pelanggan wajib diisi",
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

        // Cek nama pelanggan pada usaha yang sama
        const pelangganExists = await prisma.pelanggan.findFirst({
            where: {
                usaha_id: BigInt(usaha_id),
                nama: nama,
            },
        });

        if (pelangganExists) {
            return res.status(400).json({
                success: false,
                message: "Pelanggan dengan nama tersebut sudah ada pada usaha ini",
            });
        }

        // Create pelanggan
        const pelanggan = await prisma.pelanggan.create({
            data: {
                usaha_id: BigInt(usaha_id),
                nama: nama,
                telepon: telepon || null,
                email: email || null,
                alamat: alamat || null,
                poin: poin !== undefined ? Number(poin) : 0,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Pelanggan berhasil dibuat",
            data: {
                ...pelanggan,
                id: pelanggan.id.toString(),
                usaha_id: pelanggan.usaha_id.toString(),
            },
        });
    } catch (error) {
        console.error("CREATE PELANGGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET ALL PELANGGAN
// =====================================================
const getAllPelanggan = async (req, res) => {
    try {
        const pelanggan = await prisma.pelanggan.findMany({
            include: {
                usaha: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        const data = pelanggan.map((item) => ({
            id: item.id.toString(),
            usaha_id: item.usaha_id.toString(),
            nama: item.nama,
            telepon: item.telepon,
            email: item.email,
            alamat: item.alamat,
            poin: item.poin,
            created_at: item.created_at,
            updated_at: item.updated_at,

            usaha: item.usaha
                ? {
                      id: item.usaha.id.toString(),
                      nama_usaha: item.usaha.nama_usaha,
                  }
                : null,
        }));

        return res.status(200).json({
            success: true,
            message: "Data pelanggan berhasil diambil",
            data,
        });
    } catch (error) {
        console.error("GET ALL PELANGGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET PELANGGAN BY ID
// =====================================================
const getPelangganById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const pelanggan = await prisma.pelanggan.findUnique({
            where: {
                id,
            },
            include: {
                usaha: true,
            },
        });

        if (!pelanggan) {
            return res.status(404).json({
                success: false,
                message: "Pelanggan tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data pelanggan berhasil diambil",
            data: {
                id: pelanggan.id.toString(),
                usaha_id: pelanggan.usaha_id.toString(),
                nama: pelanggan.nama,
                telepon: pelanggan.telepon,
                email: pelanggan.email,
                alamat: pelanggan.alamat,
                poin: pelanggan.poin,
                created_at: pelanggan.created_at,
                updated_at: pelanggan.updated_at,

                usaha: pelanggan.usaha
                    ? {
                          id: pelanggan.usaha.id.toString(),
                          nama_usaha: pelanggan.usaha.nama_usaha,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error("GET PELANGGAN BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE PELANGGAN
// =====================================================
const updatePelanggan = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            usaha_id,
            nama,
            telepon,
            email,
            alamat,
            poin,
        } = req.body;

        // Cari pelanggan
        const existingPelanggan = await prisma.pelanggan.findUnique({
            where: {
                id,
            },
        });

        if (!existingPelanggan) {
            return res.status(404).json({
                success: false,
                message: "Pelanggan tidak ditemukan",
            });
        }

        // Gunakan data lama jika field tidak dikirim
        const targetUsahaId = usaha_id
            ? BigInt(usaha_id)
            : existingPelanggan.usaha_id;

        const targetNama =
            nama !== undefined
                ? nama
                : existingPelanggan.nama;

        const targetTelepon =
            telepon !== undefined
                ? telepon
                : existingPelanggan.telepon;

        const targetEmail =
            email !== undefined
                ? email
                : existingPelanggan.email;

        const targetAlamat =
            alamat !== undefined
                ? alamat
                : existingPelanggan.alamat;

        const targetPoin =
            poin !== undefined
                ? Number(poin)
                : existingPelanggan.poin;

        // Cek usaha
        const usaha = await prisma.usaha.findUnique({
            where: {
                id: targetUsahaId,
            },
        });

        if (!usaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan",
            });
        }

        // Cek duplikasi nama pelanggan
        const pelangganExists = await prisma.pelanggan.findFirst({
            where: {
                usaha_id: targetUsahaId,
                nama: targetNama,
                NOT: {
                    id,
                },
            },
        });

        if (pelangganExists) {
            return res.status(400).json({
                success: false,
                message: "Pelanggan dengan nama tersebut sudah ada pada usaha ini",
            });
        }

        // Update pelanggan
        const pelanggan = await prisma.pelanggan.update({
            where: {
                id,
            },
            data: {
                usaha_id: targetUsahaId,
                nama: targetNama,
                telepon: targetTelepon,
                email: targetEmail,
                alamat: targetAlamat,
                poin: targetPoin,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Pelanggan berhasil diperbarui",
            data: {
                ...pelanggan,
                id: pelanggan.id.toString(),
                usaha_id: pelanggan.usaha_id.toString(),
            },
        });
    } catch (error) {
        console.error("UPDATE PELANGGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE PELANGGAN
// =====================================================
const deletePelanggan = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        // Cari pelanggan
        const existingPelanggan = await prisma.pelanggan.findUnique({
            where: {
                id,
            },
        });

        if (!existingPelanggan) {
            return res.status(404).json({
                success: false,
                message: "Pelanggan tidak ditemukan",
            });
        }

        // Delete
        await prisma.pelanggan.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Pelanggan berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE PELANGGAN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {
    createPelanggan,
    getAllPelanggan,
    getPelangganById,
    updatePelanggan,
    deletePelanggan,
};