import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  commentOnPost,
  replyToComment,
  sharePost,
  getPostsWithOptions,
} from "../controllers/post.controller.js";
import { singleUpload } from "../middlewares/multer.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/create", isAuthenticated, singleUpload, createPost);
router.get("/all", isAuthenticated, getAllPosts);
router.get("/paginated", isAuthenticated, getPostsWithOptions);
router.get("/:id", isAuthenticated, getPostById);
router.put("/:id", isAuthenticated, singleUpload, updatePost);
router.delete("/:id", isAuthenticated, deletePost);

// New routes for post interactions
router.post("/:id/like", isAuthenticated, likePost);
router.post("/:id/comment", isAuthenticated, commentOnPost);
router.post("/:id/comment/:commentId/reply", isAuthenticated, replyToComment);
router.post("/:id/share", isAuthenticated, sharePost);

export default router;
