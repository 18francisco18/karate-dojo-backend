const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const { Instructor } = require("../../models/user");
const qrCode = require("qrcode");

function InstructorService() {
  let service = {
    createInstructor,
    findAllInstructors,
    findInstructorById,
    findInstructorByEmail,
    removeInstructorById,
    updateInstructor,
    createPassword,
    comparePassword,
    verifyToken,
    createToken,
    generateQRCodeWithCredentials,
  };

  // Função para criar um novo instrutor
  async function createInstructor(instructorData) {
    try {
      const hashPassword = await createPassword(instructorData.password);
      let newInstructor = new Instructor({
        ...instructorData,
        password: hashPassword,
      });

      const result = await newInstructor.save();
      return result;
    } catch (err) {
      console.error("Error creating instructor:", err);
      return Promise.reject(`Failed to create instructor: ${err.message}`);
    }
  }

  // Buscar todos os instrutores
  async function findAllInstructors() {
    try {
      const instructors = await Instructor.find({}).populate("students");
      return instructors;
    } catch (err) {
      console.error("Error fetching instructors:", err);
      return Promise.reject("Error fetching instructors");
    }
  }

  // Buscar um instrutor pelo ID
  async function findInstructorById(id) {
    try {
      const instructor = await Instructor.findById(id).populate("students");
      if (!instructor) {
        return Promise.reject("Instructor not found");
      }
      return instructor;
    } catch (err) {
      console.error("Error fetching instructor by ID:", err);
      return Promise.reject("Error fetching instructor");
    }
  }

  // Buscar um instrutor pelo email
  async function findInstructorByEmail(email) {
    try {
      const instructor = await Instructor.findOne({ email });
      if (!instructor) {
        return Promise.reject("Instructor not found");
      }
      return instructor;
    } catch (err) {
      console.error("Error fetching instructor by email:", err);
      return Promise.reject("Error fetching instructor");
    }
  }

  // Remover um instrutor pelo ID
  async function removeInstructorById(id) {
    try {
      const instructor = await Instructor.findByIdAndDelete(id);
      if (!instructor) {
        return Promise.reject("Instructor not found");
      }
      return "Instructor successfully removed";
    } catch (err) {
      console.error("Error removing instructor:", err);
      return Promise.reject("Error removing instructor");
    }
  }

  // Atualizar um instrutor
  async function updateInstructor(id, updateData) {
    try {
      const instructor = await Instructor.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!instructor) {
        return Promise.reject("Instructor not found");
      }
      return instructor;
    } catch (err) {
      console.error("Error updating instructor:", err);
      return Promise.reject("Error updating instructor");
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
  function createToken(instructor) {
    const token = jwt.sign(
      { id: instructor._id, name: instructor.name, role: instructor.role },
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
  async function generateQRCodeWithCredentials(instructor) {
    try {
      const credentials = {
        email: instructor.email,
        password: instructor.password, // Cuidado com a exposição de senhas
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

module.exports = InstructorService();
