const express = require("express");
let AuthAPI = require("./server/auth");
let InstructorApi = require("./server/instructor");

function init() {
  let api = express();

  api.use("/auth", AuthAPI());
  api.use("/instructor", InstructorApi());

  return api;
}

module.exports = {
  init: init,
};
