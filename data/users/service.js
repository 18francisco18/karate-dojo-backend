const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const scopes = require("./scopes");
const { Instructor, Student } = require("../../models/user");

function UserService(UserModel) {
  let service = {
    create, //feito
    findAll, //feito
    findById, //feito
    findUser, //feito
    removeById, //feito
    updateUser, //feito
    createPassword, //feito
    comparePassword, //feito
    verifyToken, //feito
    createToken, //feito
  };

  async function create(user) {
    try {
      const hashPassword = await createPassword(user);
      let newUserWithPassword = { ...user, password: hashPassword };

      // Handle different roles
      if (user.role === "Admin") {
        newUserWithPassword.scope = user.scope || ["User"]; // Handle scope for Instructor
      }

      let UserModel;
      if (user.role === "Admin") {
        UserModel = Instructor;
      } else if (user.role === "Student") {
        UserModel = Student;
      } else {
        throw new Error("Invalid role");
      }

      let newUser = new UserModel(newUserWithPassword);
      const result = await save(newUser);
      return result;
    } catch (err) {
      console.error("Error in create function:", err);
      return Promise.reject("Not Saved");
    }
  }

  async function save(model) {
    try {
      // Tenta salvar o modelo no banco de dados
      await model.save();
      return "User created";
    } catch (err) {
      console.error("Error saving user:", err); // Adicionando um log mais detalhado
      return Promise.reject(`There is a problem with register: ${err.message}`);
    }
  }

  // Converte para async
  async function findById(id) {
    try {
      const user = await UserModel.findById(id).populate("instructor");
      console.log("User with populated instructor:", user); // Log temporário para teste
      if (!user) {
        return Promise.reject("User not found");
      }
      return user;
    } catch (err) {
      console.error("Error fetching user:", err);
      return Promise.reject("Error fetching user");
    }
  }

  // Converte para async
  async function findAll() {
    try {
      const users = await UserModel.find({});
      return users;
    } catch (err) {
      return Promise.reject("Error fetching users");
    }
  }

  // Converte para async
  async function findUser(body) {
    try {
      const UserModel = body.role === scopes.Instructor ? Instructor : Student; // Dynamic model based on role
      const user = await UserModel.findOne({ email: body.email });
      if (!user) {
        throw new Error("User not found");
      }

      const match = await bcrypt.compare(body.password, user.password);
      if (!match) {
        throw new Error("Invalid password");
      }

      return user;
    } catch (err) {
      throw err;
    }
  }

  // Converte para async
  async function removeById(id) {
    try {
      const user = await UserModel.findByIdAndDelete(id);
      if (!user) {
        return Promise.reject("User not found");
      }
      return "User successfully removed";
    } catch (err) {
      return Promise.reject("Error removing user");
    }
  }

  // Converte para async
  async function updateUser(id, updateData) {
    try {
      const user = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!user) {
        return Promise.reject("User not found");
      }
      return user;
    } catch (err) {
      return Promise.reject("Error updating user");
    }
  }

  // Converte para async
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
      throw err;
    }
  }

  function createToken(user) {
    let token = jwt.sign(
      { id: user._id, name: user.name, role: user.role.scope },
      config.secret,
      {
        expiresIn: config.expiresPassword,
      }
    );
    return { auth: true, token };
  }

  function createPassword(user) {
    return bcrypt.hash(user.password, config.saltRounds);
  }

  function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  return service;
}

module.exports = UserService;
