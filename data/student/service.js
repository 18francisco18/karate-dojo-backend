const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const qrCode = require("qrcode");
const { Student } = require("../../models/user");
const config = require("../../config");

function StudentService() {
  const service = {
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
    updatePassword
  };

  async function validateStudentData(studentData) {
    const errors = [];
    
    if (!studentData.name || studentData.name.trim().length < 3) {
      errors.push("Nome deve ter pelo menos 3 caracteres");
    }
    
    if (!studentData.email || !studentData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push("Email inválido");
    }
    
    if (!studentData.password || studentData.password.length < 6) {
      errors.push("Senha deve ter pelo menos 6 caracteres");
    }
    
    if (!studentData.belt) {
      errors.push("Faixa é obrigatória");
    }
    
    return errors;
  }

  async function createStudent(studentData) {
    try {
      // Validação dos dados
      const validationErrors = await validateStudentData(studentData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Verifica se já existe um estudante com o mesmo email
      const existingStudent = await Student.findOne({ email: studentData.email });
      if (existingStudent) {
        throw new Error("Email já está em uso");
      }

      const hashPassword = await createPassword(studentData.password);
      const newStudent = new Student({
        ...studentData,
        password: hashPassword,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await newStudent.save();
      return result;
    } catch (err) {
      console.error("Erro ao criar estudante:", err);
      throw err;
    }
  }

  async function findAllStudents() {
    try {
      const students = await Student.find({ active: true })
        .select("-password")
        .populate("instructor")
        .populate("monthlyFee")
        .populate("monthlyPlan")
        .populate("graduation");
      return students;
    } catch (err) {
      console.error("Erro ao buscar estudantes:", err);
      throw new Error("Erro ao buscar estudantes");
    }
  }

  async function findStudentById(id) {
    try {
      const student = await Student.findOne({ _id: id, active: true })
        .select("-password")
        .populate("instructor")
        .populate("monthlyFee")
        .populate("monthlyPlan")
        .populate("graduation");
      return student;
    } catch (err) {
      console.error("Erro ao buscar estudante:", err);
      throw new Error("Erro ao buscar estudante");
    }
  }

  async function findStudentByEmail(email) {
    try {
      return await Student.findOne({ email, active: true })
        .populate("instructor")
        .populate("monthlyFee")
        .populate("monthlyPlan")
        .populate("graduation");
    } catch (err) {
      console.error("Erro ao buscar estudante por email:", err);
      throw new Error("Erro ao buscar estudante");
    }
  }

  async function removeStudentById(id) {
    try {
      // Hard delete - remove o estudante completamente
      const result = await Student.findByIdAndDelete(id);
      if (!result) {
        throw new Error("Estudante não encontrado");
      }
      return "Estudante removido com sucesso";
    } catch (err) {
      console.error("Erro ao remover estudante:", err);
      throw new Error("Erro ao remover estudante");
    }
  }

  async function updateStudent(id, updateData) {
    try {
      if (updateData.password) {
        updateData.password = await createPassword(updateData.password);
      }
      
      updateData.updatedAt = new Date();
      
      const student = await Student.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
      .select("-password")
      .populate("instructor")
      .populate("monthlyFee")
      .populate("monthlyPlan")
      .populate("graduation");
      
      if (!student) {
        throw new Error("Estudante não encontrado");
      }
      
      return student;
    } catch (err) {
      console.error("Erro ao atualizar estudante:", err);
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

  function createToken(student) {
    return jwt.sign(
      { 
        id: student._id,
        email: student.email,
        role: "student" 
      },
      config.secret,
      { 
        expiresIn: "1d" 
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

  async function generateQRCodeWithCredentials(student) {
    try {
      const data = {
        id: student._id,
        name: student.name,
        email: student.email,
        belt: student.belt
      };
      return await qrCode.toDataURL(JSON.stringify(data));
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
      throw new Error("Erro ao gerar QR Code");
    }
  }

  async function addMonthlyFee(studentId, feeData) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error("Estudante não encontrado");
      }
      
      student.monthlyFee.push(feeData);
      student.updatedAt = new Date();
      
      await student.save();
      return student;
    } catch (err) {
      console.error("Erro ao adicionar mensalidade:", err);
      throw err;
    }
  }

  async function updatePassword(studentId, newHashedPassword) {
    try {
      console.log("Updating student password for ID:", studentId);
      const student = await findStudentById(studentId);
      
      if (!student) {
        console.error('Estudante não encontrado:', studentId);
        throw new Error('Estudante não encontrado');
      }

      console.log("Student found, updating password");
      student.password = newHashedPassword;
      const updatedStudent = await student.save();

      console.log("Password updated successfully for student:", updatedStudent._id);
      return updatedStudent;
    } catch (error) {
      console.error('Erro ao atualizar senha do estudante:', {
        studentId,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  service.updatePassword = updatePassword;

  return service;
}

module.exports = StudentService();
