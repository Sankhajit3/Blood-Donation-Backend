import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        let token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        // If no token is provided, reject request
        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({
                message:"Invalid token",
                success:false
            })
        };        // Attach user to request
        req.user = { _id: decoded.userId };

        next();
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false,
        });
    }
};

export default isAuthenticated;
