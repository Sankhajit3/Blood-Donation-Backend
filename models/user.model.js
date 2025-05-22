import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, "role is required"],
      enum: ["admin", "organisation", "user", "hospital"],
    },
    name: {
      type: String,
      required: function () {
        return this.role === "user" || this.role === "admin";
      },
    },
    organisationName: {
      type: String,
      required: function () {
        return this.role === "organisation";
      },
    },
    hospitalName: {
      type: String,
      required: function () {
        return this.role === "hospital";
      },
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },

    addhar: {
      type: String,
      required: function () {
        return this.role === "user";
      },
    },
    addharImage: {
      type: String,
      required: function () {
        return this.role === "user";
      },
    },
    organisationId: {
      type: String,
      required: function () {
        return this.role === "organisation";
      },
    },
    organisationIdImage: {
      type: String,
      required: function () {
        return this.role === "organisation";
      },
    },
    hospitalId: {
      type: String,
      required: function () {
        return this.role === "hospital";
      },
    },
    hospitalIdImage: {
      type: String,
      required: function () {
        return this.role === "hospital";
      },
    },
    phone: {
      type: String,
      required: [true, "phone number is required"],
    },

    profile: {
      bio: { type: String },
      skills: [{ type: String }],
      profilePhoto: {
        type: String,
        default: "",
      },
    },

    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
    },
    emergencyContact: {
      type: String,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    // Medical Details
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    bloodPressure: {
      type: String,
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    medications: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
