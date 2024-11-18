const express = require("express");
let AuthAPI = require("./server/auth");
let InstructorApi = require("./server/instructor");
let PasswordAPI = require("./server/password");
let StudentAPI = require("./server/student");
let GraduationAPI = require("./server/graduation");
let AuthInstructor = require("./server/authInstructor");

function init() {
  let api = express();

  api.use("/auth", AuthAPI());
  api.use("/instructor", InstructorApi());
  api.use("/password", PasswordAPI());
  api.use("/student", StudentAPI());
  api.use("/graduation", GraduationAPI());
  api.use("/authInstructor", AuthInstructor());

  return api;
}

module.exports = {
  init: init,
};
