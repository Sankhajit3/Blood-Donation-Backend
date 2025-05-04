import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "", // optional image URL
  }
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
export default Event;
