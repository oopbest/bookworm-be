import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

// hash password before saving user to db
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // if password is not modified, skip hashing

  const salt = await bcrypt.genSalt(10); // generate salt
  this.password = await bcrypt.hash(this.password, salt); // hash password
});

// compare password
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password); // compare password with hashed password
};

const User = mongoose.model("User", UserSchema);
export default User;
