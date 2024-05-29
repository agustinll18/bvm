const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRouter = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Products");
/* para evitar el casterror  */
const ObjectId = require('mongoose').Types.ObjectId;
require("dotenv").config(); 

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await User.find({}).populate("posts");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verifica si el ID proporcionado es un objeto ObjectId válido
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "El ID proporcionado no es válido" });
    }

    const user = await User.findById(id);

    if (user) {
      return res.json(user);
    } else {
      res.status(404).end();
    }
  } catch (error) {
    next(error);
  }
});

// Ruta para registro de usuario y inicio de sesión
usersRouter.post("/", async (req, res, next) => {
  try {
    const { body } = req;
    const { username, password, club ,cell} = body;

    // Verifica si el usuario ya existe (para evitar duplicados)
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      // Si el usuario ya existe, responde con un error
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crea un nuevo usuario
    const user = new User({
      username,
      club,
      passwordHash,cell
    });

    // Guarda el nuevo usuario en la base de datos
    const savedUser = await user.save();

    // Genera un token para el nuevo usuario
    const userForToken = {
      username: savedUser.username,
      id: savedUser._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    // Responde con el token y el nombre de usuario
    res.status(200).send({ token, username: savedUser.username });
  } catch (error) {
    console.error("Error en la ruta de registro:", error);
    next(error);
  }
});

// Ruta para iniciar sesión
usersRouter.post("/login", async (req, res, next) => {
  try {
    const { body } = req;
    const { username, password } = body;

    // Busca al usuario en la base de datos
    const user = await User.findOne({ username });

    // Verifica si el usuario existe y la contraseña es correcta
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      console.error("Credenciales incorrectas");
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    console.log("Inicio de sesión exitoso para el usuario:", user.username);

    // Genera un token para el usuario
    const userForToken = {
      username: user.username,
      id: user._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    // Responde con el token y el nombre de usuario
    res.status(200).send({ token, username: user.username });
  } catch (error) {
    next(error);
  }
});


usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
 
    const user = await User.findById(id);
    const postIds = user.posts;

    await User.findByIdAndDelete(id);
    await Post.deleteMany({ _id: { $in: postIds } });

    res.status(204).end();
  } catch (error) {
    console.error("Error en la ruta de eliminación de usuario:", error);
    next(error);
  }
});

module.exports = usersRouter;
