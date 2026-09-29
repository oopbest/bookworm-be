import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Node.js / Windows c-ares SRV lookup failure (querySrv ECONNREFUSED)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");
  } catch (error) {
    console.log(error);
  }
};
