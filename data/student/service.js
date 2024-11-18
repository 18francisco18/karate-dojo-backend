const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const qrCode = require("qrcode");
const { Student } = require("../../models/student"); // Certifique-se de que o caminho esteja correto
const config = require("../../config");

function StudentService() {
  let service = {
    createStudent,
    findAllStudents,
    findStudentById,
    findStudentByEmail,
    removeStudentById,
    updateStudent,
    addMonthlyFee,
    createPassword,
    comparePassword,
    createToken,
    verifyToken,
    generateQRCodeWithCredentials,
  };

  // Função para criar um novo estudante
  async function createStudent(studentData) {
    try {
      const hashPassword = await createPassword(studentData.password);
      let newStudent = new Student({
        ...studentData,
        password: hashPassword,
      });

      const result = await newStudent.save();
      return result;
    } catch (err) {
      console.error("Error creating student:", err);
      return Promise.reject(`Failed to create student: ${err.message}`);
    }
  }

  // Buscar todos os estudantes
  async function findAllStudents() {
    try {
      const students = await Student.find({})
        .populate("instructor")
        .populate("monthlyFee")
        .populate("monthlyPlan")
        .populate("graduation");
      return students;
    } catch (err) {
      console.error("Error fetching students:", err);
      return Promise.reject("Error fetching students");
    }
  }

  // Buscar um estudante pelo ID
  async function findStudentById(id) {
    try {
      const student = await Student.findById(id)
        .populate("instructor")
        .populate("monthlyFee")
        .populate("monthlyPlan")
        .populate("graduation");
      if (!student) {
        return Promise.reject("Student not found");
      }
      return student;
    } catch (err) {
      console.error("Error fetching student by ID:", err);
      return Promise.reject("Error fetching student");
    }
  }

  // Buscar um estudante pelo email
  async function findStudentByEmail(email) {
    try {
      const student = await Student.findOne({ email });
      if (!student) {
        return Promise.reject("Student not found");
      }
      return student;
    } catch (err) {
      console.error("Error fetching student by email:", err);
      return Promise.reject("Error fetching student");
    }
  }

  // Remover um estudante pelo ID
  async function removeStudentById(id) {
    try {
      const student = await Student.findByIdAndDelete(id);
      if (!student) {
        return Promise.reject("Student not found");
      }
      return "Student successfully removed";
    } catch (err) {
      console.error("Error removing student:", err);
      return Promise.reject("Error removing student");
    }
  }

  // Atualizar um estudante
  async function updateStudent(id, updateData) {
    try {
      const student = await Student.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!student) {
        return Promise.reject("Student not found");
      }
      return student;
    } catch (err) {
      console.error("Error updating student:", err);
      return Promise.reject("Error updating student");
    }
  }

  // Adicionar uma mensalidade a um estudante
  async function addMonthlyFee(studentId, monthlyFeeId) {
    try {
      const student = await findStudentById(studentId);
      if (!student) {
        return Promise.reject("Student not found");
      }
      student.monthlyFee.push(monthlyFeeId);
      await student.save();
      return student;
    } catch (err) {
      console.error("Error adding monthly fee:", err);
      return Promise.reject("Error adding monthly fee");
    }
  }

  // Função para criar um hash da senha
  function createPassword(password) {
    return bcrypt.hash(password, config.saltRounds);
  }

  // Função para comparar senhas
  function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Função para criar um token JWT
  function createToken(student) {
    const token = jwt.sign(
      { id: student._id, name: student.name, role: student.role },
      config.secret,
      { expiresIn: config.expiresPassword }
    );
    return { auth: true, token };
  }

  // Verificar um token JWT
  async function verifyToken(token) {
    try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, config.secret, (err, decoded) => {
          if (err) reject(err);
          resolve(decoded);
        });
      });
      return decoded;
    } catch (err) {
      console.error("Error verifying token:", err);
      throw err;
    }
  }

  // Gerar QR Code com credenciais
  async function generateQRCodeWithCredentials(student) {
    try {
      const credentials = {
        email: student.email,
        password: student.password, // Cuidado com a exposição de senhas
      };
      const dataString = JSON.stringify(credentials);
      const qrCodeDataUrl = await qrCode.toDataURL(dataString);
      return qrCodeDataUrl;
    } catch (err) {
      console.error("Error generating QR code:", err);
      throw new Error("Unable to generate QR code");
    }
  }

  return service;
}

module.exports = StudentService;
