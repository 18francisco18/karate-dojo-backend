const Users = require("../data/users");

function verifyTokenMiddleware(requiredRole = null) {
  return async (req, res, next) => {
    const token =
      req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .send({ auth: false, message: "No token provided." });
    }

    try {
      const decoded = await Users.verifyToken(token);
      console.log("Decoded Token:", decoded); // Log para depuração

      // Verificar se o token contém o campo 'id'
      if (!decoded.id) {
        return res
          .status(401)
          .send({ auth: false, message: "Token inválido: ID ausente." });
      }

      // Atribuir o 'id' ao objeto req (garantindo que seja acessado como req.userId)
      req.userId = decoded.id;
      req.userRole = decoded.role; // Para controle de acesso baseado em funções

      // Verificar o *scope* do usuário se necessário
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).send({ auth: false, message: "Access denied." });
      }

      next(); // Passar o controle para a próxima função ou rota
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).send({ auth: false, message: "Not authorized" });
    }
  };
}

module.exports = verifyTokenMiddleware;
