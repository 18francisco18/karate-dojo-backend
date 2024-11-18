const InstructorController = require("./controller");
const controller = InstructorController(Instructor);
const service = InstructorService(Instructor);

module.exports = controller, service;
