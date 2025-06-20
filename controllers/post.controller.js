import Post from "../models/post.model.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";

// CREATE a Post
export const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query, location } = req.body;

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

    // Handle location data - can be string or JSON object
    let locationData = location;
    if (typeof location === "string" && location.trim()) {
      // Try to parse as JSON first (for backward compatibility)
      if (location.startsWith("{") || location.startsWith("[")) {
        try {
          locationData = JSON.parse(location);
        } catch (e) {
          // If parsing fails, keep as string
          console.warn(
            "Failed to parse location as JSON, keeping as string:",
            e.message
          );
          locationData = location;
        }
      }
      // If it doesn't look like JSON, treat as plain string
      // This handles cases like "Bidhannagar, Kolkata, West Bengal, 700064"
    }

    const newPost = new Post({
      user: userId,
      image: upload.secure_url,
      query,
      location: locationData || null,
    });

    try {
      await newPost.save();
    } catch (saveError) {
      console.warn("Error saving post with location:", saveError);

      // Try again without the location field if that's causing problems
      if (saveError.name === "ValidationError" && saveError.errors.location) {
        newPost.location = null;
        await newPost.save();
      } else {
        // If it's not a location issue, rethrow
        throw saveError;
      }
    }

    res.status(201).json({
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
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Sort by most recent first
      .populate("user", "name email profile hospitalName organizationName role")
      .populate({
        path: "comments.user",
        select: "name email profile hospitalName organizationName role",
      })
      .populate({
        path: "comments.replies.user",
        select: "name email profile hospitalName organizationName role",
      })
      .populate({
        path: "likes",
        select: "name email profile hospitalName organizationName role",
      });

    // Add isLikedByCurrentUser field for each post to help the frontend
    const modifiedPosts = posts.map((post) => {
      const postObj = post.toObject();

      // Add likesCount for convenience
      postObj.likesCount = postObj.likes ? postObj.likes.length : 0;

      // Check if current user has liked this post
      postObj.isLikedByCurrentUser =
        req.user &&
        postObj.likes &&
        postObj.likes.some(
          (like) => like._id.toString() === req.user._id.toString()
        );

      // Check if the current user is the owner of this post
      postObj.isOwner =
        req.user &&
        postObj.user &&
        postObj.user._id.toString() === req.user._id.toString();

      return postObj;
    });

    res.status(200).json({ posts: modifiedPosts, success: true });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// GET Post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if id is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findById(id)
      .populate("user", "name email profile hospitalName organizationName role")
      .populate({
        path: "comments.user",
        select: "name email profile hospitalName organizationName role",
      })
      .populate({
        path: "comments.replies.user",
        select: "name email profile hospitalName organizationName role",
      })
      .populate({
        path: "likes",
        select: "name email profile hospitalName organizationName role",
      });

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Add additional useful fields
    const postObj = post.toObject();

    // Add likesCount for convenience
    postObj.likesCount = postObj.likes ? postObj.likes.length : 0;

    // Check if current user has liked this post
    postObj.isLikedByCurrentUser =
      req.user &&
      postObj.likes &&
      postObj.likes.some(
        (like) => like._id.toString() === req.user._id.toString()
      );

    // Check if the current user is the owner of this post
    postObj.isOwner =
      req.user &&
      postObj.user &&
      postObj.user._id.toString() === req.user._id.toString();

    res.status(200).json({ post: postObj, success: true });
  } catch (error) {
    console.error("Error getting post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// EDIT a Post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { query, location } = req.body;

    // Validate id
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if id is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only update your own posts",
        success: false,
      });
    }

    // Optional image update
    if (req.files?.image?.[0]) {
      // Delete old image from Cloudinary (optional, based on how you store public_id)
      const fileUri = getDataUri(req.files.image[0]);
      const upload = await cloudinary.uploader.upload(fileUri.content);
      post.image = upload.secure_url;
    }
    if (query) post.query = query;

    // Parse location if it's provided as a string
    if (location !== undefined) {
      let locationData = location;
      if (typeof location === "string" && location.trim()) {
        try {
          locationData = JSON.parse(location);
        } catch (e) {
          // If parsing fails, keep the original string
          console.warn("Failed to parse location as JSON, using as string:", e);
        }
      }
      post.location = locationData;
    }

    try {
      await post.save();
    } catch (saveError) {
      // If validation error occurs with location, try without it
      if (saveError.name === "ValidationError" && saveError.errors.location) {
        console.warn(
          "Location validation error, clearing location:",
          saveError.message
        );
        post.location = null;
        await post.save();
      } else {
        throw saveError;
      }
    } // Get the updated post with populated fields for consistent response
    const updatedPost = await Post.findById(post._id)
      .populate("user", "name email hospitalName organizationName role")
      .populate({
        path: "comments.user",
        select: "name email hospitalName organizationName role",
      })
      .populate({
        path: "comments.replies.user",
        select: "name email hospitalName organizationName role",
      })
      .populate({
        path: "likes",
        select: "name email hospitalName organizationName role",
      });

    // Add isLikedByCurrentUser field
    const postObj = updatedPost.toObject();
    postObj.isLikedByCurrentUser =
      req.user &&
      postObj.likes &&
      postObj.likes.some(
        (like) => like._id.toString() === req.user._id.toString()
      );

    res.status(200).json({
      message: "Post updated successfully",
      post: postObj,
      success: true,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// DELETE a Post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if id is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Check if the user is the owner of the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own posts",
        success: false,
      });
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

// Like a post
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if id is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const userId = req.user._id;

    // Check if user already liked the post
    const alreadyLiked = post.likes && post.likes.includes(userId);

    if (alreadyLiked) {
      // Remove like (unlike)
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Add like
      if (!post.likes) {
        post.likes = [];
      }
      post.likes.push(userId);
    }

    // Skip validation by using updateOne directly
    try {
      await Post.updateOne({ _id: post._id }, { $set: { likes: post.likes } });

      return res.status(200).json({
        message: alreadyLiked ? "Post unliked" : "Post liked",
        likes: post.likes.length,
        success: true,
      });
    } catch (error) {
      console.error("Error updating likes:", error);
      return res.status(500).json({
        message: "Failed to update like status",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Add a comment to a post
export const commentOnPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "Comment text is required", success: false });
    }

    // Validate id
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if id is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      replies: [],
    };

    if (!post.comments) {
      post.comments = [];
    }

    post.comments.push(comment);

    // Skip validation by using updateOne directly
    try {
      await Post.updateOne(
        { _id: post._id },
        { $set: { comments: post.comments } }
      );

      try {
        // Populate user info for the new comment
        const populatedPost = await Post.findById(post._id).populate({
          path: "comments.user",
          select: "name email profile hospitalName organizationName role",
        });

        const newComment =
          populatedPost.comments[populatedPost.comments.length - 1];
        return res.status(201).json({
          message: "Comment added successfully",
          comment: newComment,
          success: true,
        });
      } catch (populateError) {
        console.error("Error populating comment user:", populateError);
        // Return basic success even if population fails
        return res.status(201).json({
          message:
            "Comment added successfully, but user details could not be loaded",
          comment: comment,
          success: true,
        });
      }
    } catch (error) {
      console.error("Error updating post with comment:", error);
      return res.status(500).json({
        message: "Failed to add comment",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Reply to a comment
export const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: postId, commentId } = req.params;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "Reply text is required", success: false });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res
        .status(404)
        .json({ message: "Comment not found", success: false });
    }

    const reply = {
      user: req.user._id,
      text: text.trim(),
    };
    post.comments[commentIndex].replies.push(reply);

    // Skip validation by using updateOne directly
    await Post.updateOne(
      { _id: post._id },
      { $set: { comments: post.comments } }
    );

    try {
      // Populate user info for the new reply
      const populatedPost = await Post.findById(post._id).populate({
        path: "comments.replies.user",
        select: "name email profile hospitalName organizationName role",
      });

      const newReply =
        populatedPost.comments[commentIndex].replies[
          populatedPost.comments[commentIndex].replies.length - 1
        ];
      return res.status(201).json({
        message: "Reply added successfully",
        reply: newReply,
        success: true,
      });
    } catch (populateError) {
      console.error("Error populating reply user:", populateError);
      // Return basic success even if population fails
      return res.status(201).json({
        message:
          "Reply added successfully, but user details could not be loaded",
        reply: reply,
        success: true,
      });
    }
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Share a post (increment shares count)
export const sharePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid or missing post ID",
        success: false,
      });
    }

    // Validate if id is a valid ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid post ID format",
        success: false,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Initialize shares if not exist
    if (!post.shares) {
      post.shares = 0;
    } // Increment shares count
    post.shares += 1;

    // Skip validation by using updateOne directly
    await Post.updateOne({ _id: post._id }, { $set: { shares: post.shares } });

    return res.status(200).json({
      message: "Post shared successfully",
      shares: post.shares,
      success: true,
    });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

// Get posts with pagination and filtering options
export const getPostsWithOptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const userId = req.query.userId; // Filter by specific user if provided

    const skip = (page - 1) * limit;

    // Build the query
    const query = {};
    if (userId) {
      query.user = userId;
    }

    // Get total count for pagination metadata
    const total = await Post.countDocuments(query);

    // Get the posts
    const posts = await Post.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email profile")
      .populate({
        path: "comments.user",
        select: "name email profile",
      })
      .populate({
        path: "comments.replies.user",
        select: "name email profile",
      })
      .populate({
        path: "likes",
        select: "name email profile",
      });

    // Add isLikedByCurrentUser field for each post to help the frontend
    const modifiedPosts = posts.map((post) => {
      const postObj = post.toObject();

      // Add likesCount for convenience
      postObj.likesCount = postObj.likes ? postObj.likes.length : 0;

      // Check if current user has liked this post
      postObj.isLikedByCurrentUser =
        req.user &&
        postObj.likes &&
        postObj.likes.some(
          (like) => like._id.toString() === req.user._id.toString()
        );

      // Check if the current user is the owner of this post
      postObj.isOwner =
        req.user &&
        postObj.user &&
        postObj.user._id.toString() === req.user._id.toString();

      return postObj;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      posts: modifiedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching posts with options:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
