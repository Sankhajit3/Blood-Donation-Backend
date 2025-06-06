import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, "role is required"],
      enum: ["admin", "organization", "user", "hospital"],
    },
    name: {
      type: String,
      required: function () {
        return this.role === "user" || this.role === "admin";
      },
    },
    organizationName: {
      type: String,
      required: function () {
        return this.role === "organization";
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
    organizationId: {
      type: String,
      required: function () {
        return this.role === "organization";
      },
    },
    organizationIdImage: {
      type: String,
      required: function () {
        return this.role === "organization";
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
