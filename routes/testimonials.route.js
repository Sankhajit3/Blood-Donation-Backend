import express from "express";
import { createTestimonial, getTestimonials } from "../controllers/testimonials.controller.js";

const router = express.Router();


router.post("/create", createTestimonial);
router.get("/", getTestimonials);

export default router;
