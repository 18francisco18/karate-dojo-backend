const Users = require("../../models/user");
const UsersService = require("./service");
const service = UsersService(Users);

module.exports = service;
