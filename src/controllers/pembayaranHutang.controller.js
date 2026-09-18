const prisma = require("../config/database");

// ========================================
// FORMAT PEMBAYARAN HUTANG
// ========================================
const formatPembayaranHutang = (data) => {
    if (!data) return null;

    return {
        id: data.id.toString(),
        hutang_id: data.hutang_id.toString(),
        rekening_id: data.rekening_id.toString(),
        tanggal: data.tanggal,
        nominal: data.nominal.toString(),
        keterangan: data.keterangan,

        hutang: data.hutang
            ? {
                  id: data.hutang.id.toString(),
                  pembelian_id: data.hutang.pembelian_id.toString(),
                  supplier_id: data.hutang.supplier_id.toString(),
                  total_hutang: data.hutang.total_hutang.toString(),
                  sisa_hutang: data.hutang.sisa_hutang.toString(),
                  jatuh_tempo: data.hutang.jatuh_tempo,
                  status: data.hutang.status,

                  supplier: data.hutang.supplier
                      ? {
                            id: data.hutang.supplier.id.toString(),
                            usaha_id: data.hutang.supplier.usaha_id.toString(),
                            nama: data.hutang.supplier.nama,
                            telepon: data.hutang.supplier.telepon,
                            email: data.hutang.supplier.email,
                            alamat: data.hutang.supplier.alamat,
                            kontak_person: data.hutang.supplier.kontak_person,
                        }
                      : null,

                  pembelian: data.hutang.pembelian
                      ? {
                            id: data.hutang.pembelian.id.toString(),
                            usaha_id:
                                data.hutang.pembelian.usaha_id.toString(),
                            supplier_id:
                                data.hutang.pembelian.supplier_id.toString(),
                            rekening_id:
                                data.hutang.pembelian.rekening_id.toString(),
                            nomor_faktur:
                                data.hutang.pembelian.nomor_faktur,
                            tanggal: data.hutang.pembelian.tanggal,
                            subtotal:
                                data.hutang.pembelian.subtotal.toString(),
                            diskon: data.hutang.pembelian.diskon.toString(),
                            pajak: data.hutang.pembelian.pajak.toString(),
                            ongkir: data.hutang.pembelian.ongkir.toString(),
                            total: data.hutang.pembelian.total.toString(),
                            metode_pembayaran:
                                data.hutang.pembelian.metode_pembayaran,
                            status: data.hutang.pembelian.status,
                            catatan: data.hutang.pembelian.catatan,
                        }
                      : null,
              }
            : null,

        rekening: data.rekening
            ? {
                  id: data.rekening.id.toString(),
                  usaha_id: data.rekening.usaha_id.toString(),
                  nama_rekening: data.rekening.nama_rekening,
                  bank: data.rekening.bank,
                  nomor_rekening: data.rekening.nomor_rekening,
                  atas_nama: data.rekening.atas_nama,
                  saldo_awal: data.rekening.saldo_awal.toString(),
                  saldo: data.rekening.saldo.toString(),
              }
            : null,
    };
};

// ========================================
// GET SEMUA PEMBAYARAN HUTANG
// ========================================
const getAllPembayaranHutang = async (req, res) => {
    try {
        const data = await prisma.pembayaranHutang.findMany({
            orderBy: {
                tanggal: "desc",
            },
            include: {
                hutang: {
                    include: {
                        supplier: true,
                        pembelian: true,
                    },
                },
                rekening: true,
            },
        });

        return res.json({
            success: true,
            message: "Data pembayaran hutang berhasil diambil",
            data: data.map(formatPembayaranHutang),
        });
    } catch (error) {
        console.error("GET PEMBAYARAN HUTANG ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data pembayaran hutang",
            error: error.message,
        });
    }
};

// ========================================
// GET PEMBAYARAN HUTANG BY ID
// ========================================
const getPembayaranHutangById = async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.pembayaranHutang.findUnique({
            where: {
                id,
            },
            include: {
                hutang: {
                    include: {
                        supplier: true,
                        pembelian: true,
                    },
                },
                rekening: true,
            },
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Data pembayaran hutang tidak ditemukan",
            });
        }

        return res.json({
            success: true,
            message: "Data pembayaran hutang berhasil diambil",
            data: formatPembayaranHutang(data),
        });
    } catch (error) {
        console.error("GET PEMBAYARAN HUTANG BY ID ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data pembayaran hutang",
            error: error.message,
        });
    }
};

// ========================================
// CREATE PEMBAYARAN HUTANG
// ========================================
const createPembayaranHutang = async (req, res) => {
    try {
        const {
            hutang_id,
            rekening_id,
            tanggal,
            nominal,
            keterangan,
        } = req.body;

        // ----------------------------
        // VALIDASI INPUT
        // ----------------------------
        if (!hutang_id || !rekening_id || !tanggal || nominal === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "hutang_id, rekening_id, tanggal, dan nominal wajib diisi",
            });
        }

        const hutangId = BigInt(hutang_id);
        const rekeningId = BigInt(rekening_id);
        const createdBy = BigInt(req.user.userId);
        const nominalPembayaran = Number(nominal);

        if (
            !Number.isFinite(nominalPembayaran) ||
            nominalPembayaran <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Nominal pembayaran harus lebih besar dari 0",
            });
        }

        // ----------------------------
        // DATABASE TRANSACTION
        // ----------------------------
        const result = await prisma.$transaction(async (tx) => {
            // Ambil hutang
            const hutang = await tx.hutang.findUnique({
                where: {
                    id: hutangId,
                },
                include: {
                    supplier: true,
                    pembelian: true,
                },
            });

            if (!hutang) {
                throw new Error("Data hutang tidak ditemukan");
            }

            if (
                hutang.status === "LUNAS" ||
                Number(hutang.sisa_hutang) <= 0
            ) {
                throw new Error("Hutang sudah lunas");
            }

            // Ambil rekening
            const rekening = await tx.rekening.findUnique({
                where: {
                    id: rekeningId,
                },
            });

            if (!rekening) {
                throw new Error("Rekening tidak ditemukan");
            }

            // Pastikan rekening dan hutang berasal
            // dari usaha yang sama
            if (rekening.usaha_id !== hutang.pembelian.usaha_id) {
                throw new Error(
                    "Rekening tidak sesuai dengan usaha pada hutang"
                );
            }

            // Cek saldo rekening
            const saldoSebelum = Number(rekening.saldo);

            if (saldoSebelum < nominalPembayaran) {
                throw new Error("Saldo rekening tidak mencukupi");
            }

            // Cek sisa hutang
            const sisaSebelum = Number(hutang.sisa_hutang);

            if (nominalPembayaran > sisaSebelum) {
                throw new Error(
                    `Nominal pembayaran melebihi sisa hutang Rp${sisaSebelum}`
                );
            }

            const sisaSesudah =
                sisaSebelum - nominalPembayaran;

            const statusSesudah =
                sisaSesudah === 0
                    ? "LUNAS"
                    : "BELUM_LUNAS";

            const saldoSesudah =
                saldoSebelum - nominalPembayaran;

            // ----------------------------
            // 1. CREATE PEMBAYARAN
            // ----------------------------
            const pembayaran =
                await tx.pembayaranHutang.create({
                    data: {
                        hutang_id: hutangId,
                        rekening_id: rekeningId,
                        tanggal: new Date(tanggal),
                        nominal: nominalPembayaran,
                        keterangan: keterangan || null,
                    },
                });

            // ----------------------------
            // 2. UPDATE HUTANG
            // ----------------------------
            const hutangUpdated =
                await tx.hutang.update({
                    where: {
                        id: hutangId,
                    },
                    data: {
                        sisa_hutang: sisaSesudah,
                        status: statusSesudah,
                    },
                });

            // ----------------------------
            // 3. UPDATE REKENING
            // ----------------------------
            const rekeningUpdated =
                await tx.rekening.update({
                    where: {
                        id: rekeningId,
                    },
                    data: {
                        saldo: saldoSesudah,
                    },
                });

            // ----------------------------
            // 4. CREATE TRANSAKSI KAS
            // ----------------------------
            const transaksiKas =
                await tx.transaksiKas.create({
                    data: {
                        usaha_id:
                            hutang.pembelian.usaha_id,
                        rekening_id: rekeningId,
                        referensi_tipe:
                            "PEMBAYARAN_HUTANG",
                        referensi_id:
                            pembayaran.id,
                        nomor_referensi: null,
                        jenis: "KELUAR",
                        tanggal: new Date(tanggal),
                        nominal: nominalPembayaran,
                        saldo_sebelum: saldoSebelum,
                        saldo_setelah: saldoSesudah,
                        keterangan:
                            keterangan ||
                            `Pembayaran hutang ${hutang.pembelian.nomor_faktur}`,
                        created_by: createdBy,
                    },
                });

            return {
                pembayaran,
                hutang: hutangUpdated,
                rekening: rekeningUpdated,
                transaksiKas,
            };
        });

        // ----------------------------
        // FORMAT RESPONSE
        // ----------------------------
        const pembayaranDetail =
            await prisma.pembayaranHutang.findUnique({
                where: {
                    id: result.pembayaran.id,
                },
                include: {
                    hutang: {
                        include: {
                            supplier: true,
                            pembelian: true,
                        },
                    },
                    rekening: true,
                },
            });

        return res.status(201).json({
            success: true,
            message: "Pembayaran hutang berhasil dibuat",
            data: formatPembayaranHutang(pembayaranDetail),
        });
    } catch (error) {
        console.error(
            "CREATE PEMBAYARAN HUTANG ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllPembayaranHutang,
    getPembayaranHutangById,
    createPembayaranHutang,
};