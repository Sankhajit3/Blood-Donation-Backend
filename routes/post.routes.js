import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { singleUpload } from "../middlewares/multer.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/create", isAuthenticated, singleUpload, createPost);
router.get("/all", isAuthenticated, getAllPosts);
router.get("/:id", isAuthenticated, getPostById);
router.put("/:id", isAuthenticated, singleUpload, updatePost);
router.delete("/:id", isAuthenticated, deletePost);

export default router;
