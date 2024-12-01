const jwt = require("jsonwebtoken"); // jsonwebtoken 모듈 가져오기

const SECRET_KEY = "your_secret_key"; // 환경 변수로 관리하는 것이 좋음

// JWT 인증 미들웨어
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ message: "인증 정보가 없습니다." });
    }

    const token = authHeader.split(" ")[1]; // Bearer 뒤의 토큰 값 추출
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // 인증된 사용자 정보 저장
        next(); // 다음 미들웨어로 전달
    } catch (error) {
        console.error("JWT 검증 실패:", error);
        res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};
