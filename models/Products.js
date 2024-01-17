const { model, Schema } = require("mongoose");

const newSchema = new Schema({
  content: String,
  username: String,
  date: { type: Date, default: Date.now },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

newSchema.set("toJSON", {
  transform: (document, resProducto) => {
    resProducto.id = resProducto._id;
    delete resProducto._id;
    delete resProducto.__v;
  },
});

const Posts = model("Post", newSchema);

module.exports = Posts;




/* ESTO ES PARA GUARDAR UN PRODUCTO EN MONGO */
/* const product = new Prod({
  modelo: "Babolat Pure Aero Rafa",
  descripcion:
    "Combatividad, resistencia, fortaleza mental... ¡eres como Rafa! Es hora de desafiar a tus oponentes más duros con esta Pure Aero, que con su nombre y colores acompañará tu dominio del juego a través de tu liftado y tu potencia.",
  stock: 75,
  precio: 1000,
  pic: "https://d3ugyf2ht6aenh.cloudfront.net/stores/001/338/510/products/raqueta-babolat-pure-aero-rafa-2-bff1f4ef7c1210fb3b16334515103466-240-0.png",
  peso: 300,
  aro: 100,
  patronEncordado: "16/19",
  grip: "4 3/4 4 1/4",
  balance: 320,
  largo: 685,
});
 */
/* product
  .save()
  .then((res) => {
    console.log(res);
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error(err);
  }); */