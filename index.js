require("dotenv").config();
require("./mongodb");
const express = require("express");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const middleware = require("./components/middleware");
const cors = require("cors");
const Posts = require("./models/Products");
const usersRouter = require("./controladores/users");
const User = require("./models/User");
/* CAMBIOS RAILWAY PARA EL BVM */
/* 
const bodyParser = require('body-parser');
const mongoose = require("mongoose"); */ 

const app = express();

/* SENTRY */
app.use(cors()); // Configuración de CORS antes de Sentry
Sentry.init({
  dsn: "https://d43e516b334041708b7acc42f3b342e8@o1285320.ingest.sentry.io/6496604",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

/* MIDDLEWARES */
app.use(express.json());
app.use(middleware);

const PORT = process.env.PORT  || 8001;
app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});
/* CREACION DE USUARIO */ /* 
const bodyParser = require('body-parser'); */

// Conectar a la base de datos MongoDB
/* mongoose.connect('mongodb://localhost:27017/usuarios', { useNewUrlParser: true, useUnifiedTopology: true }); */

// Definir un modelo de usuario
/* const User = mongoose.model('User', {
  username: String,
  password: String,
});

app.use(bodyParser.json()); */
app.get("/", (req, res) => {
  /* FIJARSE EL CONTENT TYPE EN GOOGLE */
  res.send("<h1>Hola desde API PROMIEDOS</h1>");
});
// Ruta para crear un nuevo usuario
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Crear un nuevo usuario en la base de datos
    const user = new User({ username, password });
    await user.save();
    res.json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar el usuario" });
  }
});

app.get("/api/posts", (req, res) => {
  /* FIJARSE EL CONTENT TYPE EN GOOGLE */
  Posts.find({}).then((productos) => {
    res.json(productos); /* 
      mongoose.connection.close(); */
  });
});
app.put("/api/posts/:id/like", async (req, res, next) => {
  try {
    const { username } = req.body;
    const postId = req.params.id;

    console.log("Received PUT request to like/unlike post with ID:", postId);
    console.log("Username:", username);

    // Busca el post por ID
    const post = await Posts.findById(postId);

    if (!post) {
      console.log("Post not found", post);
      return res.status(404).json({
        error: "Post not found",
      });
    }

    // Verifica si el usuario ya le dio like al post
    const userLiked = post.likes.some((like) => like.username === username);

    if (userLiked) {
      // Si ya le dio like, quitar el like
      post.likes = post.likes.filter((like) => like.username !== username);
    } else {
      // Si no le dio like, agregar el like
      post.likes.push({ username, date: new Date() });
    }

    // Guarda el post actualizado en la base de datos
    const updatedPost = await post.save();

    // Envía la respuesta con el post actualizado
    res.json(updatedPost);
  } catch (error) {
    console.error("Error handling like/unlike:", error);
    res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
});

app.get("/api/posts/:id", (req, res, next) => {
  /* NORMAL SIN MONGOOSE */
  /* 
  const id = String(req.params.id) */

  // const producto = productos.find((producto) => producto.id == id)  /*ESTO HACE QUE SI LA ID QUE SE ESCRIBIO EN LA URL EXISTE EN EL ARRAY DE PRODUCTOS MUESTRE EL CORRECTO  */
  /*  if (producto) {
    res.json(producto)
} else { */ /* Y EN CASO DE QUE NO CATCHEA ESE ERROR Y RESUELVE CON UN STATUS 404  */
  /* res.status(404).json({
      error:"Este producto no existe"
    })
  } */

  /* CON MONGOOSE */
  const { id } =
    req.params; /*  AL PONER LAS LLACES NO ES NECESARIO PONER EL REQ.PARAMS.ID */

  Posts.findById(id)
    .then((producto) => {
      if (producto) {
        return res.json(producto);
      } else {
        res.status(404).end();
      }
    })
    .catch((err) => {
      next(err);
    });
});
/* ESTO HACE QUE SI LA ID QUE SE ESCRIBIO EN LA URL EXISTE EN EL ARRAY DE PRODUCTOS MUESTRE EL CORRECTO */

// Eliminar un usuario y sus posteos asociados
app.delete("/api/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Encuentra el usuario y obtén los IDs de los posteos asociados
    const user = await User.findById(id);
    const postIds = user.posts;

    // Elimina el usuario
    await User.findByIdAndDelete(id);

    // Elimina los posteos asociados al usuario
    await Posts.deleteMany({ _id: { $in: postIds } });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete("/api/posts/:id", (req, res, next) => {
  /* SIN MONGOOSE */
  /* const id = Number(req.params.id);
  productos = productos.filter((producto) => producto.id !== id);
  res.status(204).end();
  console.log("Producto deleted");  */

  /* CON MONGOOSE */
  const { id } = req.params;
  Posts.findByIdAndDelete(id)
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => next(error));
});
app.put("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const Reqprod = req.body;
  const prodUpdate = {
    username: Reqprod.username,

    name: Reqprod.name,
    pic: Reqprod.pic,
  };
  Posts.findByIdAndUpdate(id, prodUpdate).then((result) => {
    res.json(result);
  });
});
app.post("/api/posts", async (req, res, next) => {
  try {
    const { username, content, likes } = req.body;

    // Verifica que el usuario exista
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (!content) {
      return res.status(400).json({
        error: 'Falta el "contenido" para realizar el post',
      });
    }

    const product = new Posts({
      content,
      date: new Date(),
      likes,
      userid: user._id,
      username: user.username,
    });

    const guardarNota = await product.save();
    user.posts = user.posts.concat(guardarNota._id);
    await user.save();
    res.json(guardarNota);
  } catch (error) {
    next(error);
  }
});
/* app.post("/api/posts/:id/like", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    // Encuentra el post por su ID
    const post = await Posts.findById(id);

    if (!post) {
      return res.status(404).json({
        error: "Post no encontrado",
      });
    }

    // Verifica si el usuario ya ha dado like
    const hasLiked = post.likes.some((likeId) => likeId && likeId.toString() === username);

    if (hasLiked) {
      // Si ya ha dado like, quita el like
      post.likes = post.likes.filter((likeId) => likeId && likeId.toString() !== username);
    } else {
      // Si no ha dado like, agrega el like
      post.likes.push(username);
    }

    // Guarda la actualización
    const updatedPost = await post.save();

    res.json(updatedPost);
  } catch (error) {
    console.error("Error al dar/quitar like al post", error);
    next(error);
  }
}); */

/* POSTs SIN MONGOOSE */
/* const producto = req.body;
  const ids = productos.map((producto) => producto.id);
  const maxId = Math.max(...ids);
  const newProducto = {
    id: maxId + 1,
    modelo: producto.modelo,
    descripcion: producto.descripcion,
    stock: producto.stock,
    name: producto.name,
    pic: producto.pic,
    peso: producto.peso,
    aro: producto.aro,
    patronEncordado: producto.patronEncordado,
    balance: producto.balance,
    grip: producto.grip,
    largo: producto.largo,
  };
  productos = productos.concat(newProducto);
  res.json(newProducto) */ /*

  /* PUSH CON MONGOOSE */

/*  const { content, userId, username } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
      });
    }
  
    if (!content) {
      return res.status(400).json({
        error: 'Falta el "contenido" para realizar el post',
      });
    }
  
    const product = new Posts({
      content,
      date: new Date(),
      userid: user._id,
      username: user.username,
    });
  
    const guardarNota = await product.save();
    user.posts = user.posts.concat(guardarNota._id);
    await user.save();
    res.json(guardarNota);
  } catch (error) {
    next(error);
  }
  
  
}); */ /* likes  */
// Asegúrate de tener la ruta correcta al modelo Likes

// ... otras rutas

// Endpoint para manejar likes en un post específico

// ... otras rutas

// Manejo de errores
app.use((error, req, res, next) => {
  console.error(error);
  console.log(error.name);
  if (error.name == "CastError") {
    res.status(400).end();
  } else {
    res.status(500).end();
  }
});

/* Controladores */
app.use("/api/users", usersRouter);

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const Reqprod = req.body;
  const prodUpdate = {
    username: Reqprod.username,

    name: Reqprod.name,
    pic: Reqprod.pic,
  };
  Posts.findByIdAndUpdate(id, prodUpdate).then((result) => {
    res.json(result);
  });
});
/* ERRORS */

/* 404 */

/* ESTO SI O SI DEBE IR AL FINAL DE LAS RUTAS YA QUE SE USARIA PARA EL ERROR 404 Y COMO EL 1ER APP.USE RECORRE LOS DEMAS APP. DE ARRIBA HACIA ABAJO   */
app.use((requ, res) => {
  res.status(404).json({
    error: 404,
  });
});
/* SENTRY */

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

/* CASTERROR */
app.use((error, req, res, next) => {
  console.error(error);
  console.log(error.name);
  if (error.name == "CastError") {
    res.status(400).end();
  } else {
    res.status(500).end();
  }
});
