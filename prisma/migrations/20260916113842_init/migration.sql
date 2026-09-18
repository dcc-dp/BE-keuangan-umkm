-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `foto` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `last_login` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `deskripsi` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `modul` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usaha` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_usaha` VARCHAR(150) NOT NULL,
    `pemilik` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `telepon` VARCHAR(20) NOT NULL,
    `alamat` TEXT NOT NULL,
    `logo` VARCHAR(255) NULL,
    `jenis_usaha` VARCHAR(100) NOT NULL,
    `mata_uang` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_produk` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `deskripsi` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produk` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `kategori_id` BIGINT NOT NULL,
    `kode_produk` VARCHAR(50) NOT NULL,
    `barcode` VARCHAR(100) NULL,
    `nama` VARCHAR(150) NOT NULL,
    `harga_modal` DECIMAL(15, 2) NOT NULL,
    `harga_jual` DECIMAL(15, 2) NOT NULL,
    `stok` INTEGER NOT NULL DEFAULT 0,
    `satuan` VARCHAR(50) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `telepon` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `alamat` TEXT NOT NULL,
    `kontak_person` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pelanggan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `telepon` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `alamat` TEXT NOT NULL,
    `poin` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rekening` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `nama_rekening` VARCHAR(100) NOT NULL,
    `bank` VARCHAR(100) NOT NULL,
    `nomor_rekening` VARCHAR(100) NOT NULL,
    `atas_nama` VARCHAR(100) NOT NULL,
    `saldo_awal` DECIMAL(15, 2) NOT NULL,
    `saldo` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penjualan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `pelanggan_id` BIGINT NULL,
    `rekening_id` BIGINT NOT NULL,
    `nomor_invoice` VARCHAR(30) NOT NULL,
    `tanggal` DATETIME(0) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `diskon` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `pajak` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `biaya_lain` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(15, 2) NOT NULL,
    `metode_pembayaran` ENUM('TUNAI', 'TRANSFER', 'QRIS', 'E_WALLET') NOT NULL,
    `status` ENUM('LUNAS', 'PIUTANG', 'BATAL') NOT NULL,
    `catatan` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `penjualan_nomor_invoice_key`(`nomor_invoice`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_penjualan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `penjualan_id` BIGINT NOT NULL,
    `produk_id` BIGINT NOT NULL,
    `qty` INTEGER NOT NULL,
    `harga_modal` DECIMAL(15, 2) NOT NULL,
    `harga` DECIMAL(15, 2) NOT NULL,
    `diskon` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembelian` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `supplier_id` BIGINT NOT NULL,
    `rekening_id` BIGINT NOT NULL,
    `nomor_faktur` VARCHAR(30) NOT NULL,
    `tanggal` DATETIME(0) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `diskon` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `pajak` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `ongkir` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(15, 2) NOT NULL,
    `metode_pembayaran` ENUM('TUNAI', 'TRANSFER', 'QRIS', 'E_WALLET') NOT NULL,
    `status` ENUM('LUNAS', 'HUTANG', 'BATAL') NOT NULL,
    `catatan` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `pembelian_nomor_faktur_key`(`nomor_faktur`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_pembelian` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pembelian_id` BIGINT NOT NULL,
    `produk_id` BIGINT NOT NULL,
    `qty` INTEGER NOT NULL,
    `harga` DECIMAL(15, 2) NOT NULL,
    `harga_jual` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori_pengeluaran` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengeluaran` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `kategori_id` BIGINT NOT NULL,
    `rekening_id` BIGINT NOT NULL,
    `tanggal` DATETIME(0) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `piutang` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `penjualan_id` BIGINT NOT NULL,
    `pelanggan_id` BIGINT NOT NULL,
    `total_piutang` DECIMAL(15, 2) NOT NULL,
    `sisa_piutang` DECIMAL(15, 2) NOT NULL,
    `jatuh_tempo` DATE NOT NULL,
    `status` ENUM('BELUM_LUNAS', 'LUNAS') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `piutang_penjualan_id_key`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembayaran_piutang` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `piutang_id` BIGINT NOT NULL,
    `rekening_id` BIGINT NOT NULL,
    `tanggal` DATETIME(0) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hutang` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pembelian_id` BIGINT NOT NULL,
    `supplier_id` BIGINT NOT NULL,
    `total_hutang` DECIMAL(15, 2) NOT NULL,
    `sisa_hutang` DECIMAL(15, 2) NOT NULL,
    `jatuh_tempo` DATE NOT NULL,
    `status` ENUM('BELUM_LUNAS', 'LUNAS') NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `hutang_pembelian_id_key`(`pembelian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembayaran_hutang` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `hutang_id` BIGINT NOT NULL,
    `rekening_id` BIGINT NOT NULL,
    `tanggal` DATETIME(0) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaksi_kas` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `rekening_id` BIGINT NOT NULL,
    `referensi_tipe` ENUM('PENJUALAN', 'PENGELUARAN', 'PEMBAYARAN_PIUTANG', 'PEMBAYARAN_HUTANG', 'PENYESUAIAN') NOT NULL,
    `referensi_id` BIGINT NOT NULL,
    `nomor_referensi` VARCHAR(30) NULL,
    `jenis` ENUM('MASUK', 'KELUAR') NOT NULL,
    `tanggal` DATETIME(0) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `saldo_sebelum` DECIMAL(15, 2) NOT NULL,
    `saldo_setelah` DECIMAL(15, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `target_keuangan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `bulan` TINYINT NOT NULL,
    `tahun` SMALLINT NOT NULL,
    `target_pendapatan` DECIMAL(15, 2) NOT NULL,
    `target_pengeluaran` DECIMAL(15, 2) NOT NULL,
    `target_laba` DECIMAL(15, 2) NOT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `target_keuangan_usaha_id_bulan_tahun_key`(`usaha_id`, `bulan`, `tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usaha_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `judul` VARCHAR(150) NOT NULL,
    `pesan` TEXT NOT NULL,
    `tipe` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL,
    `status_baca` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kategori_produk` ADD CONSTRAINT `kategori_produk_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier` ADD CONSTRAINT `supplier_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pelanggan` ADD CONSTRAINT `pelanggan_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekening` ADD CONSTRAINT `rekening_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_pelanggan_id_fkey` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_rekening_id_fkey` FOREIGN KEY (`rekening_id`) REFERENCES `rekening`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_penjualan` ADD CONSTRAINT `detail_penjualan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_penjualan` ADD CONSTRAINT `detail_penjualan_produk_id_fkey` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembelian` ADD CONSTRAINT `pembelian_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembelian` ADD CONSTRAINT `pembelian_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembelian` ADD CONSTRAINT `pembelian_rekening_id_fkey` FOREIGN KEY (`rekening_id`) REFERENCES `rekening`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembelian` ADD CONSTRAINT `pembelian_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_pembelian` ADD CONSTRAINT `detail_pembelian_pembelian_id_fkey` FOREIGN KEY (`pembelian_id`) REFERENCES `pembelian`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_pembelian` ADD CONSTRAINT `detail_pembelian_produk_id_fkey` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kategori_pengeluaran` ADD CONSTRAINT `kategori_pengeluaran_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran` ADD CONSTRAINT `pengeluaran_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran` ADD CONSTRAINT `pengeluaran_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_pengeluaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran` ADD CONSTRAINT `pengeluaran_rekening_id_fkey` FOREIGN KEY (`rekening_id`) REFERENCES `rekening`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran` ADD CONSTRAINT `pengeluaran_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `piutang` ADD CONSTRAINT `piutang_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `piutang` ADD CONSTRAINT `piutang_pelanggan_id_fkey` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran_piutang` ADD CONSTRAINT `pembayaran_piutang_piutang_id_fkey` FOREIGN KEY (`piutang_id`) REFERENCES `piutang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran_piutang` ADD CONSTRAINT `pembayaran_piutang_rekening_id_fkey` FOREIGN KEY (`rekening_id`) REFERENCES `rekening`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hutang` ADD CONSTRAINT `hutang_pembelian_id_fkey` FOREIGN KEY (`pembelian_id`) REFERENCES `pembelian`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hutang` ADD CONSTRAINT `hutang_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran_hutang` ADD CONSTRAINT `pembayaran_hutang_hutang_id_fkey` FOREIGN KEY (`hutang_id`) REFERENCES `hutang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran_hutang` ADD CONSTRAINT `pembayaran_hutang_rekening_id_fkey` FOREIGN KEY (`rekening_id`) REFERENCES `rekening`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_kas` ADD CONSTRAINT `transaksi_kas_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_kas` ADD CONSTRAINT `transaksi_kas_rekening_id_fkey` FOREIGN KEY (`rekening_id`) REFERENCES `rekening`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_kas` ADD CONSTRAINT `transaksi_kas_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `target_keuangan` ADD CONSTRAINT `target_keuangan_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `target_keuangan` ADD CONSTRAINT `target_keuangan_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_usaha_id_fkey` FOREIGN KEY (`usaha_id`) REFERENCES `usaha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
