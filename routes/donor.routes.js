// routes/donor.routes.js
import express from "express";
import { registerDonor } from "../controllers/donor.controller.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/register", singleUpload, registerDonor);

export default router;
