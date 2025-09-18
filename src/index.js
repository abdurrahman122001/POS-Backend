const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const safeDropInRoutes = require("./routes/safeDropInRoutes");
const saleRoutes = require("./routes/saleRoutes");
const subcategoryRoutes = require("./routes/subcategories");
const tenderRoutes = require("./routes/tenderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const cashRoutes = require("./routes/cashRoutes");

app.use("/api/admins", adminRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/products", productRoutes);
app.use('/api/categories', categoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/safe-drop-ins", safeDropInRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/tender-denoms", tenderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/cash", cashRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
