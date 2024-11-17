const { Instructor, Student } = require("../../models/user");
const mongoose = require("mongoose");

const InstructorController = {
  getInstructors,
  addStudentToInstructor,
  removeStudentFromInstructor,
  getStudentsByInstructor,
  getStudentsByInstructorEmail,
};

async function getInstructors() {
  try {
    const instructors = await Instructor.find({ role: "Admin" });
    return instructors;
  } catch (error) {
    throw new Error("Erro ao obter instrutores: " + error.message);
  }
}

async function addStudentToInstructor(adminId, studentId) {
  try {
    // Procurar o administrador (instrutor)
    const admin = await Instructor.findById(adminId).populate("students");
    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    // Verificar se o administrador tem o papel de Admin
    if (admin.role !== "Admin") {
      throw new Error("O usuário não tem o papel de Admin.");
    }

    // Verificar se o estudante já está associado ao administrador
    if (admin.students.some((student) => student.toString() === studentId)) {
      throw new Error("Este estudante já está associado a este administrador.");
    }

    // Verificar se o administrador já tem 10 alunos
    if (admin.students.length >= 10) {
      throw new Error("O administrador não pode ter mais de 10 alunos.");
    }

    // Adicionar o estudante à lista de alunos do instrutor
    admin.students.push(studentId);
    await admin.save();

    // Agora, associar o instrutor ao aluno
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado.");
    }

    // Verificar se o aluno já tem um instrutor associado
    if (student.instructor && student.instructor.toString() === adminId) {
      throw new Error("Este aluno já tem este instrutor associado.");
    }

    student.instructor = adminId;
    await student.save();

    return "Estudante adicionado com sucesso.";
  } catch (error) {
    console.error("Erro ao adicionar estudante:", error.message);
    throw error;
  }
}

async function removeStudentFromInstructor(adminId, studentId) {
  try {
    // Converter o studentId para ObjectId (caso seja uma string)
    const studentObjectId = mongoose.Types.ObjectId(studentId);

    // Procurar o instrutor (admin)
    const admin = await Instructor.findById(adminId).populate("students");
    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    // Verificar se o usuário tem o papel de Admin
    if (admin.role !== "Admin") {
      throw new Error("O usuário não tem o papel de Admin.");
    }

    // Verificar se o aluno está associado ao administrador (comparando como ObjectId)
    const studentIndex = admin.students.findIndex(
      (student) => student._id.toString() === studentObjectId.toString()
    );

    if (studentIndex === -1) {
      throw new Error(
        "Este estudante não está associado a este administrador."
      );
    }

    // Remover o estudante do instrutor
    admin.students.splice(studentIndex, 1);
    await admin.save();

    // Agora, remover a referência ao instrutor no estudante
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error("Aluno não encontrado.");
    }

    // Remover a referência ao instrutor no estudante
    student.instructor = null;
    await student.save();

    return "Estudante removido com sucesso.";
  } catch (error) {
    console.error("Erro ao remover estudante:", error.message);
    throw error;
  }
}

// Função para obter os estudantes de um administrador
async function getStudentsByInstructor(adminId) {
  try {
    const admin = await Instructor.findById(adminId).populate("students");

    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    if (admin.role !== "Admin") {
      throw new Error("Usuário não é um administrador.");
    }

    return admin.students;
  } catch (error) {
    throw error;
  }
}

// Função para obter os estudantes de um administrador pelo Email
async function getStudentsByInstructorEmail(adminEmail) {
  try {
    const admin = await Instructor.findOne({ email: adminEmail }).populate(
      "students"
    );

    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    if (admin.role !== "Admin") {
      throw new Error("Usuário não é um administrador.");
    }

    return admin.students;
  } catch (error) {
    throw error;
  }
}

module.exports = InstructorController;
