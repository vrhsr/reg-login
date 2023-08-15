const User = require('../model/userModel.js');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};



exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

// Function to create a new user
exports.createUser = catchAsync(async (req, res, next) => {
  // Get user data from the request body
  const { name, email, password, passwordConfirm } = req.body;

  // Create the new user in the database
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  // Respond with the newly created user
  res.status(201).json({
    status: 'success',
    data: { user: newUser },
  });
});






exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid user ID', 400));
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // 1. Check if the user exists
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 2. Filter out the fields that are allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email', 'avatar');

  // 3. Update the user document with the filtered data
  Object.assign(user, filteredBody);
  await user.save();

  // 4. Send the updated user document as the response
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
exports.deleteUser = catchAsync(async (req, res, next) => {
  // 1. Find the user by id
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 2. Set the 'active' field to false to deactivate the user
  user.active = false;
  await user.save();

  // 3. Send a success response
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateMyProfile = catchAsync(async (req, res, next) => {
  // 1. Get the user document from the database using the authenticated user's ID
  const user = await User.findById(req.user.id);

  // 2. Filter out the fields that are allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3. Update the user document with the filtered data
  Object.assign(user, filteredBody);
  await user.save();

  // 4. Send the updated user document as the response
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getMyProfile = catchAsync(async (req, res, next) => {
  // Find the user based on the authenticated user's ID (provided by the protect middleware)
  const user = await User.findById(req.user.id);

  // If no user found, throw an error
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Send the user's profile information as the response
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});