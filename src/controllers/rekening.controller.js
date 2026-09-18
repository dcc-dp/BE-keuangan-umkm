const prisma = require("../config/database");

// ==========================================
// CREATE REKENING
// ==========================================
const createRekening = async (req, res) => {
    try {
        const {
            usaha_id,
            nama_rekening,
            bank,
            nomor_rekening,
            atas_nama,
            saldo_awal,
            saldo
        } = req.body;

        // Validasi field wajib
        if (
            !usaha_id ||
            !nama_rekening ||
            !bank ||
            !nomor_rekening ||
            !atas_nama ||
            saldo_awal === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "usaha_id, nama_rekening, bank, nomor_rekening, atas_nama, dan saldo_awal wajib diisi"
            });
        }

        // Cek usaha
        const usaha = await prisma.usaha.findUnique({
            where: {
                id: BigInt(usaha_id)
            }
        });

        if (!usaha) {
            return res.status(404).json({
                success: false,
                message: "Usaha tidak ditemukan"
            });
        }

        // Jika saldo tidak dikirim,
        // saldo = saldo_awal
        const saldoAwalValue = Number(saldo_awal);
        const saldoValue =
            saldo !== undefined ? Number(saldo) : saldoAwalValue;

        // Validasi angka
        if (
            isNaN(saldoAwalValue) ||
            isNaN(saldoValue)
        ) {
            return res.status(400).json({
                success: false,
                message: "saldo_awal dan saldo harus berupa angka"
            });
        }

        const rekening = await prisma.rekening.create({
            data: {
                usaha_id: BigInt(usaha_id),
                nama_rekening,
                bank,
                nomor_rekening,
                atas_nama,
                saldo_awal: saldoAwalValue,
                saldo: saldoValue
            },
            include: {
                usaha: true
            }
        });

        return res.status(201).json({
            success: true,
            message: "Rekening berhasil dibuat",
            data: {
                id: rekening.id.toString(),
                usaha_id: rekening.usaha_id.toString(),
                nama_rekening: rekening.nama_rekening,
                bank: rekening.bank,
                nomor_rekening: rekening.nomor_rekening,
                atas_nama: rekening.atas_nama,
                saldo_awal: rekening.saldo_awal,
                saldo: rekening.saldo,
                usaha: rekening.usaha
                    ? {
                        id: rekening.usaha.id.toString(),
                        nama_usaha: rekening.usaha.nama_usaha
                    }
                    : null,
                created_at: rekening.created_at,
                updated_at: rekening.updated_at
            }
        });

    } catch (error) {
        console.error("CREATE REKENING ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL REKENING
// ==========================================
const getAllRekening = async (req, res) => {
    try {
        const rekening = await prisma.rekening.findMany({
            orderBy: {
                id: "asc"
            },
            include: {
                usaha: true
            }
        });

        const data = rekening.map((item) => ({
            id: item.id.toString(),
            usaha_id: item.usaha_id.toString(),
            nama_rekening: item.nama_rekening,
            bank: item.bank,
            nomor_rekening: item.nomor_rekening,
            atas_nama: item.atas_nama,
            saldo_awal: item.saldo_awal,
            saldo: item.saldo,
            usaha: item.usaha
                ? {
                    id: item.usaha.id.toString(),
                    nama_usaha: item.usaha.nama_usaha
                }
                : null,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));

        return res.status(200).json({
            success: true,
            message: "Data rekening berhasil diambil",
            data
        });

    } catch (error) {
        console.error("GET ALL REKENING ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


// ==========================================
// GET REKENING BY ID
// ==========================================
const getRekeningById = async (req, res) => {
    try {
        const { id } = req.params;

        const rekening = await prisma.rekening.findUnique({
            where: {
                id: BigInt(id)
            },
            include: {
                usaha: true
            }
        });

        if (!rekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Data rekening berhasil diambil",
            data: {
                id: rekening.id.toString(),
                usaha_id: rekening.usaha_id.toString(),
                nama_rekening: rekening.nama_rekening,
                bank: rekening.bank,
                nomor_rekening: rekening.nomor_rekening,
                atas_nama: rekening.atas_nama,
                saldo_awal: rekening.saldo_awal,
                saldo: rekening.saldo,
                usaha: rekening.usaha
                    ? {
                        id: rekening.usaha.id.toString(),
                        nama_usaha: rekening.usaha.nama_usaha
                    }
                    : null,
                created_at: rekening.created_at,
                updated_at: rekening.updated_at
            }
        });

    } catch (error) {
        console.error("GET REKENING BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE REKENING
// ==========================================
const updateRekening = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            usaha_id,
            nama_rekening,
            bank,
            nomor_rekening,
            atas_nama,
            saldo_awal,
            saldo
        } = req.body;

        // Cek rekening
        const existingRekening = await prisma.rekening.findUnique({
            where: {
                id: BigInt(id)
            }
        });

        if (!existingRekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan"
            });
        }

        // Jika usaha_id dikirim, cek usaha
        if (usaha_id !== undefined) {
            const usaha = await prisma.usaha.findUnique({
                where: {
                    id: BigInt(usaha_id)
                }
            });

            if (!usaha) {
                return res.status(404).json({
                    success: false,
                    message: "Usaha tidak ditemukan"
                });
            }
        }

        const updateData = {};

        if (usaha_id !== undefined) {
            updateData.usaha_id = BigInt(usaha_id);
        }

        if (nama_rekening !== undefined) {
            updateData.nama_rekening = nama_rekening;
        }

        if (bank !== undefined) {
            updateData.bank = bank;
        }

        if (nomor_rekening !== undefined) {
            updateData.nomor_rekening = nomor_rekening;
        }

        if (atas_nama !== undefined) {
            updateData.atas_nama = atas_nama;
        }

        if (saldo_awal !== undefined) {
            const saldoAwalValue = Number(saldo_awal);

            if (isNaN(saldoAwalValue)) {
                return res.status(400).json({
                    success: false,
                    message: "saldo_awal harus berupa angka"
                });
            }

            updateData.saldo_awal = saldoAwalValue;
        }

        if (saldo !== undefined) {
            const saldoValue = Number(saldo);

            if (isNaN(saldoValue)) {
                return res.status(400).json({
                    success: false,
                    message: "saldo harus berupa angka"
                });
            }

            updateData.saldo = saldoValue;
        }

        const rekening = await prisma.rekening.update({
            where: {
                id: BigInt(id)
            },
            data: updateData,
            include: {
                usaha: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Rekening berhasil diperbarui",
            data: {
                id: rekening.id.toString(),
                usaha_id: rekening.usaha_id.toString(),
                nama_rekening: rekening.nama_rekening,
                bank: rekening.bank,
                nomor_rekening: rekening.nomor_rekening,
                atas_nama: rekening.atas_nama,
                saldo_awal: rekening.saldo_awal,
                saldo: rekening.saldo,
                usaha: rekening.usaha
                    ? {
                        id: rekening.usaha.id.toString(),
                        nama_usaha: rekening.usaha.nama_usaha
                    }
                    : null,
                created_at: rekening.created_at,
                updated_at: rekening.updated_at
            }
        });

    } catch (error) {
        console.error("UPDATE REKENING ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


// ==========================================
// DELETE REKENING
// ==========================================
const deleteRekening = async (req, res) => {
    try {
        const { id } = req.params;

        // Cek rekening
        const existingRekening = await prisma.rekening.findUnique({
            where: {
                id: BigInt(id)
            }
        });

        if (!existingRekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan"
            });
        }

        await prisma.rekening.delete({
            where: {
                id: BigInt(id)
            }
        });

        return res.status(200).json({
            success: true,
            message: "Rekening berhasil dihapus"
        });

    } catch (error) {
        console.error("DELETE REKENING ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};


module.exports = {
    createRekening,
    getAllRekening,
    getRekeningById,
    updateRekening,
    deleteRekening
};