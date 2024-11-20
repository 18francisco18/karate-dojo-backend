const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const { Instructor } = require("../../models/user");
const qrCode = require("qrcode");
const scopes = require("../../data/users/scopes");

function InstructorService() {
  const service = {
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

  async function validateInstructorData(instructorData) {
    const errors = [];

    if (!instructorData.name || instructorData.name.trim().length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }

    if (
      !instructorData.email ||
      !instructorData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ) {
      errors.push("Email inválido");
    }

    if (!instructorData.password || instructorData.password.length < 8) {
      errors.push("Senha deve ter pelo menos 8 caracteres");
    }

    return errors;
  }

  async function createInstructor(instructorData) {
    try {
      // Validação dos dados
      const validationErrors = await validateInstructorData(instructorData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Verifica se já existe um instrutor com o mesmo email
      const existingInstructor = await Instructor.findOne({
        email: instructorData.email,
      });
      if (existingInstructor) {
        throw new Error("Email já está em uso");
      }

      const hashPassword = await createPassword(instructorData.password);
      const newInstructor = new Instructor({
        name: instructorData.name,
        email: instructorData.email,
        password: hashPassword,
        active: true,
        students: []
      });

      const result = await newInstructor.save();

      // Remove sensitive data before returning
      const instructorResponse = result.toObject();
      delete instructorResponse.password;
      delete instructorResponse.passwordResetToken;
      delete instructorResponse.passwordResetExpires;

      return instructorResponse;
    } catch (err) {
      console.error("Erro ao criar instrutor:", err);
      throw err;
    }
  }

  async function findAllInstructors() {
    try {
      const instructors = await Instructor.find({ active: true })
        .select("-password -passwordResetToken -passwordResetExpires")
        .populate("students");
      return instructors;
    } catch (err) {
      console.error("Erro ao buscar instrutores:", err);
      throw new Error("Erro ao buscar instrutores");
    }
  }

  async function findInstructorById(id) {
    try {
      const instructor = await Instructor.findOne({ _id: id, active: true })
        .select("-password -passwordResetToken -passwordResetExpires")
        .populate("students");
      if (!instructor) {
        throw new Error("Instrutor não encontrado");
      }
      return instructor;
    } catch (err) {
      console.error("Erro ao buscar instrutor:", err);
      throw err;
    }
  }

  async function findInstructorByEmail(email) {
    try {
      return await Instructor.findOne({ email, active: true })
        .populate("students");
    } catch (err) {
      console.error("Erro ao buscar instrutor por email:", err);
      throw new Error("Erro ao buscar instrutor");
    }
  }

  async function removeInstructorById(id) {
    try {
      // Soft delete - apenas marca como inativo
      await Instructor.findByIdAndUpdate(id, {
        active: false,
        updatedAt: new Date(),
      });
      return "Instrutor removido com sucesso";
    } catch (err) {
      console.error("Erro ao remover instrutor:", err);
      throw new Error("Erro ao remover instrutor");
    }
  }

  async function updateInstructor(id, updateData) {
    try {
      if (updateData.password) {
        updateData.password = await createPassword(updateData.password);
      }

      updateData.updatedAt = new Date();

      const instructor = await Instructor.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .select("-password -passwordResetToken -passwordResetExpires")
        .populate("students");

      if (!instructor) {
        throw new Error("Instrutor não encontrado");
      }

      return instructor;
    } catch (err) {
      console.error("Erro ao atualizar instrutor:", err);
      throw err;
    }
  }

  async function createPassword(password) {
    const salt = await bcrypt.genSalt(config.saltRounds || 10);
    return bcrypt.hash(password, salt);
  }

  async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  function createToken(instructor) {
    return jwt.sign(
      {
        id: instructor._id,
        email: instructor.email,
        role: scopes.Admin,
      },
      config.secret,
      {
        expiresIn: "1d",
      }
    );
  }

  async function verifyToken(token) {
    try {
      return jwt.verify(token, config.secret);
    } catch (err) {
      console.error("Erro ao verificar token:", err);
      throw new Error("Token inválido ou expirado");
    }
  }

  async function generateQRCodeWithCredentials(instructor) {
    try {
      const data = {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email,
      };
      return await qrCode.toDataURL(JSON.stringify(data));
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
      throw new Error("Erro ao gerar QR Code");
    }
  }

  return service;
}

module.exports = InstructorService();
