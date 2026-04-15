const express = require("express");
const dotenv = require("dotenv").config();
const app = express();

const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const { initialiseDB } = require("./db/db.connect");

const authRouter = require("./routes/auth");
const resumeRouter = require("./routes/resume");
const resumeAiRouter = require("./routes/resume-ai");

app.use("/", authRouter);
app.use("/", resumeRouter);
app.use("/", resumeAiRouter);

initialiseDB();

app.get("/", (req, res) => {
  res.send("Resume generator backend");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log("Server is running on", PORT));
