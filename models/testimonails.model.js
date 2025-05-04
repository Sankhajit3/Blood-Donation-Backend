import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  authorName: {
    type: String,
    required: true,
  },
  authorRole: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: false,
  },
  quote: {
    type: String,
    required: true,
  },
  detailedFeedback: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model("Testimonial", testimonialSchema);
