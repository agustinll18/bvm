const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRouter = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Products");
/* para evitar el casterror  */
const ObjectId = require('mongoose').Types.ObjectId;
require("dotenv").config(); 

const authMiddleware = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Falta el Token o es invalido' });
  }

  const token = authHeader.substring(7);
  jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ error: 'Token invalido' });
    }
    req.user = decodedToken;
    next();
  });
};

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

    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    res.status(200).send({ token, username: user.username });
  } catch (error) {
    console.error("Error en la ruta de inicio de sesión:", error);
    next(error);
  }
});

// Ruta para eliminar un post
usersRouter.delete('/posts/:postId', authMiddleware, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const postIndex = user.posts.findIndex(post => post._id.toString() === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    user.posts.splice(postIndex, 1);
    await user.save();

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
