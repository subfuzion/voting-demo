const cookieParser = require('cookie-parser');
const express = require('express');
const logger = require('morgan');
const nunjucks = require('nunjucks');
const path = require('path');

const indexRouter = require('./routes/index');

const app = express();

nunjucks.configure('views', {
  autoescape:  true,
  express:  app
})

// noinspection JSCheckFunctionSignatures
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
