const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./mongoose/index'); // MongoDB 연결 함수
const indexRouter = require('./routes/index'); // 메인 라우터
const userRouter = require('./routes/api/users'); // 사용자 관련 API 라우터
const quizRouter = require('./routes/api/quiz'); // Quiz 관련 라우터
const roomsRouter = require('./routes/api/rooms');
const { verifyToken } = require('./routes/middlewares'); // JWT 검증 미들웨어

const app = express();

// MongoDB 연결
connectDB();

// 미들웨어 설정
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors()); // CORS 추가
app.use(express.static(path.join(__dirname, 'public')));

// 라우터 설정
app.use('/', indexRouter);
app.use('/api/users', userRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/rooms', roomsRouter);

// 보호된 경로
app.use('/start', verifyToken, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'views/start.html'));
});

app.get('/waitingRoom', (req, res) => {
    const user = req.user;
    if (!user) {
        return res.redirect('/login');
    }
    res.render('waitingRoom', { username: user.userid });
});

// 404 에러 핸들러
app.use((req, res, next) => {
    console.log('404 Error:', req.url);
    next(createError(404, 'Page not found'));
});

// 에러 핸들러
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(
        `<h1>Error ${err.status || 500}</h1>
         <p>${err.message}</p>`
    );
});

module.exports = app; // Express 애플리케이션 인스턴스만 내보냄
