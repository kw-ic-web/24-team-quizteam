const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const connectDB = require('./mongoose/index'); // MongoDB 연결 함수 가져오기

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiusersRouter = require('./routes/api/users');

const app = express();

connectDB(); // MongoDB 연결을 실행

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/users', apiusersRouter);

module.exports = app;
