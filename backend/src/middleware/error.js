function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message, err.stack?.split("\n")[1]);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({ error: "internal_error", message: err.message });
}

module.exports = { errorHandler };
