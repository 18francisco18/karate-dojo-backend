const Users = require("../data/users");

function verifyTokenMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers["authorization"];

  if (!token) {
    return res.status(401).send({ auth: false, message: "No token provided." });
  }

  // Se o token estiver no formato Bearer <token>, separa o token da palavra 'Bearer'
  const bearerToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

  Users.verifyToken(bearerToken)
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
