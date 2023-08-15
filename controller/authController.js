const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../model/userModel.js");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    ...req.body,
    
  });

  createSendToken(newUser, 201, res);
});

exports.emailSignup = catchAsync(async (req, res, next) => {
  const OTP = req.body.OTP;
  const email = req.body.email;
  const currentUser = await User.findOne({ email });

  // Check if a user with the email already exists
  if (currentUser) {
    return next(new AppError('A user with this email already exists.', 401));
  }

  try {
    // Send the password reset email
    await sendEmail({
      email: email,
      subject: 'Your password reset token (valid for 10 minutes)',
      OTP,
    });

    // Respond with success message
    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email!',
    });
  } catch (err) {
    // Handle email sending error
    console.log('Error: ' + err.message);
    throw new AppError('Unable to send OTP.', 500); // Missing "throw" statement
  }
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist.", 401)
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  // Lines added
  const OTP = req.body.OTP;
  // --------
  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }

  // Generate a random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Save the hashed reset token and expiration time in the user object
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

  // Save the user object with the hashed token and expiration time
  await user.save({ validateBeforeSave: false });

  // Compose the reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetPassword/${resetToken}`;

  // Compose the email message
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;
  try {
    // Send the password reset email
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      OTP,
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
      resetToken,
    });
  } catch (err) {
    // Handle email sending error
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(err);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log(req.params);
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  try {
    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.password;
    user.passwordResetToken = req.params.token;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    console.log(err);
  }
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // Find the user based on the verification token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  // If no user found or token has expired, throw an error
  if (!user) {
    return next(
      new AppError("Invalid verification token or token has expired.", 400)
    );
  }

  // Update the email verification fields in the user document
  user.email = user.newEmail;
  user.newEmail = undefined;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Send a response indicating that the email has been verified successfully
  res.status(200).json({
    status: "success",
    message: "Email address has been verified successfully.",
  });
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    roles: ["admin", "lead"];
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you don't have permission to perform this action", 401)
      );
    }
    next();
  };
};
