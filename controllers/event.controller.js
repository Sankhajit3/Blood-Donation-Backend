import Event from "../models/event.model.js";

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, image } = req.body;

    if (!title || !date || !time || !venue) {
      return res.status(400).json({ message: "Required fields missing." });
    }

    const event = new Event({ title, description, date, time, venue, image });
    await event.save();

    return res
      .status(201)
      .json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Server error while creating event." });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Fetch Events Error:", error);
    res.status(500).json({ message: "Server error while fetching events." });
  }
};
