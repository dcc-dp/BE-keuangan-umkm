const prisma = require("../config/database");

// =====================================================
// CREATE SUPPLIER
// =====================================================
const createSupplier = async (req, res) => {
    try {
        const {
            usaha_id,
            nama,
            telepon,
            email,
            alamat,
            kontak_person,
        } = req.body;

        if (!usaha_id || !nama) {
            return res.status(400).json({
                success: false,
                message: "usaha_id dan nama supplier wajib diisi",
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

        // Cek nama supplier pada usaha yang sama
        const supplierExists = await prisma.supplier.findFirst({
            where: {
                usaha_id: BigInt(usaha_id),
                nama: nama,
            },
        });

        if (supplierExists) {
            return res.status(400).json({
                success: false,
                message: "Supplier dengan nama tersebut sudah ada pada usaha ini",
            });
        }

        // Create supplier
        const supplier = await prisma.supplier.create({
            data: {
                usaha_id: BigInt(usaha_id),
                nama: nama,
                telepon: telepon || null,
                email: email || null,
                alamat: alamat || null,
                kontak_person: kontak_person || null,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Supplier berhasil dibuat",
            data: {
                ...supplier,
                id: supplier.id.toString(),
                usaha_id: supplier.usaha_id.toString(),
            },
        });
    } catch (error) {
        console.error("CREATE SUPPLIER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET ALL SUPPLIER
// =====================================================
const getAllSupplier = async (req, res) => {
    try {
        const supplier = await prisma.supplier.findMany({
            include: {
                usaha: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        const data = supplier.map((item) => ({
            id: item.id.toString(),
            usaha_id: item.usaha_id.toString(),
            nama: item.nama,
            telepon: item.telepon,
            email: item.email,
            alamat: item.alamat,
            kontak_person: item.kontak_person,
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
            message: "Data supplier berhasil diambil",
            data,
        });
    } catch (error) {
        console.error("GET ALL SUPPLIER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// GET SUPPLIER BY ID
// =====================================================
const getSupplierById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const supplier = await prisma.supplier.findUnique({
            where: {
                id,
            },
            include: {
                usaha: true,
            },
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier tidak ditemukan",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data supplier berhasil diambil",
            data: {
                id: supplier.id.toString(),
                usaha_id: supplier.usaha_id.toString(),
                nama: supplier.nama,
                telepon: supplier.telepon,
                email: supplier.email,
                alamat: supplier.alamat,
                kontak_person: supplier.kontak_person,
                created_at: supplier.created_at,
                updated_at: supplier.updated_at,

                usaha: supplier.usaha
                    ? {
                          id: supplier.usaha.id.toString(),
                          nama_usaha: supplier.usaha.nama_usaha,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error("GET SUPPLIER BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE SUPPLIER
// =====================================================
const updateSupplier = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const {
            usaha_id,
            nama,
            telepon,
            email,
            alamat,
            kontak_person,
        } = req.body;

        // Cari supplier
        const existingSupplier = await prisma.supplier.findUnique({
            where: {
                id,
            },
        });

        if (!existingSupplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier tidak ditemukan",
            });
        }

        // Gunakan data lama jika tidak dikirim
        const targetUsahaId = usaha_id
            ? BigInt(usaha_id)
            : existingSupplier.usaha_id;

        const targetNama =
            nama !== undefined
                ? nama
                : existingSupplier.nama;

        const targetTelepon =
            telepon !== undefined
                ? telepon
                : existingSupplier.telepon;

        const targetEmail =
            email !== undefined
                ? email
                : existingSupplier.email;

        const targetAlamat =
            alamat !== undefined
                ? alamat
                : existingSupplier.alamat;

        const targetKontakPerson =
            kontak_person !== undefined
                ? kontak_person
                : existingSupplier.kontak_person;

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

        // Cek duplikasi nama supplier
        const supplierExists = await prisma.supplier.findFirst({
            where: {
                usaha_id: targetUsahaId,
                nama: targetNama,
                NOT: {
                    id,
                },
            },
        });

        if (supplierExists) {
            return res.status(400).json({
                success: false,
                message: "Supplier dengan nama tersebut sudah ada pada usaha ini",
            });
        }

        // Update
        const supplier = await prisma.supplier.update({
            where: {
                id,
            },
            data: {
                usaha_id: targetUsahaId,
                nama: targetNama,
                telepon: targetTelepon,
                email: targetEmail,
                alamat: targetAlamat,
                kontak_person: targetKontakPerson,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Supplier berhasil diperbarui",
            data: {
                ...supplier,
                id: supplier.id.toString(),
                usaha_id: supplier.usaha_id.toString(),
            },
        });
    } catch (error) {
        console.error("UPDATE SUPPLIER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE SUPPLIER
// =====================================================
const deleteSupplier = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        // Cari supplier
        const existingSupplier = await prisma.supplier.findUnique({
            where: {
                id,
            },
        });

        if (!existingSupplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier tidak ditemukan",
            });
        }

        // Delete
        await prisma.supplier.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Supplier berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE SUPPLIER ERROR:", error);

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
    createSupplier,
    getAllSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
};