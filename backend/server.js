const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const statusRoute = require("./routes/status");
app.use("/api/status", statusRoute);

const PORT = process.env.PORT || 5000;

// Example route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

