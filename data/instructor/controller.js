const User = require("../users/user");

const InstructorController = {
  addStudentToInstructor,
  removeStudentFromInstructor,
  getStudentsByInstructor,
  getStudentsByInstructorEmail,
};

async function addStudentToInstructor(adminId, studentId) {
  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    if (!admin.role || admin.role.name !== "Admin") {
      throw new Error("O usuário não tem o papel de Admin.");
    }

    if (!admin.students.includes(studentId)) {
      admin.students.push(studentId);
      await admin.save();
      return "Estudante adicionado com sucesso.";
    } else {
      throw new Error("Este estudante já está associado a este administrador.");
    }
  } catch (error) {
    console.error("Erro ao adicionar estudante:", error.message);
    throw error;
  }
}

async function removeStudentFromInstructor(adminId, studentId) {
  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    if (!admin.role || admin.role.name !== "Admin") {
      throw new Error("O usuário não tem o papel de Admin.");
    }

    const studentIndex = admin.students.indexOf(studentId);
    if (studentIndex !== -1) {
      admin.students.splice(studentIndex, 1);
      await admin.save();
      return "Estudante removido com sucesso.";
    } else {
      throw new Error(
        "Este estudante não está associado a este administrador."
      );
    }
  } catch (error) {
    console.error("Erro ao remover estudante:", error.message);
    throw error;
  }
}

// Função para obter os estudantes de um administrador
async function getStudentsByInstructor(adminId) {
  try {
    const admin = await User.findById(adminId).populate("students");

    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    if (admin.role.name !== "Admin") {
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
    const admin = await User.findOne({ email: adminEmail }).populate(
      "students"
    );

    if (!admin) {
      throw new Error("Admin não encontrado.");
    }

    if (admin.role.name !== "Admin") {
      throw new Error("Usuário não é um administrador.");
    }

    return admin.students;
  } catch (error) {
    throw error;
  }
}

module.exports = InstructorController;
