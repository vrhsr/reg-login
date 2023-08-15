const handleValidationError = (err, req, res, next) => {
    // Check if it's a validation error from Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((el) => el.message);
      const message = 'Validation Error';
      const statusCode = 400;
      return res.status(statusCode).json({
        status: 'error',
        message,
        errors,
      });
    }
  
    // If it's not a validation error, pass it to the next middleware
    next(err);
  };
  
  module.exports = { handleValidationError };
  