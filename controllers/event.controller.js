import Event from "../models/event.model.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/Cloudinary.js";

// Create a new event with image upload
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue } = req.body;
    
    // Validate required fields
    if (!title || !date || !time || !venue) {
      return res.status(400).json({ 
        message: "Title, date, time and venue are required fields.",
        success: false
      });
    }

    let imageUrl = "";
    // Handle image upload if present
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloudinaryResponse = await cloudinary.uploader.upload(fileUri.content);
      imageUrl = cloudinaryResponse.secure_url;
    }

    // Create new event
    const event = new Event({ 
      title, 
      description, 
      date, 
      time, 
      venue, 
      image: imageUrl,
      createdBy: req.user._id // From authenticated user
    });

    await event.save();

    return res.status(201).json({ 
      message: "Event created successfully", 
      event,
      success: true
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ 
      message: "Server error while creating event.",
      success: false
    });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .populate("createdBy", "name email profile.profilePhoto");
      
    res.status(200).json({
      message: "Events fetched successfully",
      events,
      success: true
    });
  } catch (error) {
    console.error("Fetch Events Error:", error);
    res.status(500).json({ 
      message: "Server error while fetching events.",
      success: false
    });
  }
};

// Get events created by current user
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ date: 1 })
      .populate("createdBy", "name email profile.profilePhoto");
      
    res.status(200).json({
      message: "Your events fetched successfully",
      events,
      success: true
    });
  } catch (error) {
    console.error("Fetch User Events Error:", error);
    res.status(500).json({ 
      message: "Server error while fetching your events.",
      success: false
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, venue } = req.body;

    // Find event and verify owner
    const event = await Event.findOne({ _id: id, createdBy: req.user._id });
    if (!event) {
      return res.status(404).json({ 
        message: "Event not found or you don't have permission to edit it.",
        success: false
      });
    }

    let imageUrl = event.image;
    // Handle new image upload if present
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (event.image) {
        const publicId = event.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      
      const fileUri = getDataUri(req.file);
      const cloudinaryResponse = await cloudinary.uploader.upload(fileUri.content);
      imageUrl = cloudinaryResponse.secure_url;
    }

    // Update event
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.venue = venue || event.venue;
    event.image = imageUrl;

    await event.save();

    res.status(200).json({
      message: "Event updated successfully",
      event,
      success: true
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ 
      message: "Server error while updating event.",
      success: false
    });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find event and verify owner
    const event = await Event.findOne({ _id: id, createdBy: req.user._id });
    if (!event) {
      return res.status(404).json({ 
        message: "Event not found or you don't have permission to delete it.",
        success: false
      });
    }

    // Delete image from Cloudinary if exists
    if (event.image) {
      const publicId = event.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await event.remove();

    res.status(200).json({
      message: "Event deleted successfully",
      success: true
    });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ 
      message: "Server error while deleting event.",
      success: false
    });
  }
};