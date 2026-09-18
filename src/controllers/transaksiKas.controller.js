
const prisma = require("../config/database");

const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// Data user yang aman untuk ditampilkan
const createdBySelect = {
    id: true,
    nama: true,
    username: true,
    email: true,
    no_hp: true,
    foto: true,
    status: true,
};

// GET semua transaksi kas
const getAllTransaksiKas = async (req, res) => {
    try {
        const data = await prisma.transaksiKas.findMany({
            orderBy: {
                tanggal: "desc",
            },
            include: {
                rekening: true,
                usaha: true,
                createdBy: {
                    select: createdBySelect,
                },
            },
        });

        res.json({
            success: true,
            message: "Data transaksi kas berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data transaksi kas",
            error: error.message,
        });
    }
};

// GET transaksi kas berdasarkan ID
const getTransaksiKasById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.transaksiKas.findUnique({
            where: {
                id,
            },
            include: {
                rekening: true,
                usaha: true,
                createdBy: {
                    select: createdBySelect,
                },
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Transaksi kas tidak ditemukan",
            });
        }

        res.json({
            success: true,
            message: "Data transaksi kas berhasil diambil",
            data: serializeBigInt(data),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil transaksi kas",
            error: error.message,
        });
    }
};

module.exports = {
    getAllTransaksiKas,
    getTransaksiKasById,
};

