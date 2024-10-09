const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const setresetPasswordMail = async (email, resetLink) => {
  // Define the path to the HTML template
  const templatePath = path.join(__dirname, "forgotpassTemp.html");

  // Read the HTML template
  let htmlContent;
  try {
    htmlContent = fs.readFileSync(templatePath, "utf8");
  } catch (error) {
    console.error("Error reading HTML template:", error);
    throw new Error("Failed to read email template");
  }

  // Replace placeholder in the HTML template with actual reset link
  htmlContent = htmlContent.replace("{{resetLink}}", resetLink);

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset Request",
    html: htmlContent, // Set the HTML content
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: " + info.response);
  } catch (error) {
    console.error("Error sending password reset email: ", error);
    throw new Error("Failed to send password reset email");
  }
};

module.exports = { setresetPasswordMail };





// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.PASSWORD,
//   },
// });

// const setresetPasswordMail = async (email, otp) => {
//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: email,
//     subject: "Your OTP Code",
//     text: `Your OTP code is ${otp}`,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("OTP sent: " + info.response);
//   } catch (error) {
//     throw new Error("Failed to send OTP");
//   }
// };

// module.exports = { setresetPasswordMail };
