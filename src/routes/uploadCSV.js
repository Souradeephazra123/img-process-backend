import express from "express";
import { getStatus, upload } from "../controller/upload.controller.js";

const UploadRouter = express.Router();

UploadRouter.post("/upload", upload);
UploadRouter.get("/status/:id", getStatus);

export default UploadRouter;
