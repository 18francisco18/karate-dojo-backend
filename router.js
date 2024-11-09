const express = require("express");
let AuthAPI = require("./server/auth");
let InstructorApi = require("./server/instructor");
let PasswordAPI = require("./server/password");
let StudentAPI = require("./server/student");

function init() {
  let api = express();

  api.use("/auth", AuthAPI());
  api.use("/instructor", InstructorApi());
  api.use("/password", PasswordAPI());
  api.use("/student", StudentAPI());

  return api;
}

module.exports = {
  init: init,
};
