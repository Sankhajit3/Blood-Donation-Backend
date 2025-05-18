import multer from "multer";

const storage = multer.memoryStorage();

// Define the fields that are expected in the form
export const singleUpload = multer({ storage }).fields([
  { name: "addharImage", maxCount: 1 },
  { name: "organisationIdImage", maxCount: 1 },
  { name: "hospitalIdImage", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "idProofImage", maxCount: 1 },
]);
