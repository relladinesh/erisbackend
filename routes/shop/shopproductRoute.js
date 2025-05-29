const express = require('express');
const { getFilteredProducts, getLimitedProducts, getProductDetails } = require("../../controllers/shop/Product-controller");

const router = express.Router();

router.get("/get", getFilteredProducts);
router.get("/get/limited", getLimitedProducts); // New route for limited products
router.get("/get/:id", getProductDetails);

module.exports = router;