import Testimonial from "../models/testimonails.model.js";

// Create a new testimonial
export const createTestimonial = async (req, res) => {
  try {
    const { authorName, authorRole, avatar, quote, detailedFeedback } = req.body;

    if (!authorName || !authorRole || !quote) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const testimonial = new Testimonial({
      authorName,
      authorRole,
      avatar,
      quote,
      detailedFeedback,
    });

    await testimonial.save();
    res.status(201).json({ success: true, message: "Testimonial created successfully", testimonial });

  } catch (error) {
    console.error("Create Testimonial Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all testimonials
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, testimonials });
  } catch (error) {
    console.error("Get Testimonials Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
