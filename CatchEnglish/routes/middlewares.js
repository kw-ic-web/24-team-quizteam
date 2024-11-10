exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ code: 401, message: "토큰이 없습니다. 로그인해주세요." });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "defaultSecret";

    try {
        const decoded = jwt.verify(token, secret); // 토큰 검증 및 디코딩
        req.user = decoded; // req.user에 userid 정보 저장
        next();
    } catch (error) {
        console.error("JWT 검증 실패:", error);
        if (error.name === "TokenExpiredError") {
            return res.status(419).json({ code: 419, message: "토큰이 만료되었습니다." });
        }
        return res.status(403).json({ code: 403, message: "유효하지 않은 토큰입니다." });
    }
};
