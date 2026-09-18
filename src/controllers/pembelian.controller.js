const prisma = require("../config/database");

// ======================================================
// FORMAT RESPONSE
// ======================================================

function formatPembelian(pembelian) {
    return {
        id: pembelian.id.toString(),
        usaha_id: pembelian.usaha_id.toString(),
        supplier_id: pembelian.supplier_id.toString(),
        rekening_id: pembelian.rekening_id.toString(),
        nomor_faktur: pembelian.nomor_faktur,
        tanggal: pembelian.tanggal,
        subtotal: Number(pembelian.subtotal),
        diskon: Number(pembelian.diskon),
        pajak: Number(pembelian.pajak),
        ongkir: Number(pembelian.ongkir),
        total: Number(pembelian.total),
        metode_pembayaran: pembelian.metode_pembayaran,
        status: pembelian.status,
        catatan: pembelian.catatan,
        created_by: pembelian.created_by.toString(),
        created_at: pembelian.created_at,
        updated_at: pembelian.updated_at,

        usaha: pembelian.usaha
            ? {
                  id: pembelian.usaha.id.toString(),
                  nama_usaha: pembelian.usaha.nama_usaha,
              }
            : null,

        supplier: pembelian.supplier
            ? {
                  id: pembelian.supplier.id.toString(),
                  nama: pembelian.supplier.nama,
                  telepon: pembelian.supplier.telepon,
                  email: pembelian.supplier.email,
              }
            : null,

        rekening: pembelian.rekening
            ? {
                  id: pembelian.rekening.id.toString(),
                  nama_rekening: pembelian.rekening.nama_rekening,
                  bank: pembelian.rekening.bank,
                  saldo: Number(pembelian.rekening.saldo),
              }
            : null,

        createdBy: pembelian.createdBy
            ? {
                  id: pembelian.createdBy.id.toString(),
                  nama: pembelian.createdBy.nama,
                  username: pembelian.createdBy.username,
              }
            : null,

        detail_pembelian: pembelian.detail_pembelian
            ? pembelian.detail_pembelian.map((detail) => ({
                  id: detail.id.toString(),
                  pembelian_id: detail.pembelian_id.toString(),
                  produk_id: detail.produk_id.toString(),
                  qty: detail.qty,
                  harga: Number(detail.harga),
                  harga_jual: Number(detail.harga_jual),
                  subtotal: Number(detail.subtotal),

                  produk: detail.produk
                      ? {
                            id: detail.produk.id.toString(),
                            kode_produk: detail.produk.kode_produk,
                            nama: detail.produk.nama,
                            stok: detail.produk.stok,
                            harga_modal: Number(detail.produk.harga_modal),
                            harga_jual: Number(detail.produk.harga_jual),
                        }
                      : null,
              }))
            : [],

        hutang: pembelian.hutang
            ? {
                  id: pembelian.hutang.id.toString(),
                  total_hutang: Number(pembelian.hutang.total_hutang),
                  sisa_hutang: Number(pembelian.hutang.sisa_hutang),
                  jatuh_tempo: pembelian.hutang.jatuh_tempo,
                  status: pembelian.hutang.status,
              }
            : null,
    };
}

// ======================================================
// INCLUDE
// ======================================================

const pembelianInclude = {
    usaha: true,
    supplier: true,
    rekening: true,

    createdBy: true,

    detail_pembelian: {
        include: {
            produk: true,
        },
    },

    hutang: true,
};

// ======================================================
// GET ALL PEMBELIAN
// ======================================================

async function getAllPembelian(req, res) {
    try {
        const data = await prisma.pembelian.findMany({
            include: pembelianInclude,
            orderBy: {
                id: "desc",
            },
        });

        res.json({
            success: true,
            message: "Data pembelian berhasil diambil",
            data: data.map(formatPembelian),
        });
    } catch (error) {
        console.error("GET PEMBELIAN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data pembelian",
            error: error.message,
        });
    }
}

// ======================================================
// GET PEMBELIAN BY ID
// ======================================================

async function getPembelianById(req, res) {
    try {
        const id = BigInt(req.params.id);

        const data = await prisma.pembelian.findUnique({
            where: {
                id,
            },
            include: pembelianInclude,
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Data pembelian tidak ditemukan",
            });
        }

        res.json({
            success: true,
            message: "Data pembelian berhasil diambil",
            data: formatPembelian(data),
        });
    } catch (error) {
        console.error("GET PEMBELIAN BY ID ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal mengambil data pembelian",
            error: error.message,
        });
    }
}

// ======================================================
// CREATE PEMBELIAN
// ======================================================

async function createPembelian(req, res) {
    try {
        const {
            usaha_id,
            supplier_id,
            rekening_id,
            nomor_faktur,
            tanggal,
            diskon = 0,
            pajak = 0,
            ongkir = 0,
            metode_pembayaran,
            status,
            catatan,
            jatuh_tempo,
            details,
        } = req.body;

        // --------------------------------------------------
        // VALIDASI INPUT DASAR
        // --------------------------------------------------

        if (
            !usaha_id ||
            !supplier_id ||
            !rekening_id ||
            !nomor_faktur ||
            !tanggal ||
            !metode_pembayaran ||
            !status ||
            !details ||
            !Array.isArray(details) ||
            details.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "usaha_id, supplier_id, rekening_id, nomor_faktur, tanggal, metode_pembayaran, status, dan details wajib diisi",
            });
        }

        // --------------------------------------------------
        // VALIDASI STATUS
        // --------------------------------------------------

        const statusValid = ["LUNAS", "HUTANG", "BATAL"];

        if (!statusValid.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status pembelian harus LUNAS, HUTANG, atau BATAL",
            });
        }

        // --------------------------------------------------
        // VALIDASI METODE PEMBAYARAN
        // --------------------------------------------------

        const metodeValid = [
            "TUNAI",
            "TRANSFER",
            "QRIS",
            "E_WALLET",
        ];

        if (!metodeValid.includes(metode_pembayaran)) {
            return res.status(400).json({
                success: false,
                message:
                    "Metode pembayaran harus TUNAI, TRANSFER, QRIS, atau E_WALLET",
            });
        }

        // --------------------------------------------------
        // KONVERSI ID
        // --------------------------------------------------

        const usahaId = BigInt(usaha_id);
        const supplierId = BigInt(supplier_id);
        const rekeningId = BigInt(rekening_id);
        const createdBy = BigInt(req.user.userId);

        // --------------------------------------------------
        // CEK USAHA
        // --------------------------------------------------

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

        // --------------------------------------------------
        // CEK SUPPLIER
        // --------------------------------------------------

        const supplier = await prisma.supplier.findUnique({
            where: {
                id: supplierId,
            },
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier tidak ditemukan",
            });
        }

        if (supplier.usaha_id !== usahaId) {
            return res.status(400).json({
                success: false,
                message:
                    "Supplier tidak terdaftar pada usaha tersebut",
            });
        }

        // --------------------------------------------------
        // CEK REKENING
        // --------------------------------------------------

        const rekening = await prisma.rekening.findUnique({
            where: {
                id: rekeningId,
            },
        });

        if (!rekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan",
            });
        }

        if (rekening.usaha_id !== usahaId) {
            return res.status(400).json({
                success: false,
                message:
                    "Rekening tidak terdaftar pada usaha tersebut",
            });
        }

        // --------------------------------------------------
        // CEK NOMOR FAKTUR
        // --------------------------------------------------

        const existingFaktur = await prisma.pembelian.findUnique({
            where: {
                nomor_faktur,
            },
        });

        if (existingFaktur) {
            return res.status(400).json({
                success: false,
                message: "Nomor faktur sudah digunakan",
            });
        }

        // --------------------------------------------------
        // VALIDASI DETAILS
        // --------------------------------------------------

        let subtotal = 0;
        const detailData = [];

        for (const detail of details) {
            if (
                !detail.produk_id ||
                !detail.qty ||
                detail.harga === undefined ||
                detail.harga_jual === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Setiap detail harus memiliki produk_id, qty, harga, dan harga_jual",
                });
            }

            const produkId = BigInt(detail.produk_id);
            const qty = Number(detail.qty);
            const harga = Number(detail.harga);
            const hargaJual = Number(detail.harga_jual);

            if (!Number.isInteger(qty) || qty <= 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Qty produk harus berupa angka bulat lebih dari 0",
                });
            }

            if (harga < 0 || hargaJual < 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Harga tidak boleh bernilai negatif",
                });
            }

            const produk = await prisma.produk.findUnique({
                where: {
                    id: produkId,
                },
            });

            if (!produk) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Produk dengan ID ${detail.produk_id} tidak ditemukan`,
                });
            }

            if (produk.usaha_id !== usahaId) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Produk ${produk.nama} bukan milik usaha tersebut`,
                });
            }

            const detailSubtotal = qty * harga;

            subtotal += detailSubtotal;

            detailData.push({
                produkId,
                qty,
                harga,
                hargaJual,
                subtotal: detailSubtotal,
            });
        }

        // --------------------------------------------------
        // HITUNG TOTAL
        // --------------------------------------------------

        const diskonValue = Number(diskon) || 0;
        const pajakValue = Number(pajak) || 0;
        const ongkirValue = Number(ongkir) || 0;

        if (
            diskonValue < 0 ||
            pajakValue < 0 ||
            ongkirValue < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Diskon, pajak, dan ongkir tidak boleh bernilai negatif",
            });
        }

        const total =
            subtotal -
            diskonValue +
            pajakValue +
            ongkirValue;

        if (total < 0) {
            return res.status(400).json({
                success: false,
                message: "Total pembelian tidak boleh negatif",
            });
        }

        // --------------------------------------------------
        // CEK SALDO UNTUK PEMBELIAN LUNAS
        // --------------------------------------------------

        if (status === "LUNAS") {
            const saldoSekarang = Number(rekening.saldo);

            if (saldoSekarang < total) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Saldo rekening tidak mencukupi. Saldo saat ini Rp${saldoSekarang.toLocaleString(
                            "id-ID"
                        )}, sedangkan total pembelian Rp${total.toLocaleString(
                            "id-ID"
                        )}`,
                });
            }
        }

        // --------------------------------------------------
        // TRANSACTION
        // --------------------------------------------------

        const result = await prisma.$transaction(async (tx) => {
            // ==================================================
            // 1. CREATE PEMBELIAN
            // ==================================================

            const pembelian = await tx.pembelian.create({
                data: {
                    usaha_id: usahaId,
                    supplier_id: supplierId,
                    rekening_id: rekeningId,
                    nomor_faktur,
                    tanggal: new Date(tanggal),
                    subtotal,
                    diskon: diskonValue,
                    pajak: pajakValue,
                    ongkir: ongkirValue,
                    total,
                    metode_pembayaran,
                    status,
                    catatan: catatan || null,
                    created_by: createdBy,

                    detail_pembelian: {
                        create: detailData.map((detail) => ({
                            produk_id: detail.produkId,
                            qty: detail.qty,
                            harga: detail.harga,
                            harga_jual: detail.hargaJual,
                            subtotal: detail.subtotal,
                        })),
                    },
                },
            });

            // ==================================================
            // 2. JIKA BATAL
            // ==================================================

            if (status === "BATAL") {
                return pembelian;
            }

            // ==================================================
            // 3. UPDATE STOK DAN HARGA MODAL
            // ==================================================

            for (const detail of detailData) {
                await tx.produk.update({
                    where: {
                        id: detail.produkId,
                    },
                    data: {
                        stok: {
                            increment: detail.qty,
                        },

                        harga_modal: detail.harga,

                        harga_jual: detail.hargaJual,
                    },
                });
            }

            // ==================================================
            // 4. PEMBELIAN LUNAS
            // ==================================================

            if (status === "LUNAS") {
                const rekeningSekarang =
                    await tx.rekening.findUnique({
                        where: {
                            id: rekeningId,
                        },
                    });

                const saldoSebelum = Number(
                    rekeningSekarang.saldo
                );

                const saldoSetelah =
                    saldoSebelum - total;

                // ----------------------------------------------
                // UPDATE SALDO REKENING
                // ----------------------------------------------

                await tx.rekening.update({
                    where: {
                        id: rekeningId,
                    },
                    data: {
                        saldo: saldoSetelah,
                    },
                });

                // ----------------------------------------------
                // TRANSAKSI KAS
                // ----------------------------------------------
                //
                // Schema TransaksiKas tidak memiliki enum
                // PEMBELIAN.
                //
                // Karena schema dikunci, pembelian LUNAS
                // dicatat sebagai PENYESUAIAN dengan
                // nomor_referensi = nomor faktur.
                // ----------------------------------------------

                await tx.transaksiKas.create({
                    data: {
                        usaha_id: usahaId,
                        rekening_id: rekeningId,

                        referensi_tipe: "PENYESUAIAN",
                        referensi_id: pembelian.id,
                        nomor_referensi: nomor_faktur,

                        jenis: "KELUAR",

                        tanggal: new Date(tanggal),

                        nominal: total,

                        saldo_sebelum: saldoSebelum,
                        saldo_setelah: saldoSetelah,

                        keterangan:
                            `Pembayaran pembelian ${nomor_faktur}`,

                        created_by: createdBy,
                    },
                });
            }

            // ==================================================
            // 5. PEMBELIAN HUTANG
            // ==================================================

            if (status === "HUTANG") {
                let tanggalJatuhTempo;

                if (jatuh_tempo) {
                    tanggalJatuhTempo = new Date(jatuh_tempo);
                } else {
                    tanggalJatuhTempo = new Date(tanggal);
                    tanggalJatuhTempo.setDate(
                        tanggalJatuhTempo.getDate() + 7
                    );
                }

                await tx.hutang.create({
                    data: {
                        pembelian_id: pembelian.id,
                        supplier_id: supplierId,

                        total_hutang: total,
                        sisa_hutang: total,

                        jatuh_tempo: tanggalJatuhTempo,

                        status: "BELUM_LUNAS",
                    },
                });
            }

            return pembelian;
        });

        // --------------------------------------------------
        // AMBIL DATA LENGKAP
        // --------------------------------------------------

        const pembelianLengkap =
            await prisma.pembelian.findUnique({
                where: {
                    id: result.id,
                },
                include: pembelianInclude,
            });

        res.status(201).json({
            success: true,
            message:
                status === "LUNAS"
                    ? "Pembelian berhasil disimpan dan pembayaran telah dicatat"
                    : status === "HUTANG"
                    ? "Pembelian berhasil disimpan dan hutang otomatis dibuat"
                    : "Pembelian berhasil disimpan sebagai BATAL",
            data: formatPembelian(pembelianLengkap),
        });
    } catch (error) {
        console.error("CREATE PEMBELIAN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal membuat pembelian",
            error: error.message,
        });
    }
}

// ======================================================
// UPDATE PEMBELIAN
// ======================================================

async function updatePembelian(req, res) {
    try {
        const id = BigInt(req.params.id);

        const existing = await prisma.pembelian.findUnique({
            where: {
                id,
            },
            include: {
                hutang: true,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Data pembelian tidak ditemukan",
            });
        }

        // --------------------------------------------------
        // CEK TRANSAKSI KAS TERKAIT
        // --------------------------------------------------

        const transaksiKas =
            await prisma.transaksiKas.findFirst({
                where: {
                    referensi_tipe: "PENYESUAIAN",
                    referensi_id: id,
                },
            });

        // --------------------------------------------------
        // JIKA SUDAH TERINTEGRASI
        // --------------------------------------------------

        if (existing.hutang || transaksiKas) {
            const {
                nomor_faktur,
                tanggal,
                catatan,
            } = req.body;

            const updated =
                await prisma.pembelian.update({
                    where: {
                        id,
                    },
                    data: {
                        nomor_faktur:
                            nomor_faktur ??
                            existing.nomor_faktur,

                        tanggal: tanggal
                            ? new Date(tanggal)
                            : existing.tanggal,

                        catatan:
                            catatan !== undefined
                                ? catatan
                                : existing.catatan,
                    },
                    include: pembelianInclude,
                });

            return res.json({
                success: true,
                message:
                    "Pembelian sudah terintegrasi. Hanya nomor faktur, tanggal, dan catatan yang dapat diubah.",
                data: formatPembelian(updated),
            });
        }

        // --------------------------------------------------
        // UPDATE PEMBELIAN BIASA
        // --------------------------------------------------

        const {
            supplier_id,
            rekening_id,
            nomor_faktur,
            tanggal,
            diskon,
            pajak,
            ongkir,
            metode_pembayaran,
            status,
            catatan,
        } = req.body;

        if (
            metode_pembayaran &&
            ![
                "TUNAI",
                "TRANSFER",
                "QRIS",
                "E_WALLET",
            ].includes(metode_pembayaran)
        ) {
            return res.status(400).json({
                success: false,
                message: "Metode pembayaran tidak valid",
            });
        }

        if (
            status &&
            !["LUNAS", "HUTANG", "BATAL"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Status pembelian tidak valid",
            });
        }

        const updated =
            await prisma.pembelian.update({
                where: {
                    id,
                },
                data: {
                    supplier_id: supplier_id
                        ? BigInt(supplier_id)
                        : undefined,

                    rekening_id: rekening_id
                        ? BigInt(rekening_id)
                        : undefined,

                    nomor_faktur,
                    tanggal: tanggal
                        ? new Date(tanggal)
                        : undefined,

                    diskon:
                        diskon !== undefined
                            ? Number(diskon)
                            : undefined,

                    pajak:
                        pajak !== undefined
                            ? Number(pajak)
                            : undefined,

                    ongkir:
                        ongkir !== undefined
                            ? Number(ongkir)
                            : undefined,

                    metode_pembayaran,
                    status,
                    catatan,
                },
                include: pembelianInclude,
            });

        res.json({
            success: true,
            message: "Pembelian berhasil diperbarui",
            data: formatPembelian(updated),
        });
    } catch (error) {
        console.error("UPDATE PEMBELIAN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal memperbarui pembelian",
            error: error.message,
        });
    }
}

// ======================================================
// DELETE PEMBELIAN
// ======================================================

async function deletePembelian(req, res) {
    try {
        const id = BigInt(req.params.id);

        const existing = await prisma.pembelian.findUnique({
            where: {
                id,
            },
            include: {
                hutang: true,
                detail_pembelian: true,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Data pembelian tidak ditemukan",
            });
        }

        // --------------------------------------------------
        // CEK HUTANG
        // --------------------------------------------------

        if (existing.hutang) {
            return res.status(400).json({
                success: false,
                message:
                    "Pembelian tidak dapat dihapus karena sudah memiliki hutang",
            });
        }

        // --------------------------------------------------
        // CEK TRANSAKSI KAS
        // --------------------------------------------------

        const transaksiKas =
            await prisma.transaksiKas.findFirst({
                where: {
                    referensi_tipe: "PENYESUAIAN",
                    referensi_id: id,
                },
            });

        if (transaksiKas) {
            return res.status(400).json({
                success: false,
                message:
                    "Pembelian tidak dapat dihapus karena sudah memiliki transaksi kas",
            });
        }

        // --------------------------------------------------
        // DELETE DETAIL
        // --------------------------------------------------

        await prisma.$transaction(async (tx) => {
            await tx.detailPembelian.deleteMany({
                where: {
                    pembelian_id: id,
                },
            });

            await tx.pembelian.delete({
                where: {
                    id,
                },
            });
        });

        res.json({
            success: true,
            message: "Pembelian berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE PEMBELIAN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Gagal menghapus pembelian",
            error: error.message,
        });
    }
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getAllPembelian,
    getPembelianById,
    createPembelian,
    updatePembelian,
    deletePembelian,
};