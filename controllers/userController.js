// WRAPPING THE SQL DATABASE IN A PROMISE, SO THE ASYNC CAN WORK AND IT DEOSNT SHWOING PROGRAMMING ERROR
// AND THEN IT CAN SAVE THE HASHED OTP IN THE VERIFYOTP TABLE

const db = require("../config/dbConfig");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const nodemailer = require("nodemailer");
const { promisify } = require("util");

// Create a promise-based version of db.query
const dbQuery = promisify(db.query).bind(db);

// Send OTP to the user's email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
});

// Testing success
transporter.verify((err, success) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Ready for message to be sent");
    console.log(success);
  }
});

// OTP expiration time in minutes
const otpExpirationTime = 50;

// REGISTER USER WITH EMAIL
const registerUser = async (req, res) => {
  const { email, password, fName, mName, lName, secFirm, pNum, offAdd, identity, state } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!email || !password) {
    return res.status(400).json("All fields are mandatory!");
  }

  const checkExistingEmail = "SELECT * FROM users WHERE email = ?";
  try {
    const data = await dbQuery(checkExistingEmail, [email]);

    if (data.length > 0) {
      return res.status(409).json("User already exists!");
    }

    const registrationQuery = "INSERT INTO users (email, password, fName, mName, lName, secFirm, pNum, offAdd, identity, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const result = await dbQuery(registrationQuery, [email, hashedPassword, fName, mName, lName, secFirm, pNum, offAdd, identity, state]);

    await sendOTPverificationEmail(result.insertId, email);

    return res.status(200).json("User registered successfully!");
  } catch (error) {
    return res.status(500).json("Error registering user!");
  }
};

const sendOTPverificationEmail = async (id, email) => {
  try {
    const otp = randomstring.generate({
      length: 6,
      charset: 'numeric'
    });

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + otpExpirationTime);

    const mailOptions = {
      from: process.env.USER,
      to: email,
      subject: 'Verify OTP for Registration',
      text: `Your OTP for registration is: ${otp} and it expires in ${otpExpirationTime} minutes
      .Please Do not disclose or share this code to anyone`
    };

    const hashedOTP = await bcrypt.hash(otp, 10);
    const userOTPverification = "INSERT INTO verifyotp (userId, OTP) VALUES (?, ?)";
    await dbQuery(userOTPverification, [id, hashedOTP]);

    await transporter.sendMail(mailOptions);
    console.log('Verification Email sent to: ', email);
  } catch (err) {
    console.error('Error sending email: ', err);
  }
};


const verifyOtp = async (req, res) => {
  try {
    let { id, otp } = req.body;
    if (!id || !otp) {
      return res.status(400).json("Empty OTP details are not allowed!");
    } else {
      const userOtpVerification = "SELECT * FROM verifyotp WHERE userId = ?";
      const userOTPverification = await dbQuery(userOtpVerification, [id]);

      if (userOTPverification.length <= 0) {
        return res.status(400).json("Account record doesn't exist or has already been verified!");
      } else {
        // const { expirationTime, otp: hashedOTP } = userOTPverification[0];

        const { expirationTime, OTP: hashedOTP } = userOTPverification[0];


        const currentTime = new Date(); // Get the current time

        if (expirationTime.getTime() > currentTime.getTime()) { // Compare as Date objects
          const deleteQuery = "DELETE FROM verifyotp WHERE userId = ?";
          await dbQuery(deleteQuery, [id]);
          return res.status(400).json("Code has expired. Request OTP again!");
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOTP);

          if (!validOTP) {
            return res.status(400).json("Invalid code provided. Please check your inbox!");
          } else {
            const updateUserQuery = "UPDATE users SET verified = ? WHERE id = ?";
            await dbQuery(updateUserQuery, [1, id]);

            const deleteUserQuery = "DELETE FROM users WHERE id = ?";
            await dbQuery(deleteUserQuery, [id]);

            return res.status(200).json("User email has been verified successfully!");
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Internal Server Error");
  }
};


module.exports = {
    registerUser,
    verifyOtp,
}