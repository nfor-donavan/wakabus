/**
 * Express 4 does NOT automatically catch a rejected promise thrown inside an
 * async route handler — it becomes an unhandled promise rejection, which
 * (in current Node versions) crashes the entire process by default.
 *
 * Wrapping every controller in this turns that into a normal next(err) call,
 * which server.js's error-handling middleware turns into a clean 500
 * response instead of taking the whole server down.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
