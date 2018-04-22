// catch 404 and forward to error handler
exports.catch404 = (req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

// error handler
exports.erroHandler = (err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  //logger.log('notice', 'A user tried to access ' + )
  // render the error page
  res.status(err.status || 500);
  res.render('error');
};