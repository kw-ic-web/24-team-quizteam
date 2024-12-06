const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken } = require("./middlewares");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { id, nick } = req.body;
        if (!id || !nick) {
            return res.status(400).json({ code: 400, message: "id와 nick이 필요합니다." });
        }

        const token = jwt.sign(
            { id, nick },
            process.env.JWT_SECRET || "defaultSecret",
            { expiresIn: "10m", issuer: "hcclab" }
        );

        res.json({
            code: 200,
            message: "토큰이 발급되었습니다.",
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "서버 에러",
        });
    }
});

/**
 * 토큰 검증 라우트
 */
router.get("/test", verifyToken, (req, res) => {
    res.json({
        code: 200,
        message: "토큰이 유효합니다.",
        decoded: req.decoded,
    });
});

/**
 * 토큰 재발급 라우트
 */
router.post("/refresh", (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecret", { ignoreExpiration: true });
        
        // 만료되지 않은 토큰은 재발급하지 않음
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp > currentTime) {
            return res.status(400).json({
                code: 400,
                message: "토큰이 아직 유효합니다. 재발급이 필요하지 않습니다.",
            });
        }

        const newToken = jwt.sign(
            { id: decoded.id, nick: decoded.nick },
            process.env.JWT_SECRET || "defaultSecret",
            { expiresIn: "10m", issuer: "hcclab" }
        );

        res.json({
            code: 200,
            message: "토큰이 재발급되었습니다.",
            token: newToken,
        });
    } catch (error) {
        console.error("토큰 재발급 실패:", error);
        res.status(403).json({
            code: 403,
            message: "유효하지 않은 토큰입니다.",
        });
    }
});

module.exports = router;
