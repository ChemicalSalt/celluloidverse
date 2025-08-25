const express = require("express");
const cors = require("cors");
const statusRoute = require("./routes/status");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/status", statusRoute);

const PORT = process.env.PORT || 5000;
app.get("/", (_req, res) => res.send("Backend is running!"));
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
