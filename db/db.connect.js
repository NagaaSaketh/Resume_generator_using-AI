const mongoose = require("mongoose");

const mongo = process.env.MONGO;

const initialiseDB = async () => {
  await mongoose
    .connect(mongo)
    .then(() => console.log("Database connected successfully!"))
    .catch((err) => console.log("DB connection failed!", err));
};

module.exports = { initialiseDB };
