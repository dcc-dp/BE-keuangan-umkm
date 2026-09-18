const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Pastikan user sudah melewati authMiddleware
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User belum terautentikasi",
                });
            }

            // Ambil role user dari JWT
            const userRoles = req.user.roles || [];

            // Cek apakah user memiliki salah satu role yang diizinkan
            const hasPermission = userRoles.some((role) =>
                allowedRoles.includes(role)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: "Anda tidak memiliki izin untuk mengakses endpoint ini",
                });
            }

            next();

        } catch (error) {
            console.error("ROLE MIDDLEWARE ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada pengecekan role",
            });
        }
    };
};

module.exports = roleMiddleware;