const express = require("express");
const mongoose = require("mongoose");

const app = express();
const hostname = "127.0.0.1"
const port = 5000;
const config = require("./config");

mongoose
  .connect(config.db)
  .then(() => console.log("Connection successful!"))
  .catch((err) => console.error(err));

// Middleware para analisar JSON
app.use(express.json());

// Inicie o servidor
app.listen(port, () => {
  console.log(`Server is running at http://${hostname}:${port}`);
});
