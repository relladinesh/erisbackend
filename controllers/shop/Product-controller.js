const Product = require("../../models/Products");

const getFilteredProducts = async (req, res) => {
  try {
    const { category = [], color = [], sortBy = "price-lowtohigh" } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (color.length) {
      filters.color = { $in: color.split(",") };
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.salePrice = 1;  // Changed from price to salePrice
        break;
      case "price-hightolow":
        sort.salePrice = -1;  // Changed from price to salePrice
        break;
      case "title-atoz":
        sort.productName = 1;  // Also fixed this to match schema (productName instead of title)
        break;
      case "title-ztoa":
        sort.productName = -1;  // Also fixed this to match schema (productName instead of title)
        break;
      default:
        sort.salePrice = 1;  // Changed from price to salePrice
        break;
    }

    const products = await Product.find(filters).sort(sort);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const getLimitedProducts = async (req, res) => {
  try {
    const { category = [], color = [], sortBy = "price-lowtohigh", limit = 5 } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (color.length) {
      filters.color = { $in: color.split(",") };
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.salePrice = 1;
        break;
      case "price-hightolow":
        sort.salePrice = -1;
        break;
      case "title-atoz":
        sort.productName = 1;
        break;
      case "title-ztoa":
        sort.productName = -1;
        break;
      default:
        sort.salePrice = 1;
        break;
    }

    const products = await Product.find(filters).sort(sort).limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

module.exports = { getFilteredProducts, getLimitedProducts, getProductDetails };