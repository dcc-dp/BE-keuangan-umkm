const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

// ========================================
// REGISTER
// ========================================
const register = async (req, res) => {
    try {
        const {
            nama,
            username,
            email,
            no_hp,
            password,
        } = req.body;

        // Validasi field wajib
        if (!nama || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nama, username, email, dan password wajib diisi",
            });
        }

        // Cek apakah username sudah digunakan
        const usernameExists = await prisma.user.findFirst({
            where: {
                username: username,
            },
        });

        if (usernameExists) {
            return res.status(400).json({
                success: false,
                message: "Username sudah digunakan",
            });
        }

        // Cek apakah email sudah digunakan
        const emailExists = await prisma.user.findFirst({
            where: {
                email: email,
            },
        });

        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: "Email sudah digunakan",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan user
        const user = await prisma.user.create({
            data: {
                nama: nama,
                username: username,
                email: email,
                no_hp: no_hp || null,
                password: hashedPassword,
                status: "ACTIVE",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Registrasi berhasil",
            data: {
                id: user.id.toString(),
                nama: user.nama,
                username: user.username,
                email: user.email,
                no_hp: user.no_hp,
                status: user.status,
            },
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


// ========================================
// LOGIN
// ========================================
const login = async (req, res) => {
    try {
        const {
            username,
            password,
        } = req.body;

        // Validasi
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username dan password wajib diisi",
            });
        }

        // Cari user berdasarkan username
        // Menggunakan findFirst karena username belum @unique
        const user = await prisma.user.findFirst({
            where: {
                username: username,
            },
            include: {
                user_roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        // User tidak ditemukan
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah",
            });
        }

        // Cek status akun
        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Akun tidak aktif",
            });
        }

        // Cek password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah",
            });
        }

        // Ambil semua role user
        const roles = user.user_roles.map(
            (userRole) => userRole.role.nama
        );

        // ID BigInt harus diubah menjadi string
        const userId = user.id.toString();

        // Buat JWT
        const token = jwt.sign(
            {
                userId: userId,
                username: user.username,
                roles: roles,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        // Update waktu login terakhir
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                last_login: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: {
                token: token,
                user: {
                    id: userId,
                    nama: user.nama,
                    username: user.username,
                    email: user.email,
                    no_hp: user.no_hp,
                    status: user.status,
                    roles: roles,
                },
            },
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};


module.exports = {
    register,
    login,
};