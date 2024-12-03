require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const config = require("./config");
const http = require("http");

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Importa o cron job para rodar automaticamente
require("./jobs/cronJobs"); // Importa o arquivo de jobs com o cron

// Middleware para analisar JSON
app.use(express.json());
// Middleware para habilitar CORS
app.use(cors(corsOptions));
// Middleware para analisar cookies
app.use(cookieParser());

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
};

const RecoverPassword = require("./server/password");

// MongoDB connection with retry logic
const connectWithRetry = () => {
  mongoose
    .connect(config.db, mongooseOptions)
    .then(() => {
      console.log("MongoDB Connection successful!");
      
      // Add password recovery routes
      app.use("/", RecoverPassword());
      
      let router = require("./router");
      app.use(router.init());
    })
    .catch((err) => {
      console.error("MongoDB connection error FULL:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

const hostname = process.env.HOST;
const port = process.env.PORT || 5000;

const server = http.Server(app);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Inicie o servidor
server.listen(port, () => {
  console.log(`Server is running at http://${hostname}:${port}`);
});
