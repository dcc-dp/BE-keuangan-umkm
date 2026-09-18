const prisma = require("../config/database");

async function setupRoles() {
    try {
        console.log("=================================");
        console.log("SETUP ROLE UMKM FINANCE");
        console.log("=================================");

        // ========================================
        // 1. Buat / cek role OWNER
        // ========================================
        let ownerRole = await prisma.role.findFirst({
            where: {
                nama: "OWNER",
            },
        });

        if (!ownerRole) {
            ownerRole = await prisma.role.create({
                data: {
                    nama: "OWNER",
                    deskripsi: "Pemilik usaha dengan akses penuh",
                },
            });

            console.log("✓ Role OWNER berhasil dibuat");
        } else {
            console.log("✓ Role OWNER sudah tersedia");
        }

        // ========================================
        // 2. Buat / cek role ADMIN
        // ========================================
        let adminRole = await prisma.role.findFirst({
            where: {
                nama: "ADMIN",
            },
        });

        if (!adminRole) {
            adminRole = await prisma.role.create({
                data: {
                    nama: "ADMIN",
                    deskripsi: "Admin yang mengelola operasional usaha",
                },
            });

            console.log("✓ Role ADMIN berhasil dibuat");
        } else {
            console.log("✓ Role ADMIN sudah tersedia");
        }

        // ========================================
        // 3. Buat / cek role KASIR
        // ========================================
        let kasirRole = await prisma.role.findFirst({
            where: {
                nama: "KASIR",
            },
        });

        if (!kasirRole) {
            kasirRole = await prisma.role.create({
                data: {
                    nama: "KASIR",
                    deskripsi: "Kasir yang menangani transaksi penjualan",
                },
            });

            console.log("✓ Role KASIR berhasil dibuat");
        } else {
            console.log("✓ Role KASIR sudah tersedia");
        }

        // ========================================
        // 4. Cari user owner
        // ========================================
        const ownerUser = await prisma.user.findFirst({
            where: {
                username: "owner",
            },
        });

        if (!ownerUser) {
            console.log("✗ User owner tidak ditemukan");
            return;
        }

        console.log(`✓ User owner ditemukan dengan ID: ${ownerUser.id}`);

        // ========================================
        // 5. Cek apakah owner sudah memiliki role
        // ========================================
        const existingUserRole = await prisma.userRole.findFirst({
            where: {
                user_id: ownerUser.id,
                role_id: ownerRole.id,
            },
        });

        if (!existingUserRole) {
            await prisma.userRole.create({
                data: {
                    user_id: ownerUser.id,
                    role_id: ownerRole.id,
                },
            });

            console.log("✓ Role OWNER diberikan kepada user owner");
        } else {
            console.log("✓ User owner sudah memiliki role OWNER");
        }

        console.log("=================================");
        console.log("SETUP ROLE SELESAI");
        console.log("=================================");

    } catch (error) {
        console.error("✗ SETUP ROLE ERROR:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

setupRoles();