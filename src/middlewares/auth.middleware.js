const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Ambil header Authorization
        const authHeader = req.headers.authorization;

        // Cek apakah token dikirim
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token tidak ditemukan",
            });
        }

        // Format yang benar:
        // Authorization: Bearer TOKEN
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Format token tidak valid",
            });
        }

        const token = parts[1];

        // Verifikasi token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Simpan data user dari token ke request
        req.user = decoded;

        // Lanjut ke controller
        next();

    } catch (error) {
        console.error("AUTH MIDDLEWARE ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah expired",
        });
    }
};

module.exports = authMiddleware;