const mongoose = require("mongoose");

const connect = async () => {
    try {
        // MongoDB Atlas 연결 (프로덕션 환경)
        await mongoose.connect('mongodb+srv://rlaxoals132:13579@catchenglishdb.kwz12.mongodb.net/?retryWrites=true&w=majority&appName=CatchEnglishDB', {
            dbName: "quizgame",
        });
        console.log("MongoDB Atlas 연결 성공");
    } catch (error) {
        console.error("MongoDB 연결 에러:", error);
    }
};

// 연결 에러 처리
mongoose.connection.on('error', (error) => {
    console.error("MongoDB 연결 에러:", error);
});

// 연결 종료 시 재연결 시도
mongoose.connection.on('disconnected', () => {
    console.error("MongoDB 연결이 종료됨, 재연결 시도 중...");
    connect();
});

module.exports = connect;
