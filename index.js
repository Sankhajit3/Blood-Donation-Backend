import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.routes.js";
import testimonialRoutes from "./routes/testimonials.route.js";
import bloodRequestRouter from "./routes/bloodRequest.routes.js";
import eventRoutes from "./routes/event.routes.js";


dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
}

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8000;

//api's
app.use("/api/v1/user",userRoute);
app.use("/api/v1/testimonials", testimonialRoutes);
app.use("/api/v1/events", eventRoutes);
router.use("/blood-requests", bloodRequestRouter);

app.listen(PORT,()=>{
    connectDB();
    console.log(`Server running at port ${PORT}`);
})