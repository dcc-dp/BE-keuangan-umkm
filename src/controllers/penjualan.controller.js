const prisma = require("../config/database");

// ==========================================
// SERIALIZE BIGINT
// ==========================================
const serializeBigInt = (data) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
};

// ==========================================
// FORMAT PENJUALAN
// ==========================================
const formatPenjualan = (item) => {
    if (!item) {
        return item;
    }

    return {
        id: item.id.toString(),

        usaha_id: item.usaha_id.toString(),

        pelanggan_id:
            item.pelanggan_id !== null
                ? item.pelanggan_id.toString()
                : null,

        rekening_id:
            item.rekening_id !== null
                ? item.rekening_id.toString()
                : null,

        nomor_invoice: item.nomor_invoice,
        tanggal: item.tanggal,

        subtotal: Number(item.subtotal),
        diskon: Number(item.diskon),
        pajak: Number(item.pajak),
        biaya_lain: Number(item.biaya_lain),
        total: Number(item.total),

        metode_pembayaran: item.metode_pembayaran,

        status: item.status,

        catatan: item.catatan,

        created_by:
            item.created_by !== null
                ? item.created_by.toString()
                : null,

        usaha: item.usaha
            ? {
                id: item.usaha.id.toString(),
                nama_usaha: item.usaha.nama_usaha
            }
            : null,

        pelanggan: item.pelanggan
            ? {
                id: item.pelanggan.id.toString(),
                nama: item.pelanggan.nama
            }
            : null,

        rekening: item.rekening
            ? {
                id: item.rekening.id.toString(),
                nama_rekening: item.rekening.nama_rekening,
                bank: item.rekening.bank,
                saldo: Number(item.rekening.saldo)
            }
            : null,

        createdBy: item.createdBy
            ? {
                id: item.createdBy.id.toString(),
                nama: item.createdBy.nama,
                username: item.createdBy.username
            }
            : null,

        detail_penjualan:
            item.detail_penjualan
                ? item.detail_penjualan.map((detail) => ({
                    id: detail.id.toString(),

                    produk_id:
                        detail.produk_id.toString(),

                    qty: detail.qty,

                    harga_modal:
                        Number(detail.harga_modal),

                    harga:
                        Number(detail.harga),

                    diskon:
                        Number(detail.diskon),

                    subtotal:
                        Number(detail.subtotal),

                    produk: detail.produk
                        ? {
                            id:
                                detail.produk.id.toString(),

                            kode_produk:
                                detail.produk.kode_produk,

                            nama:
                                detail.produk.nama
                        }
                        : null
                }))
                : []
    };
};

// ==========================================
// INCLUDE PENJUALAN
// ==========================================
const penjualanInclude = {
    usaha: true,

    pelanggan: true,

    rekening: true,

    createdBy: true,

    detail_penjualan: {
        include: {
            produk: true
        }
    }
};

// ==========================================
// CREATE PENJUALAN
// ==========================================
const createPenjualan = async (req, res) => {
    try {
        const {
            usaha_id,
            pelanggan_id,
            rekening_id,
            nomor_invoice,
            tanggal,
            diskon,
            pajak,
            biaya_lain,
            metode_pembayaran,
            status,
            catatan,
            jatuh_tempo,
            detail
        } = req.body;

        // ==========================================
        // VALIDASI FIELD WAJIB
        // ==========================================
        if (
            usaha_id === undefined ||
            rekening_id === undefined ||
            nomor_invoice === undefined ||
            tanggal === undefined ||
            metode_pembayaran === undefined ||
            status === undefined ||
            !Array.isArray(detail) ||
            detail.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "usaha_id, rekening_id, nomor_invoice, tanggal, metode_pembayaran, status, dan detail wajib diisi"
            });
        }

        // ==========================================
        // VALIDASI STATUS
        // ==========================================
        const statusValid = [
            "LUNAS",
            "PIUTANG",
            "BATAL"
        ];

        if (!statusValid.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status harus LUNAS, PIUTANG, atau BATAL"
            });
        }

        // ==========================================
        // VALIDASI METODE PEMBAYARAN
        // ==========================================
        const metodeValid = [
            "TUNAI",
            "TRANSFER",
            "QRIS",
            "E_WALLET"
        ];

        if (!metodeValid.includes(metode_pembayaran)) {
            return res.status(400).json({
                success: false,
                message:
                    "Metode pembayaran tidak valid"
            });
        }

        // ==========================================
        // VALIDASI STATUS + PELANGGAN
        // ==========================================
        if (
            status === "PIUTANG" &&
            (pelanggan_id === undefined ||
                pelanggan_id === null)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Pelanggan wajib dipilih untuk penjualan piutang"
            });
        }

        // ==========================================
        // CEK USAHA
        // ==========================================
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

        // ==========================================
        // CEK REKENING
        // ==========================================
        const rekening = await prisma.rekening.findUnique({
            where: {
                id: BigInt(rekening_id)
            }
        });

        if (!rekening) {
            return res.status(404).json({
                success: false,
                message: "Rekening tidak ditemukan"
            });
        }

        if (
            rekening.usaha_id.toString() !==
            usaha_id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rekening tidak termasuk dalam usaha tersebut"
            });
        }

        // ==========================================
        // CEK PELANGGAN
        // ==========================================
        let pelanggan = null;

        if (
            pelanggan_id !== undefined &&
            pelanggan_id !== null
        ) {
            pelanggan =
                await prisma.pelanggan.findUnique({
                    where: {
                        id: BigInt(pelanggan_id)
                    }
                });

            if (!pelanggan) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Pelanggan tidak ditemukan"
                });
            }

            if (
                pelanggan.usaha_id.toString() !==
                usaha_id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Pelanggan tidak termasuk dalam usaha tersebut"
                });
            }
        }

        // ==========================================
        // CEK NOMOR INVOICE
        // ==========================================
        const invoiceExists =
            await prisma.penjualan.findUnique({
                where: {
                    nomor_invoice
                }
            });

        if (invoiceExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Nomor invoice sudah digunakan"
            });
        }

        // ==========================================
        // HITUNG DETAIL
        // ==========================================
        let subtotal = 0;

        const detailData = [];

        for (const item of detail) {

            if (
                item.produk_id === undefined ||
                item.qty === undefined ||
                item.harga === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Setiap detail wajib memiliki produk_id, qty, dan harga"
                });
            }

            const qty = Number(item.qty);

            const harga = Number(item.harga);

            const diskonDetail =
                Number(item.diskon || 0);

            if (
                !Number.isFinite(qty) ||
                qty <= 0 ||
                !Number.isInteger(qty)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Qty harus berupa bilangan bulat lebih dari 0"
                });
            }

            if (
                !Number.isFinite(harga) ||
                harga < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Harga tidak valid"
                });
            }

            if (
                !Number.isFinite(diskonDetail) ||
                diskonDetail < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Diskon detail tidak valid"
                });
            }

            // ==========================================
            // CEK PRODUK
            // ==========================================
            const produk =
                await prisma.produk.findUnique({
                    where: {
                        id: BigInt(item.produk_id)
                    }
                });

            if (!produk) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Produk dengan ID ${item.produk_id} tidak ditemukan`
                });
            }

            if (
                produk.usaha_id.toString() !==
                usaha_id.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Produk ${produk.nama} tidak termasuk dalam usaha tersebut`
                });
            }

            // ==========================================
            // CEK STATUS PRODUK
            // ==========================================
            if (produk.status !== "ACTIVE") {
                return res.status(400).json({
                    success: false,
                    message:
                        `Produk ${produk.nama} tidak aktif`
                });
            }

            // ==========================================
            // CEK STOK
            // ==========================================
            if (
                status !== "BATAL" &&
                produk.stok < qty
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Stok produk ${produk.nama} tidak mencukupi. Stok tersedia: ${produk.stok}`
                });
            }

            // ==========================================
            // SNAPSHOT HARGA MODAL
            // ==========================================
            const hargaModal =
                Number(produk.harga_modal);

            // ==========================================
            // SUBTOTAL DETAIL
            // ==========================================
            const subtotalDetail =
                (qty * harga) -
                diskonDetail;

            if (subtotalDetail < 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Subtotal detail tidak boleh negatif"
                });
            }

            subtotal += subtotalDetail;

            detailData.push({
                produk_id:
                    BigInt(item.produk_id),

                qty,

                harga_modal:
                    hargaModal,

                harga,

                diskon:
                    diskonDetail,

                subtotal:
                    subtotalDetail
            });
        }

        // ==========================================
        // NILAI TAMBAHAN
        // ==========================================
        const diskonValue =
            Number(diskon || 0);

        const pajakValue =
            Number(pajak || 0);

        const biayaLainValue =
            Number(biaya_lain || 0);

        if (
            !Number.isFinite(diskonValue) ||
            !Number.isFinite(pajakValue) ||
            !Number.isFinite(biayaLainValue) ||
            diskonValue < 0 ||
            pajakValue < 0 ||
            biayaLainValue < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Diskon, pajak, dan biaya lain tidak valid"
            });
        }

        // ==========================================
        // HITUNG TOTAL
        // ==========================================
        const total =
            subtotal -
            diskonValue +
            pajakValue +
            biayaLainValue;

        if (
            !Number.isFinite(total) ||
            total < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Total penjualan tidak valid"
            });
        }

        // ==========================================
        // VALIDASI PIUTANG
        // ==========================================
        if (
            status === "PIUTANG" &&
            total <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Total piutang harus lebih besar dari 0"
            });
        }

        // ==========================================
        // TANGGAL JATUH TEMPO
        // ==========================================
        let tanggalJatuhTempo = null;

        if (status === "PIUTANG") {

            if (jatuh_tempo) {

                tanggalJatuhTempo =
                    new Date(jatuh_tempo);

                if (
                    isNaN(
                        tanggalJatuhTempo.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Format jatuh_tempo tidak valid"
                    });
                }

            } else {

                // Default 7 hari
                tanggalJatuhTempo =
                    new Date(tanggal);

                tanggalJatuhTempo.setDate(
                    tanggalJatuhTempo.getDate() + 7
                );
            }
        }

        // ==========================================
        // USER LOGIN
        // ==========================================
        const createdBy =
            BigInt(req.user.userId);

        // ==========================================
        // TRANSACTION
        // ==========================================
        const penjualan =
            await prisma.$transaction(async (tx) => {

                // ==========================================
                // CREATE PENJUALAN
                // ==========================================
                const newPenjualan =
                    await tx.penjualan.create({
                        data: {

                            usaha_id:
                                BigInt(usaha_id),

                            pelanggan_id:
                                pelanggan_id !== undefined &&
                                pelanggan_id !== null
                                    ? BigInt(pelanggan_id)
                                    : null,

                            rekening_id:
                                BigInt(rekening_id),

                            nomor_invoice,

                            tanggal:
                                new Date(tanggal),

                            subtotal,

                            diskon:
                                diskonValue,

                            pajak:
                                pajakValue,

                            biaya_lain:
                                biayaLainValue,

                            total,

                            metode_pembayaran,

                            status,

                            catatan:
                                catatan || null,

                            created_by:
                                createdBy,

                            detail_penjualan: {
                                create:
                                    detailData
                            }
                        }
                    });

                // ==========================================
                // JIKA BATAL
                // ==========================================
                if (status === "BATAL") {
                    return newPenjualan;
                }

                // ==========================================
                // KURANGI STOK
                // ==========================================
                for (const item of detailData) {

                    const updateStok =
                        await tx.produk.updateMany({
                            where: {
                                id: item.produk_id,

                                // Proteksi stok
                                stok: {
                                    gte: item.qty
                                }
                            },

                            data: {
                                stok: {
                                    decrement:
                                        item.qty
                                }
                            }
                        });

                    if (
                        updateStok.count === 0
                    ) {
                        throw new Error(
                            `Stok produk dengan ID ${item.produk_id.toString()} tidak mencukupi`
                        );
                    }
                }

                // ==========================================
                // PENJUALAN TUNAI / LUNAS
                // ==========================================
                if (status === "LUNAS") {

                    const rekeningSekarang =
                        await tx.rekening.findUnique({
                            where: {
                                id:
                                    BigInt(rekening_id)
                            }
                        });

                    if (!rekeningSekarang) {
                        throw new Error(
                            "Rekening tidak ditemukan"
                        );
                    }

                    const saldoSebelum =
                        Number(
                            rekeningSekarang.saldo
                        );

                    const saldoSetelah =
                        saldoSebelum + total;

                    // ==========================================
                    // UPDATE SALDO REKENING
                    // ==========================================
                    await tx.rekening.update({
                        where: {
                            id:
                                BigInt(rekening_id)
                        },

                        data: {
                            saldo:
                                saldoSetelah
                        }
                    });

                    // ==========================================
                    // TRANSAKSI KAS MASUK
                    // ==========================================
                    await tx.transaksiKas.create({
                        data: {

                            usaha_id:
                                BigInt(usaha_id),

                            rekening_id:
                                BigInt(rekening_id),

                            referensi_tipe:
                                "PENJUALAN",

                            referensi_id:
                                newPenjualan.id,

                            nomor_referensi:
                                nomor_invoice,

                            jenis:
                                "MASUK",

                            tanggal:
                                new Date(tanggal),

                            nominal:
                                total,

                            saldo_sebelum:
                                saldoSebelum,

                            saldo_setelah:
                                saldoSetelah,

                            keterangan:
                                `Penerimaan penjualan ${nomor_invoice}`,

                            created_by:
                                createdBy
                        }
                    });
                }

                // ==========================================
                // PENJUALAN PIUTANG
                // ==========================================
                if (status === "PIUTANG") {

                    await tx.piutang.create({
                        data: {

                            penjualan: {
                                connect: {
                                    id:
                                        newPenjualan.id
                                }
                            },

                            pelanggan: {
                                connect: {
                                    id:
                                        BigInt(
                                            pelanggan_id
                                        )
                                }
                            },

                            total_piutang:
                                total,

                            sisa_piutang:
                                total,

                            jatuh_tempo:
                                tanggalJatuhTempo,

                            status:
                                "BELUM_LUNAS"
                        }
                    });
                }

                // ==========================================
                // AMBIL DATA LENGKAP
                // ==========================================
                return await tx.penjualan.findUnique({
                    where: {
                        id:
                            newPenjualan.id
                    },

                    include:
                        penjualanInclude
                });
            });

        // ==========================================
        // RESPONSE
        // ==========================================
        return res.status(201).json({
            success: true,

            message:
                "Penjualan berhasil dibuat",

            data:
                serializeBigInt(
                    formatPenjualan(
                        penjualan
                    )
                )
        });

    } catch (error) {

        console.error(
            "CREATE PENJUALAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Terjadi kesalahan pada server",

            error:
                error.message
        });
    }
};

// ==========================================
// GET ALL PENJUALAN
// ==========================================
const getAllPenjualan = async (req, res) => {
    try {

        const penjualan =
            await prisma.penjualan.findMany({
                orderBy: {
                    id: "asc"
                },

                include:
                    penjualanInclude
            });

        return res.status(200).json({
            success: true,

            message:
                "Data penjualan berhasil diambil",

            data:
                penjualan.map(
                    formatPenjualan
                )
        });

    } catch (error) {

        console.error(
            "GET ALL PENJUALAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Terjadi kesalahan pada server",

            error:
                error.message
        });
    }
};

// ==========================================
// GET PENJUALAN BY ID
// ==========================================
const getPenjualanById = async (req, res) => {
    try {

        const id =
            BigInt(req.params.id);

        const penjualan =
            await prisma.penjualan.findUnique({
                where: {
                    id
                },

                include:
                    penjualanInclude
            });

        if (!penjualan) {
            return res.status(404).json({
                success: false,

                message:
                    "Penjualan tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,

            message:
                "Data penjualan berhasil diambil",

            data:
                serializeBigInt(
                    formatPenjualan(
                        penjualan
                    )
                )
        });

    } catch (error) {

        console.error(
            "GET PENJUALAN BY ID ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Terjadi kesalahan pada server",

            error:
                error.message
        });
    }
};

// ==========================================
// UPDATE PENJUALAN
// ==========================================
const updatePenjualan = async (req, res) => {
    try {

        const id =
            BigInt(req.params.id);

        // ==========================================
        // CARI PENJUALAN
        // ==========================================
        const existingPenjualan =
            await prisma.penjualan.findUnique({
                where: {
                    id
                },

                include: {
                    detail_penjualan: true,

                    piutang: true
                }
            });

        if (!existingPenjualan) {
            return res.status(404).json({
                success: false,

                message:
                    "Penjualan tidak ditemukan"
            });
        }

        // ==========================================
        // CEK TRANSAKSI KAS
        // ==========================================
        const transaksiKas =
            await prisma.transaksiKas.findFirst({
                where: {
                    referensi_tipe:
                        "PENJUALAN",

                    referensi_id:
                        id
                }
            });

        // ==========================================
        // JIKA SUDAH TERINTEGRASI
        // ==========================================
        if (
            transaksiKas ||
            existingPenjualan.piutang
        ) {

            const {
                nomor_invoice,
                tanggal,
                catatan
            } = req.body;

            const updateData = {};

            // Hanya metadata yang aman diubah
            if (
                nomor_invoice !== undefined
            ) {

                const invoiceExists =
                    await prisma.penjualan.findFirst({
                        where: {
                            nomor_invoice,

                            NOT: {
                                id
                            }
                        }
                    });

                if (invoiceExists) {
                    return res.status(400).json({
                        success: false,

                        message:
                            "Nomor invoice sudah digunakan"
                    });
                }

                updateData.nomor_invoice =
                    nomor_invoice;
            }

            if (
                tanggal !== undefined
            ) {

                const tanggalBaru =
                    new Date(tanggal);

                if (
                    isNaN(
                        tanggalBaru.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            "Tanggal tidak valid"
                    });
                }

                updateData.tanggal =
                    tanggalBaru;
            }

            if (
                catatan !== undefined
            ) {
                updateData.catatan =
                    catatan || null;
            }

            if (
                Object.keys(updateData)
                    .length === 0
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Penjualan yang sudah terintegrasi hanya dapat mengubah nomor invoice, tanggal, dan catatan"
                });
            }

            const updated =
                await prisma.penjualan.update({
                    where: {
                        id
                    },

                    data:
                        updateData,

                    include:
                        penjualanInclude
                });

            return res.status(200).json({
                success: true,

                message:
                    "Penjualan berhasil diperbarui",

                data:
                    serializeBigInt(
                        formatPenjualan(
                            updated
                        )
                    )
            });
        }

        // ==========================================
        // UPDATE PENJUALAN BELUM TERINTEGRASI
        // ==========================================
        const {
            pelanggan_id,
            rekening_id,
            nomor_invoice,
            tanggal,
            diskon,
            pajak,
            biaya_lain,
            metode_pembayaran,
            status,
            catatan
        } = req.body;

        const updateData = {};

        // ==========================================
        // PELANGGAN
        // ==========================================
        if (
            pelanggan_id !== undefined
        ) {

            if (
                pelanggan_id === null
            ) {
                updateData.pelanggan_id =
                    null;
            } else {

                const pelanggan =
                    await prisma.pelanggan.findUnique({
                        where: {
                            id:
                                BigInt(
                                    pelanggan_id
                                )
                        }
                    });

                if (!pelanggan) {
                    return res.status(404).json({
                        success: false,

                        message:
                            "Pelanggan tidak ditemukan"
                    });
                }

                if (
                    pelanggan.usaha_id.toString() !==
                    existingPenjualan.usaha_id.toString()
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            "Pelanggan tidak termasuk dalam usaha tersebut"
                    });
                }

                updateData.pelanggan_id =
                    BigInt(
                        pelanggan_id
                    );
            }
        }

        // ==========================================
        // REKENING
        // ==========================================
        if (
            rekening_id !== undefined
        ) {

            const rekening =
                await prisma.rekening.findUnique({
                    where: {
                        id:
                            BigInt(
                                rekening_id
                            )
                    }
                });

            if (!rekening) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Rekening tidak ditemukan"
                });
            }

            if (
                rekening.usaha_id.toString() !==
                existingPenjualan.usaha_id.toString()
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Rekening tidak termasuk dalam usaha tersebut"
                });
            }

            updateData.rekening_id =
                BigInt(
                    rekening_id
                );
        }

        // ==========================================
        // NOMOR INVOICE
        // ==========================================
        if (
            nomor_invoice !== undefined
        ) {

            const invoiceExists =
                await prisma.penjualan.findFirst({
                    where: {
                        nomor_invoice,

                        NOT: {
                            id
                        }
                    }
                });

            if (invoiceExists) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Nomor invoice sudah digunakan"
                });
            }

            updateData.nomor_invoice =
                nomor_invoice;
        }

        // ==========================================
        // TANGGAL
        // ==========================================
        if (
            tanggal !== undefined
        ) {

            const tanggalBaru =
                new Date(tanggal);

            if (
                isNaN(
                    tanggalBaru.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Tanggal tidak valid"
                });
            }

            updateData.tanggal =
                tanggalBaru;
        }

        // ==========================================
        // DISKON
        // ==========================================
        if (
            diskon !== undefined
        ) {

            const value =
                Number(diskon);

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Diskon tidak valid"
                });
            }

            updateData.diskon =
                value;
        }

        // ==========================================
        // PAJAK
        // ==========================================
        if (
            pajak !== undefined
        ) {

            const value =
                Number(pajak);

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Pajak tidak valid"
                });
            }

            updateData.pajak =
                value;
        }

        // ==========================================
        // BIAYA LAIN
        // ==========================================
        if (
            biaya_lain !== undefined
        ) {

            const value =
                Number(biaya_lain);

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Biaya lain tidak valid"
                });
            }

            updateData.biaya_lain =
                value;
        }

        // ==========================================
        // HITUNG TOTAL
        // ==========================================
        const subtotal =
            Number(
                existingPenjualan.subtotal
            );

        const finalDiskon =
            diskon !== undefined
                ? Number(diskon)
                : Number(
                    existingPenjualan.diskon
                );

        const finalPajak =
            pajak !== undefined
                ? Number(pajak)
                : Number(
                    existingPenjualan.pajak
                );

        const finalBiayaLain =
            biaya_lain !== undefined
                ? Number(biaya_lain)
                : Number(
                    existingPenjualan.biaya_lain
                );

        const total =
            subtotal -
            finalDiskon +
            finalPajak +
            finalBiayaLain;

        if (
            !Number.isFinite(total) ||
            total < 0
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Total penjualan tidak valid"
            });
        }

        updateData.total =
            total;

        // ==========================================
        // METODE PEMBAYARAN
        // ==========================================
        if (
            metode_pembayaran !== undefined
        ) {

            const metodeValid = [
                "TUNAI",
                "TRANSFER",
                "QRIS",
                "E_WALLET"
            ];

            if (
                !metodeValid.includes(
                    metode_pembayaran
                )
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Metode pembayaran tidak valid"
                });
            }

            updateData.metode_pembayaran =
                metode_pembayaran;
        }

        // ==========================================
        // STATUS
        // ==========================================
        if (
            status !== undefined
        ) {

            const statusValid = [
                "LUNAS",
                "PIUTANG",
                "BATAL"
            ];

            if (
                !statusValid.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Status harus LUNAS, PIUTANG, atau BATAL"
                });
            }

            updateData.status =
                status;
        }

        // ==========================================
        // CATATAN
        // ==========================================
        if (
            catatan !== undefined
        ) {
            updateData.catatan =
                catatan || null;
        }

        // ==========================================
        // UPDATE
        // ==========================================
        const penjualan =
            await prisma.penjualan.update({
                where: {
                    id
                },

                data:
                    updateData,

                include:
                    penjualanInclude
            });

        return res.status(200).json({
            success: true,

            message:
                "Penjualan berhasil diperbarui",

            data:
                serializeBigInt(
                    formatPenjualan(
                        penjualan
                    )
                )
        });

    } catch (error) {

        console.error(
            "UPDATE PENJUALAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Terjadi kesalahan pada server",

            error:
                error.message
        });
    }
};

// ==========================================
// DELETE PENJUALAN
// ==========================================
const deletePenjualan = async (req, res) => {
    try {

        const id =
            BigInt(req.params.id);

        // ==========================================
        // CARI PENJUALAN
        // ==========================================
        const existingPenjualan =
            await prisma.penjualan.findUnique({
                where: {
                    id
                }
            });

        if (!existingPenjualan) {
            return res.status(404).json({
                success: false,

                message:
                    "Penjualan tidak ditemukan"
            });
        }

        // ==========================================
        // CEK PIUTANG
        // ==========================================
        const piutang =
            await prisma.piutang.findUnique({
                where: {
                    penjualan_id:
                        id
                }
            });

        if (piutang) {
            return res.status(400).json({
                success: false,

                message:
                    "Penjualan tidak dapat dihapus karena sudah memiliki piutang"
            });
        }

        // ==========================================
        // CEK TRANSAKSI KAS
        // ==========================================
        const transaksiKas =
            await prisma.transaksiKas.findFirst({
                where: {
                    referensi_tipe:
                        "PENJUALAN",

                    referensi_id:
                        id
                }
            });

        if (transaksiKas) {
            return res.status(400).json({
                success: false,

                message:
                    "Penjualan tidak dapat dihapus karena sudah memiliki transaksi kas"
            });
        }

        // ==========================================
        // HAPUS DETAIL
        // ==========================================
        await prisma.detailPenjualan.deleteMany({
            where: {
                penjualan_id:
                    id
            }
        });

        // ==========================================
        // HAPUS PENJUALAN
        // ==========================================
        await prisma.penjualan.delete({
            where: {
                id
            }
        });

        return res.status(200).json({
            success: true,

            message:
                "Penjualan berhasil dihapus"
        });

    } catch (error) {

        console.error(
            "DELETE PENJUALAN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Terjadi kesalahan pada server",

            error:
                error.message
        });
    }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
    createPenjualan,
    getAllPenjualan,
    getPenjualanById,
    updatePenjualan,
    deletePenjualan
};