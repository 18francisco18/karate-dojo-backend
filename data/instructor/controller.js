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
// Função para permitir que um aluno escolha um instrutor
async function addStudentToInstructor(instructorId, studentId) {
  try {
    const instructor = await Instructor.findById(instructorId).populate(
      "students"
    );
    if (!instructor) {
      throw new Error("Instrutor não encontrado.");
    }

    // Verificar se o aluno já está associado a este instrutor
    if (
      instructor.students.some((student) => student.toString() === studentId)
    ) {
      throw new Error("Você já está associado a este instrutor.");
    }

    // Limitar o número máximo de alunos que um instrutor pode ter
    if (instructor.students.length >= 10) {
      throw new Error("Este instrutor não pode ter mais de 10 alunos.");
    }

    // Adicionar aluno à lista de alunos do instrutor
    instructor.students.push(studentId);
    await instructor.save();

    // Atualizar o instrutor associado no perfil do aluno
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Aluno não encontrado.");
    student.instructor = instructorId;
    await student.save();

    return "Instrutor escolhido com sucesso.";
  } catch (error) {
    throw new Error("Erro ao associar aluno ao instrutor: " + error.message);
  }
}

// Remover aluno de um instrutor
async function removeStudentFromInstructor(instructorId, studentId) {
  try {
    // Buscar o instrutor pelo ID
    const instructor = await Instructor.findById(instructorId).populate(
      "students"
    );
    if (!instructor) {
      throw new Error("Instrutor não encontrado ou não autorizado.");
    }

    // Verificar se o aluno está associado ao instrutor
    const studentIndex = instructor.students.findIndex(
      (student) => student._id.toString() === studentId.toString()
    );
    if (studentIndex === -1) {
      throw new Error("Este estudante não está associado a este instrutor.");
    }

    // Remover aluno da lista de alunos do instrutor
    instructor.students.splice(studentIndex, 1);
    await instructor.save();

    // Atualizar o campo 'instructor' do aluno para null
    const student = await Student.findById(studentId);
    if (!student) throw new Error("Aluno não encontrado.");
    student.instructor = null;
    await student.save();

    return "Estudante removido com sucesso.";
  } catch (error) {
    console.error("Erro ao remover estudante:", error.message);
    throw new Error("Erro ao remover estudante: " + error.message);
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
