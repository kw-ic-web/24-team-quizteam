// mongoose/index.js
const mongoose = require("mongoose");
require('dotenv').config();

const connect = async () => {
    if (process.env.NODE_ENV !== 'production') {
        mongoose.set("debug", true);
    }
    try {
        await mongoose.connect('mongodb://localhost:27017/admin', {  // 호스트 이름을 'localhost'로 수정
            dbName: "quizgame",
        });
        console.log("MongoDB 연결 성공");
    } catch (error) {
        console.error("MongoDB 연결 에러", error);
    }
};

mongoose.connection.on('error', (error) => {
    console.error("MongoDB 연결 에러", error);
});

mongoose.connection.on('disconnected', () => {
    console.error("MongoDB 연결이 종료됨, 재연결 시도 중...");
    connect();
});

module.exports = connect;
