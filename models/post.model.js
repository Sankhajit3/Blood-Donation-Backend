// models/Post.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
