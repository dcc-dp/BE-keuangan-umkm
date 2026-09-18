const express = require("express");

const {
    createSupplier,
    getAllSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
} = require("../controllers/supplier.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();


// CREATE
router.post(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    createSupplier
);


// GET ALL
router.get(
    "/",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getAllSupplier
);


// GET BY ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    getSupplierById
);


// UPDATE
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    updateSupplier
);


// DELETE
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("OWNER", "ADMIN"),
    deleteSupplier
);


module.exports = router;