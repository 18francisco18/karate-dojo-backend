const InstructorController = require("./controller");
const InstructorService = require("./service");
const controller = InstructorController(Instructor);
const service = InstructorService(Instructor);

module.exports = controller, service;
