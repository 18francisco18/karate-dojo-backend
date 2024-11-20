require("dotenv").config();

const config = {
  db: process.env.MONGODB_URI,
  secret: process.env.JWT_SECRET,
  expiresPassword: 1718531517,
  saltRounds: parseInt(process.env.SALT_ROUNDS),
};

//password: 3xq6uz1TCCtue8lf

module.exports = config;

  