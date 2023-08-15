const express = require('express');
const app = express();
const errorController = require('./controller/errorController')
const userRouter = require('./routes/userRouter.js');

const dotenv = require('dotenv');
dotenv.config();


app.use(express.json())

// Import user controller functions (e.g., createUser, getUser, etc.)
const authController = require('./controller/authController');

app.use('/api/v1/users', userRouter);
app.use(express.json);

app.use(errorController.handleValidationError);
module.exports = app;
