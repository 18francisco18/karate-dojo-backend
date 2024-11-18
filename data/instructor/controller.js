const { Instructor, Student } = require("../../models/user");
const mongoose = require("mongoose");

const InstructorController = {
  getInstructors,
  addStudentToInstructor,
  removeStudentFromInstructor,
  getStudentsByInstructor,
  getStudentsByInstructorEmail,
  updateInstructorDetails,
  getAllStudents,
  getInstructorDetailsWithStudents,
  getInstructorByStudentId,
  removeAllStudentsFromInstructor,
};

// Obter todos os instrutores
async function getInstructors() {
  try {
    const instructors = await Instructor.find({ role: "Admin" });
    return instructors;
  } catch (error) {
    throw new Error("Erro ao obter instrutores: " + error.message);
  }
}

// Atualizar detalhes do instrutor
async function updateInstructorDetails(adminId, updates) {
  try {
    const updatedAdmin = await Instructor.findByIdAndUpdate(adminId, updates, {
      new: true,
    });
    if (!updatedAdmin) {
      throw new Error("Instrutor não encontrado.");
    }
    return updatedAdmin;
  } catch (error) {
    throw new Error("Erro ao atualizar instrutor: " + error.message);
  }
}

// Adicionar aluno a um instrutor
async function addStudentToInstructor(adminId, studentId) {
  try {
    const admin = await Instructor.findById(adminId).populate("students");
    if (!admin || admin.role !== "Admin") {
      throw new Error("Admin não encontrado ou não autorizado.");
    }
    if (admin.students.some((student) => student.toString() === studentId)) {
      throw new Error("Este estudante já está associado a este administrador.");
    }
    if (admin.students.length >= 10) {
      throw new Error("O administrador não pode ter mais de 10 alunos.");
    }
    admin.students.push(studentId);
    await admin.save();

    const student = await Student.findById(studentId);
    if (!student) throw new Error("Aluno não encontrado.");
    student.instructor = adminId;
    await student.save();

    return "Estudante adicionado com sucesso.";
  } catch (error) {
    throw error;
  }
}

// Remover aluno de um instrutor
async function removeStudentFromInstructor(adminId, studentId) {
  try {
    const admin = await Instructor.findById(adminId).populate("students");
    if (!admin || admin.role !== "Admin") {
      throw new Error("Admin não encontrado ou não autorizado.");
    }
    const studentIndex = admin.students.findIndex(
      (student) => student._id.toString() === studentId.toString()
    );
    if (studentIndex === -1) {
      throw new Error(
        "Este estudante não está associado a este administrador."
      );
    }
    admin.students.splice(studentIndex, 1);
    await admin.save();

    const student = await Student.findById(studentId);
    if (!student) throw new Error("Aluno não encontrado.");
    student.instructor = null;
    await student.save();

    return "Estudante removido com sucesso.";
  } catch (error) {
    throw error;
  }
}

// Obter estudantes por ID do instrutor
async function getStudentsByInstructor(adminId) {
  try {
    const admin = await Instructor.findById(adminId).populate("students");
    if (!admin || admin.role !== "Admin") {
      throw new Error("Admin não encontrado ou não autorizado.");
    }
    return admin.students;
  } catch (error) {
    throw error;
  }
}

// Obter estudantes por email do instrutor
async function getStudentsByInstructorEmail(adminEmail) {
  try {
    const admin = await Instructor.findOne({ email: adminEmail }).populate(
      "students"
    );
    if (!admin || admin.role !== "Admin") {
      throw new Error("Admin não encontrado ou não autorizado.");
    }
    return admin.students;
  } catch (error) {
    throw error;
  }
}

// Listar todos os alunos
async function getAllStudents() {
  try {
    const students = await Student.find().populate("instructor", "name email");
    return students;
  } catch (error) {
    throw new Error("Erro ao obter todos os estudantes: " + error.message);
  }
}

// Obter detalhes do instrutor com lista de alunos
async function getInstructorDetailsWithStudents(adminId) {
  try {
    const instructor = await Instructor.findById(adminId).populate("students");
    if (!instructor) throw new Error("Instrutor não encontrado.");
    return instructor;
  } catch (error) {
    throw new Error("Erro ao obter detalhes do instrutor: " + error.message);
  }
}

// Obter instrutor pelo ID do aluno
async function getInstructorByStudentId(studentId) {
  try {
    const student = await Student.findById(studentId).populate(
      "instructor",
      "name email"
    );
    if (!student) throw new Error("Aluno não encontrado.");
    return student.instructor;
  } catch (error) {
    throw new Error(
      "Erro ao obter instrutor pelo ID do aluno: " + error.message
    );
  }
}

// Remover todos os alunos de um instrutor
async function removeAllStudentsFromInstructor(adminId) {
  try {
    const admin = await Instructor.findById(adminId).populate("students");
    if (!admin) throw new Error("Instrutor não encontrado.");

    await Promise.all(
      admin.students.map(async (student) => {
        const s = await Student.findById(student._id);
        s.instructor = null;
        return s.save();
      })
    );

    admin.students = [];
    await admin.save();

    return "Todos os estudantes foram removidos do instrutor.";
  } catch (error) {
    throw new Error("Erro ao remover todos os estudantes: " + error.message);
  }
}

module.exports = InstructorController;
