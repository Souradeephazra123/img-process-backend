import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { mongoConnect } from "./utils/connectToMongoDB.js";
import DefaultRouter from "./routes/uploadCSV.js";
// import AuthRouter from "./routes/auth.routes.js";
// import EventRouter from "./routes/event.routes.js";
// import EmailRouter from "./routes/email.routes.js";
import expressFileUpload from "express-fileupload";
dotenv.config();

const app = express();
app.use(expressFileUpload());

app.use(
  cors({
    origin: [`${process.env.FRONTEND_URL}`],
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

const PORT = process.env.PORT || 8080;

app.use(express.json());

// app.use("/api", AuthRouter);
// app.use("/api", EventRouter);
// app.use("/", EmailRouter);
app.use("/", DefaultRouter);

async function serverConnect() {
  await mongoConnect();
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

serverConnect();
