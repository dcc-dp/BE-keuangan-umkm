const prisma = require("../config/database");

// =====================================================
// CREATE KATEGORI PRODUK
// POST /api/kategori-produk
// =====================================================
const createKategoriProduk = async (req, res) => {
    try {
        const {
            usaha_id,
            nama,
            deskripsi,
        } = req.body;

        // Validasi
        if (!usaha_id || !nama) {
            return res.status(400).json({
                success: false,
                message: "usaha_id dan nama kategori wajib diisi",
            });
        }

        // Pastikan usaha ada
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

        // Cek apakah kategori dengan nama yang sama
        // sudah ada pada usaha tersebut
        const kategoriExists = await prisma.kategoriProduk.findFirst({
            where: {
                usaha_id: BigInt(usaha_id),
                nama: nama,
            },
        });

        if (kategoriExists) {
            return res.status(400).json({
                success: false,
                message: "Kategori dengan nama tersebut sudah ada pada usaha ini",
            });
        }

        // Buat kategori
        const kategori = await prisma.kategoriProduk.create({
            data: {
                usaha_id: BigInt(usaha_id),
                nama: nama,
                deskripsi: deskripsi || null,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Kategori produk berhasil dibuat",
            data: {
                ...kategori,
                id: kategori.id.toString(),
                usaha_id: kategori.usaha_id.toString(),
            },
        });

    } catch (error) {
        console.error("CREATE KATEGORI PRODUK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET SEMUA KATEGORI PRODUK
// GET /api/kategori-produk
// =====================================================
const getAllKategoriProduk = async (req, res) => {
    try {
        const kategori = await prisma.kategoriProduk.findMany({
            include: {
                usaha: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        const data = kategori.map((item) => ({
            id: item.id.toString(),
            usaha_id: item.usaha_id.toString(),
            nama: item.nama,
            deskripsi: item.deskripsi,
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
            message: "Data kategori produk berhasil diambil",
            data,
        });

    } catch (error) {
        console.error("GET ALL KATEGORI PRODUK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET KATEGORI PRODUK BERDASARKAN ID
// GET /api/kategori-produk/:id
// =====================================================
const getKategoriProdukById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const kategori = await prisma.kategoriProduk.findUnique({
            where: {
                id: id,
            },
            include: {
                usaha: true,
            },
        });

        if (!kategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori produk tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data kategori produk berhasil diambil",
            data: {
                id: kategori.id.toString(),
                usaha_id: kategori.usaha_id.toString(),
                nama: kategori.nama,
                deskripsi: kategori.deskripsi,
                created_at: kategori.created_at,
                updated_at: kategori.updated_at,
                usaha: kategori.usaha
                    ? {
                          id: kategori.usaha.id.toString(),
                          nama_usaha: kategori.usaha.nama_usaha,
                      }
                    : null,
            },
        });

    } catch (error) {
        console.error("GET KATEGORI PRODUK BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE KATEGORI PRODUK
// PUT /api/kategori-produk/:id
// =====================================================
const updateKategoriProduk = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            usaha_id,
            nama,
            deskripsi,
        } = req.body;

        // Cek kategori
        const existingKategori = await prisma.kategoriProduk.findUnique({
            where: {
                id: id,
            },
        });

        if (!existingKategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori produk tidak ditemukan",
            });
        }

        // Gunakan usaha_id lama jika tidak dikirim
        const targetUsahaId = usaha_id
            ? BigInt(usaha_id)
            : existingKategori.usaha_id;

        // Pastikan usaha tujuan ada
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

        // Gunakan nama lama jika tidak dikirim
        const targetNama = nama || existingKategori.nama;

        // Cek duplikasi nama kategori
        const kategoriExists = await prisma.kategoriProduk.findFirst({
            where: {
                usaha_id: targetUsahaId,
                nama: targetNama,
                NOT: {
                    id: id,
                },
            },
        });

        if (kategoriExists) {
            return res.status(400).json({
                success: false,
                message: "Kategori dengan nama tersebut sudah ada pada usaha ini",
            });
        }

        // Update
        const kategori = await prisma.kategoriProduk.update({
            where: {
                id: id,
            },
            data: {
                usaha_id: targetUsahaId,
                nama: targetNama,
                deskripsi:
                    deskripsi !== undefined
                        ? deskripsi
                        : existingKategori.deskripsi,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Kategori produk berhasil diperbarui",
            data: {
                ...kategori,
                id: kategori.id.toString(),
                usaha_id: kategori.usaha_id.toString(),
            },
        });

    } catch (error) {
        console.error("UPDATE KATEGORI PRODUK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE KATEGORI PRODUK
// DELETE /api/kategori-produk/:id
// =====================================================
const deleteKategoriProduk = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        // Cek kategori
        const existingKategori = await prisma.kategoriProduk.findUnique({
            where: {
                id: id,
            },
        });

        if (!existingKategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori produk tidak ditemukan",
            });
        }

        // Hapus kategori
        await prisma.kategoriProduk.delete({
            where: {
                id: id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Kategori produk berhasil dihapus",
        });

    } catch (error) {
        console.error("DELETE KATEGORI PRODUK ERROR:", error);

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
    createKategoriProduk,
    getAllKategoriProduk,
    getKategoriProdukById,
    updateKategoriProduk,
    deleteKategoriProduk,
};