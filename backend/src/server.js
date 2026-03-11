require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db"); // thêm dòng này

const PORT = process.env.PORT || 5000;

// connect database
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});