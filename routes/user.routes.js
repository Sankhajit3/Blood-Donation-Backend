import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  login,
  logout,
  register,
  updateUser,
} from "../controllers/user.controller.js";
import {
  getHospitalHistory,
  getOrganizationHistory,
  getHospitalUserInteractions,
  getOrganizationUserInteractions,
} from "../controllers/userHistory.controller.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/register", singleUpload, register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", isAuthenticated, getAllUsers);
router.get("/users/:id", isAuthenticated, getUserById);
router.put("/users/:id", isAuthenticated, singleUpload, updateUser);
router.delete("/delete/:id", isAuthenticated, deleteUser);
router.get("/hospital-history", isAuthenticated, getHospitalHistory);
router.get("/organization-history", isAuthenticated, getOrganizationHistory);
router.get(
  "/hospital-user-interactions",
  isAuthenticated,
  getHospitalUserInteractions
);
router.get(
  "/organization-user-interactions",
  isAuthenticated,
  getOrganizationUserInteractions
);

export default router;
