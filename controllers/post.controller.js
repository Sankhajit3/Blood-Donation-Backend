import Post from "../models/post.model.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";

// CREATE a Post
export const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query } = req.body;

    if (!query) {
      return res
        .status(400)
        .json({ message: "Query is required.", success: false });
    }

    const file = req.files?.image?.[0];
    if (!file) {
      return res
        .status(400)
        .json({ message: "Image is required.", success: false });
    }

    const fileUri = getDataUri(file);
    const upload = await cloudinary.uploader.upload(fileUri.content);

    const newPost = new Post({
      user: userId,
      image: upload.secure_url,
      query,
    });

    await newPost.save();

    res
      .status(201)
      .json({
        message: "Post created successfully.",
        post: newPost,
        success: true,
      });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// GET ALL Posts
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name email");
    res.status(200).json({ posts, success: true });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// GET Post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }
    res.status(200).json({ post, success: true });
  } catch (error) {
    console.error("Error getting post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// EDIT a Post
export const updatePost = async (req, res) => {
  try {
    const { query } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Optional image update
    if (req.files?.image?.[0]) {
      // Delete old image from Cloudinary (optional, based on how you store public_id)
      const fileUri = getDataUri(req.files.image[0]);
      const upload = await cloudinary.uploader.upload(fileUri.content);
      post.image = upload.secure_url;
    }

    if (query) post.query = query;

    await post.save();

    res
      .status(200)
      .json({ message: "Post updated successfully", post, success: true });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// DELETE a Post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Optionally delete image from cloudinary here if you store public_id

    await post.deleteOne();

    res
      .status(200)
      .json({ message: "Post deleted successfully", success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
