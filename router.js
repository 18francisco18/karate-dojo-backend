const express = require("express");
let InstructorApi = require("./server/instructor");
let PasswordAPI = require("./server/password");
let StudentAPI = require("./server/student");
let GraduationAPI = require("./server/graduation");
let AuthInstructor = require("./server/authInstructor");
let AuthStudent = require("./server/authStudent");
let ProfileImageAPI = require("./routes/profileImage");

function init() {
  let api = express();

  api.use("/instructor", InstructorApi());
  api.use("/password", PasswordAPI());
  api.use("/student", StudentAPI());
  api.use("/graduation", GraduationAPI());
  api.use("/authInstructor", AuthInstructor());
  api.use("/authStudent", AuthStudent());
  api.use("/profile-image", ProfileImageAPI);

  return api;
}

module.exports = {
  init: init,
};
