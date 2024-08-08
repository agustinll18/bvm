const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  username: String,
  club: String, 
  passwordHash: String,
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  pic: String,
  cell: Number
});

userSchema.set("toJSON", {
  transform: (document, resProducto) => {
    resProducto.id = resProducto._id;
    delete resProducto._id;
    delete resProducto.__v;
  },
});

const User = model("User", userSchema);

module.exports = User;
