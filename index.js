import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.routes.js";
import testimonialRoutes from "./routes/testimonials.route.js";
import bloodRequestRouter from "./routes/bloodRequest.routes.js";
import eventRoutes from "./routes/event.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import eventRegistrationRoutes from "./routes/eventRegistration.routes.js";
import postRoutes from "./routes/post.routes.js";
import bloodInventoryRoutes from "./routes/bloodInventory.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8001;

//api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/testimonials", testimonialRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/event-registrations", eventRegistrationRoutes);
app.use("/api/v1/user/blood-requests", bloodRequestRouter);
app.use("/api/v1/donor", donorRoutes);
app.use("/api/v1/user/post", postRoutes);
app.use("/api/v1/blood-inventory", bloodInventoryRoutes);
app.use("/api/v1/admin", adminRoutes);

// Import and use the error handler middleware (must be after all routes)
import errorHandler from "./middlewares/errorHandler.js";
app.use(errorHandler);

// Generic 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    success: false,
  });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running at port ${PORT}`);
});
