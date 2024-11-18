const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const User = require("../models/user");
const Users = require("../data/users");
const VerifyToken = require("../middleware/token");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode"); // Certifique-se de que o QRCode está instalado

const AuthRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rota de registro (não precisa de token de autenticação)
  router.route("/register").post(function (req, res, next) {
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

  // Rota de login (não precisa de token de autenticação)
  router.route("/login").post(function (req, res, next) {
    let body = req.body;
    console.log("Login for user:", body);
    return Users.findUser(body)
      .then((user) => {
        return Users.createToken(user);
      })
      .then((login) => {
        console.log("Login token:", login.token);
        res.cookie("token", login.token, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
          domain: "localhost:3000", // Atualize para o seu domínio, se necessário
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

  // Middleware de token só é aplicado a partir daqui para rotas que precisam de autenticação
 // router.use(VerifyToken);

  // Rota para obter um usuário por ID (precisa de token)
  router
    .route("/user/:id")
    .get(function (req, res, next) {
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
    .delete(function (req, res, next) {
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

  // Rota para listar todos os usuários (precisa de token)
  router.route("/users").get(function (req, res, next) {
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

  // Rota para buscar usuário por email (precisa de token)
  router.route("/user/email/:email").get(function (req, res, next) {
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

  // Rota para atualizar usuário por email (precisa de token)
  router.route("/user/update/:email").put(async function (req, res, next) {
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

  // Rota para gerar QR code (não precisa de token)
  router.route("/generate-qr").post(async (req, res) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return res
          .status(400)
          .send({ error: "Email and password are required" });
      }

      const userCredentials = JSON.stringify({ email, password });

      QRCode.toDataURL(userCredentials, (err, qrCodeUrl) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ error: "Error generating QR code" });
        }

        res.status(200).send({ qrCodeUrl });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Error processing QR Code" });
    }
  });

  // Rota para validar QR Code (não precisa de token)
  router.route("/validate-qr").post(async (req, res) => {
    const { code } = req.body;

    try {
      const credentials = JSON.parse(code);

      const { email, password } = credentials;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ error: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        config.secret,
        { expiresIn: config.expiresPassword }
      );

      res.status(200).send({ token });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Error processing QR Code" });
    }
  });

  return router;
};

module.exports = AuthRouter;
