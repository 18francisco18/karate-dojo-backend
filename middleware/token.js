const Users = require("../data/users");

function verifyTokenMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers["authorization"];

  if (!token) {
    return res.status(401).send({ auth: false, message: "No token provided." });
  }

  Users.verifyToken(token)
    .then((decoded) => {
      console.log("Decoded Token:", decoded); // Para fins de depuração
      req.user = decoded; // Armazene o payload decodificado no objeto req

      next(); // Chama o próximo middleware ou a rota
    })
    .catch((err) => {
      console.error("Token verification failed:", err);
      return res.status(401).send({ auth: false, message: "Not authorized" });
    });
}

module.exports = verifyTokenMiddleware;
