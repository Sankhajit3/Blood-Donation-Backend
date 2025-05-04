import express from "express";
import { createEvent, getAllEvents } from "../controllers/event.controller.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/", getAllEvents);

export default router;
