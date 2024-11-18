const StudentController = require("./controller");
const controller = StudentController(Student);
const service = StudentService(Student);

module.exports = controller, service;