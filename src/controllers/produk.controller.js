const prisma = require("../config/database");

// =====================================================
// CREATE PRODUK
// POST /api/produk
// =====================================================
const createProduk = async (req, res) => {
    try {
        const {
            usaha_id,
            kategori_id,
            kode_produk,
            barcode,
            nama,
            harga_modal,
            harga_jual,
            stok,
            satuan,
            status,
        } = req.body;

        // -------------------------------------------------
        // VALIDASI FIELD WAJIB
        // -------------------------------------------------
        if (
            !usaha_id ||
            !kategori_id ||
            !kode_produk ||
            !nama ||
            harga_modal === undefined ||
            harga_jual === undefined ||
            stok === undefined ||
            !satuan
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "usaha_id, kategori_id, kode_produk, nama, harga_modal, harga_jual, stok, dan satuan wajib diisi",
            });
        }

        // -------------------------------------------------
        // CEK USAHA
        // -------------------------------------------------
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

        // -------------------------------------------------
        // CEK KATEGORI
        // -------------------------------------------------
        const kategori = await prisma.kategoriProduk.findUnique({
            where: {
                id: BigInt(kategori_id),
            },
        });

        if (!kategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori produk tidak ditemukan",
            });
        }

        // Pastikan kategori berasal dari usaha yang sama
        if (kategori.usaha_id !== BigInt(usaha_id)) {
            return res.status(400).json({
                success: false,
                message: "Kategori produk bukan milik usaha tersebut",
            });
        }

        // -------------------------------------------------
        // CEK KODE PRODUK
        // -------------------------------------------------
        const kodeProdukExists = await prisma.produk.findFirst({
            where: {
                usaha_id: BigInt(usaha_id),
                kode_produk: kode_produk,
            },
        });

        if (kodeProdukExists) {
            return res.status(400).json({
                success: false,
                message: "Kode produk sudah digunakan pada usaha ini",
            });
        }

        // -------------------------------------------------
        // CEK BARCODE
        // -------------------------------------------------
        if (barcode) {
            const barcodeExists = await prisma.produk.findFirst({
                where: {
                    usaha_id: BigInt(usaha_id),
                    barcode: barcode,
                },
            });

            if (barcodeExists) {
                return res.status(400).json({
                    success: false,
                    message: "Barcode sudah digunakan pada usaha ini",
                });
            }
        }

        // -------------------------------------------------
        // CREATE PRODUK
        // -------------------------------------------------
        const produk = await prisma.produk.create({
            data: {
                usaha_id: BigInt(usaha_id),
                kategori_id: BigInt(kategori_id),
                kode_produk: kode_produk,
                barcode: barcode || null,
                nama: nama,
                harga_modal: Number(harga_modal),
                harga_jual: Number(harga_jual),
                stok: Number(stok),
                satuan: satuan,
                status: status || "ACTIVE",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Produk berhasil dibuat",
            data: {
                ...produk,
                id: produk.id.toString(),
                usaha_id: produk.usaha_id.toString(),
                kategori_id: produk.kategori_id.toString(),
            },
        });
    } catch (error) {
        console.error("CREATE PRODUK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET SEMUA PRODUK
// GET /api/produk
// =====================================================
const getAllProduk = async (req, res) => {
    try {
        const produk = await prisma.produk.findMany({
            include: {
                usaha: true,
                kategori: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        const data = produk.map((item) => ({
            id: item.id.toString(),
            usaha_id: item.usaha_id.toString(),
            kategori_id: item.kategori_id.toString(),
            kode_produk: item.kode_produk,
            barcode: item.barcode,
            nama: item.nama,
            harga_modal: item.harga_modal,
            harga_jual: item.harga_jual,
            stok: item.stok,
            satuan: item.satuan,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,

            usaha: item.usaha
                ? {
                      id: item.usaha.id.toString(),
                      nama_usaha: item.usaha.nama_usaha,
                  }
                : null,

            kategori: item.kategori
                ? {
                      id: item.kategori.id.toString(),
                      nama: item.kategori.nama,
                  }
                : null,
        }));

        return res.status(200).json({
            success: true,
            message: "Data produk berhasil diambil",
            data,
        });
    } catch (error) {
        console.error("GET ALL PRODUK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET PRODUK BERDASARKAN ID
// GET /api/produk/:id
// =====================================================
const getProdukById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const produk = await prisma.produk.findUnique({
            where: {
                id: id,
            },
            include: {
                usaha: true,
                kategori: true,
            },
        });

        if (!produk) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data produk berhasil diambil",
            data: {
                id: produk.id.toString(),
                usaha_id: produk.usaha_id.toString(),
                kategori_id: produk.kategori_id.toString(),
                kode_produk: produk.kode_produk,
                barcode: produk.barcode,
                nama: produk.nama,
                harga_modal: produk.harga_modal,
                harga_jual: produk.harga_jual,
                stok: produk.stok,
                satuan: produk.satuan,
                status: produk.status,
                created_at: produk.created_at,
                updated_at: produk.updated_at,

                usaha: produk.usaha
                    ? {
                          id: produk.usaha.id.toString(),
                          nama_usaha: produk.usaha.nama_usaha,
                      }
                    : null,

                kategori: produk.kategori
                    ? {
                          id: produk.kategori.id.toString(),
                          nama: produk.kategori.nama,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error("GET PRODUK BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE PRODUK
// PUT /api/produk/:id
// =====================================================
const updateProduk = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            usaha_id,
            kategori_id,
            kode_produk,
            barcode,
            nama,
            harga_modal,
            harga_jual,
            stok,
            satuan,
            status,
        } = req.body;

        // -------------------------------------------------
        // CEK PRODUK
        // -------------------------------------------------
        const existingProduk = await prisma.produk.findUnique({
            where: {
                id: id,
            },
        });

        if (!existingProduk) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan",
            });
        }

        // -------------------------------------------------
        // GUNAKAN DATA LAMA JIKA TIDAK DIKIRIM
        // -------------------------------------------------
        const targetUsahaId = usaha_id
            ? BigInt(usaha_id)
            : existingProduk.usaha_id;

        const targetKategoriId = kategori_id
            ? BigInt(kategori_id)
            : existingProduk.kategori_id;

        const targetKodeProduk =
            kode_produk !== undefined
                ? kode_produk
                : existingProduk.kode_produk;

        const targetBarcode =
            barcode !== undefined
                ? barcode
                : existingProduk.barcode;

        const targetNama =
            nama !== undefined
                ? nama
                : existingProduk.nama;

        const targetHargaModal =
            harga_modal !== undefined
                ? Number(harga_modal)
                : existingProduk.harga_modal;

        const targetHargaJual =
            harga_jual !== undefined
                ? Number(harga_jual)
                : existingProduk.harga_jual;

        const targetStok =
            stok !== undefined
                ? Number(stok)
                : existingProduk.stok;

        const targetSatuan =
            satuan !== undefined
                ? satuan
                : existingProduk.satuan;

        const targetStatus =
            status !== undefined
                ? status
                : existingProduk.status;

        // -------------------------------------------------
        // CEK USAHA
        // -------------------------------------------------
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

        // -------------------------------------------------
        // CEK KATEGORI
        // -------------------------------------------------
        const kategori = await prisma.kategoriProduk.findUnique({
            where: {
                id: targetKategoriId,
            },
        });

        if (!kategori) {
            return res.status(404).json({
                success: false,
                message: "Kategori produk tidak ditemukan",
            });
        }

        // Kategori harus berasal dari usaha yang sama
        if (kategori.usaha_id !== targetUsahaId) {
            return res.status(400).json({
                success: false,
                message: "Kategori produk bukan milik usaha tersebut",
            });
        }

        // -------------------------------------------------
        // CEK DUPLIKASI KODE PRODUK
        // -------------------------------------------------
        const kodeProdukExists = await prisma.produk.findFirst({
            where: {
                usaha_id: targetUsahaId,
                kode_produk: targetKodeProduk,
                NOT: {
                    id: id,
                },
            },
        });

        if (kodeProdukExists) {
            return res.status(400).json({
                success: false,
                message: "Kode produk sudah digunakan pada usaha ini",
            });
        }

        // -------------------------------------------------
        // CEK DUPLIKASI BARCODE
        // -------------------------------------------------
        if (targetBarcode) {
            const barcodeExists = await prisma.produk.findFirst({
                where: {
                    usaha_id: targetUsahaId,
                    barcode: targetBarcode,
                    NOT: {
                        id: id,
                    },
                },
            });

            if (barcodeExists) {
                return res.status(400).json({
                    success: false,
                    message: "Barcode sudah digunakan pada usaha ini",
                });
            }
        }

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------
        const produk = await prisma.produk.update({
            where: {
                id: id,
            },
            data: {
                usaha_id: targetUsahaId,
                kategori_id: targetKategoriId,
                kode_produk: targetKodeProduk,
                barcode: targetBarcode || null,
                nama: targetNama,
                harga_modal: targetHargaModal,
                harga_jual: targetHargaJual,
                stok: targetStok,
                satuan: targetSatuan,
                status: targetStatus,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Produk berhasil diperbarui",
            data: {
                ...produk,
                id: produk.id.toString(),
                usaha_id: produk.usaha_id.toString(),
                kategori_id: produk.kategori_id.toString(),
            },
        });
    } catch (error) {
        console.error("UPDATE PRODUK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE PRODUK
// DELETE /api/produk/:id
// =====================================================
const deleteProduk = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        // -------------------------------------------------
        // CEK PRODUK
        // -------------------------------------------------
        const existingProduk = await prisma.produk.findUnique({
            where: {
                id: id,
            },
        });

        if (!existingProduk) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan",
            });
        }

        // -------------------------------------------------
        // HAPUS PRODUK
        // -------------------------------------------------
        await prisma.produk.delete({
            where: {
                id: id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Produk berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE PRODUK ERROR:", error);

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
    createProduk,
    getAllProduk,
    getProdukById,
    updateProduk,
    deleteProduk,
};