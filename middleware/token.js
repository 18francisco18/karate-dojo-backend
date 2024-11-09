const Users = require("../data/users");
const User = require("../models/user");

function verifyTokenMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers["authorization"];

  // Verifica se o token foi fornecido
  if (!token) {
    return res.status(401).send({ auth: false, message: "No token provided." });
  }

  // Remove a lógica que verifica e remove a palavra 'Bearer '
  const bearerToken = token;

  Users.verifyToken(bearerToken)
    .then((decoded) => {
      req.roleUser = decoded.role;
      next(); // Chama o próximo middleware apenas se o token for válido
    })
    .catch((err) => {
      console.error("Token verification failed:", err);
      if (!res.headersSent) {
        // Apenas envia a resposta se nenhuma outra resposta tiver sido enviada
        return res.status(401).send({ auth: false, message: "Not authorized" });
      }
    });
}

module.exports = verifyTokenMiddleware;
