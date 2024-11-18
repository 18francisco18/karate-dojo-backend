const StudentController = require("./controller");
const StudentService = require("./service");
const controller = StudentController(Student);
const service = StudentService(Student);

module.exports = controller, service;