import mongoose from "mongoose";

//previuously it iwas not working connecting to mongodb , so  i have added here dotenv
import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in the environment variables");
}
const MONGO_URL = process.env.MONGO_URI;

mongoose.connection.once("open", () => {
  console.log("Connected to Database");
});

mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}
async function mongoDisconnect() {
  await mongoose.disconnect();
}

export { mongoConnect, mongoDisconnect };