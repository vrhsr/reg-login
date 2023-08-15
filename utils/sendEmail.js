const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: "vrhsr5@gmail.com",
      pass: "fygmokjvvvgkhvmq",
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "Venkate Ramanan <mvrhsr@gmail.com>",
    to: options.email,
    subject: "PASSWORD RECOVERY",
    html: `<!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>CodePen - OTP Email Template</title>
  

</head>
<body>
<!-- partial:index.partial.html -->
<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
      <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">CTBC</a>
    </div>
    <p style="font-size:1.1em">Hi,</p>
    <p>Thank you for choosing CTBC. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 10 minutes</p>
    <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${options.OTP}</h2>
    <p style="font-size:0.9em;">Regards,<br />Koding 101</p>
    <hr style="border:none;border-top:1px solid #eee" />
    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
      <p>CTBC</p>
      <p>KOCHI</p>
      <p>KERALA</p>
    </div>
  </div>
</div>
<!-- partial -->
  
</body>
</html>`,

    // to: options.email,
    // subject: options.subject,
    // text: options.message
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
