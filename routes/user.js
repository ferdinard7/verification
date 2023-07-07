const express = require("express");
// const { getAllUsers } = require("../controllers/userController");
const { registerUser, verifyOtp } = require("../controllers/userController");
const router = express.Router();


// router.get("/", getAllUsers);

router.post("/", registerUser);

router.post("/verifyOTP", verifyOtp);






module.exports = router; 