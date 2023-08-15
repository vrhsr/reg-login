const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Please tell us your first name!"],
  },
  lastName: {
    type: String,
    required: [true, "Please tell us your last name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  institutionalAddress: {
    type: String,
    required: [true, "Please provide your institution address"],
  },
  contactAddress: {
    type: String,
    required: [true, "Please provide your contact address"],
  },
  aboutInfo: {
    type: String,
  },
  nationality: {
    type: String,
    required: [true, "Please provide your nationality"],
  },
  phoneNumber: {
    type: String,
    // minlength: [10, 'Phone number should have 10 digits'],
    // maxlength: [10, 'Phone number should have 10 digits'],
    required: [true, "Please enter your phone number"],
  },
  birthday: {
    type: String,
  },
  city: {
    type: String,
    default: "Not specified",
  },
  career: {
    type: String,
    default: "Not specified",
  },
  gender: {
    type: String,
    default: "Not specified",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    // minlength: [8, 'Password should be at least 8 characters long'],
    // select: false
  },
  // confirmPassword: {
  //   type: String,
  //   required: [true, "Please confirm your password"],
  //   // validate: {
  //   //   validator: function (el) {
  //   //     return el === this.password;
  //   //   },
  //   //   message: 'Passwords are not the same!'
  //   // }
  // },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true, // New users will be active by default
    select: false, // This will exclude 'active' field from query results by default
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
