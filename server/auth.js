const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const User = require("../models/user");
const Users = require("../data/users");
const VerifyToken = require("../middleware/token");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AuthRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router
    .route("/register")
    // Create a user (FUNCIONA)
    .post(function (req, res, next) {
      const body = req.body;
      console.log("User:", body);
      Users.create(body)
        .then(() => Users.createToken(body))
        .then((response) => {
          console.log("User token:", response);
          res.status(200).send(response);
        })
        .catch((err) => {
          console.log("Error:", err);
          res.status(500).send(err);
          next();
        });
    });

  router
    .route("/login")
    // (FUNCIONA)
    .post(function (req, res, next) {
      let body = req.body;
      console.log("Login for user:", body);
      return Users.findUser(User, body)
        .then((user) => {
          return Users.createToken(user);
        })
        .then((login) => {
          console.log("Login token:", login.token);
          res.cookie("token", login.token, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            domain: "localhost:3000",
          });
          res.status(200);
          res.send({
            token: login.token,
            userId: login.userId,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500);
          res.send(err);
          next();
        });
    });

  //  router.route("/me").get(VerifyToken, function (req, res, next) {
  //    const token = req.cookies.token || req.headers["authorization"];
  //    jwt.verify(token, config.secret, function (err, decoded) {
  //      if (err) {
  //        return res
  //          .status(500)
  //          .send({ auth: false, message: "Failed to authenticate token." });
  //      }
  //      res.status(200).send(decoded);
  //    });
  //  });

  router
    .route("/user/:id")
    // (FUNCIONA)
    .get(VerifyToken, function (req, res, next) {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).send({ error: "User ID is required" });
      }
      User.findById(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }
          res.status(200).send(user);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send({ error: "An error occurred" });
        });
    })
    // DELETE user by ID
    .delete(VerifyToken, function (req, res, next) {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).send({ error: "User ID is required" });
      }
      User.findByIdAndDelete(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }
          res.status(200).send({ message: "User successfully deleted" });
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .send({ error: "An error occurred while deleting the user" });
        });
    });

  router
    .route("/users")
    // GET - All users
    .get(VerifyToken, function (req, res, next) {
      User.find({})
        .then((users) => {
          if (!users || users.length === 0) {
            return res.status(404).send({ error: "No users found" });
          }
          res.status(200).send(users);
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .send({ error: "An error occurred while fetching users" });
        });
    });

  router
    .route("/user/email/:email")
    // GET - Buscar usuário por email
    .get(VerifyToken, function (req, res, next) {
      const userEmail = req.params.email;
      if (!userEmail) {
        return res.status(400).send({ error: "User email is required" });
      }

      User.findOne({ email: userEmail })
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }
          res.status(200).send(user);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send({ error: "An error occurred" });
        });
    });

  router
    // PUT - Atualizar usuário por email
    .route("/user/update/:email")
    .put(VerifyToken, async function (req, res, next) {
      const userEmail = req.params.email;
      const { name, username } = req.body;
      if (!userEmail) {
        return res.status(400).send({ error: "User email is required" });
      }
      try {
        const updateData = {};
        if (name) updateData.name = name;
        if (username) updateData.username = username;
        const user = await User.findOneAndUpdate(
          { email: userEmail },
          { $set: updateData },
          { new: true }
        );
        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }
        res.status(200).send(user);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "An error occurred" });
      }
    });

  router.route("/generate-qr").post(async (req, res) => {
    const { email, password } = req.body; // Espera-se que o frontend envie o email e a senha do usuário

    try {
      // Validar email e senha
      if (!email || !password) {
        return res
          .status(400)
          .send({ error: "Email and password are required" });
      }

      // Criar um objeto JSON com as credenciais do usuário
      const userCredentials = JSON.stringify({ email, password });

      // Gerar o QR Code a partir do JSON
      QRCode.toDataURL(userCredentials, (err, qrCodeUrl) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ error: "Error generating QR code" });
        }

        // Retornar o QR Code gerado como uma URL de imagem
        res.status(200).send({ qrCodeUrl });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Error processing QR Code" });
    }
  });

  router.route("/validate-qr").post(async (req, res) => {
    const { code } = req.body; // O QR Code que foi escaneado e enviado pelo frontend

    try {
      // Decodificar o QR Code (assumindo que o QR Code contenha um JSON com email e senha)
      const credentials = JSON.parse(code); // O QR Code contém as credenciais do usuário em formato JSON

      const { email, password } = credentials;

      // Encontrar o usuário pelo email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      // Comparar a senha enviada com a armazenada no banco de dados
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ error: "Invalid password" });
      }

      // Criar um token JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        config.secret,
        { expiresIn: config.expiresPassword }
      );

      // Retornar o token
      res.status(200).send({ token });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Error processing QR Code" });
    }
  });

  router.use(VerifyToken);

  return router;
};

module.exports = AuthRouter;
