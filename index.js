const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const config = require("./config");
const http = require("http");

const app = express();

const corsOptions = {
  origin: "http://localhost:3000", // Altere para a porta 3000, onde o frontend está rodando
  credentials: true, // Permite o envio de cookies e headers de autenticação
};

// Middleware para analisar JSON
app.use(express.json());
// Middleware para habilitar CORS
app.use(cors(corsOptions));
// Middleware para analisar cookies
app.use(cookieParser());

mongoose
  .connect(config.db)
  .then(() => console.log("Connection successful!"))
  .catch((err) => console.error(err));

let router = require("./router");
app.use(router.init());

const hostname = "127.0.0.1";
const port = 5000;

const server = http.Server(app);

// Inicie o servidor
server.listen(port, () => {
  console.log(`Server is running at http://${hostname}:${port}`);
});
