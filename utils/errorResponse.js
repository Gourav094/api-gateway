function sendError(res, status, error, message, requestId) {
    return res.status(status).json({
      error,
      message,
      requestId
    });
}

module.exports = { sendError };
