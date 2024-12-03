require("dotenv").config();

const config = {
  db: process.env.MONGODB_URI,
  secret: process.env.JWT_SECRET,
  expiresPassword: 1718531517,
  saltRounds: parseInt(process.env.SALT_ROUNDS),
};

module.exports = config;