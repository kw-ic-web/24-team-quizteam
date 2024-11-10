const express = require('express');
const User = require('../../mongoose/schemas/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const path = require('path');
require("dotenv").config();

const SECRET_KEY = "your_secret_key";  // JWT 생성 시 사용할 비밀 키 (환경 변수로 설정하는 것이 좋습니다)

// 아이디 중복 확인 API
router.get("/check-duplicate-id", async (req, res) => {
    const { userid } = req.query;
    try {
        const existingUser = await User.findOne({ userid });
        res.json({ exists: !!existingUser });
    } catch (error) {
        res.status(500).json({ error: "서버 오류 발생" });
    }
});

// 회원가입 처리
router.post("/signup", async (req, res) => {
    const { userid, name, password, dob } = req.body;
    const confirmPassword = req.body['confirm-password'];

    if (password !== confirmPassword) {
        return res.status(400).send(`<script>alert("비밀번호가 일치하지 않습니다."); window.location.href = "/signup.html";</script>`);
    }

    try {
        const existingUserId = await User.findOne({ userid });
        if (existingUserId) {
            return res.status(400).send(`<script>alert("이미 존재하는 아이디입니다."); window.location.href = "/signup.html";</script>`);
        }

        // 비밀번호 암호화 후 저장
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ userid, name, password: hashedPassword, dob });
        await newUser.save();
        res.status(201).redirect('/login.html');
    } catch (error) {
        console.error(error);
        res.status(500).send(`<script>alert("서버 오류 발생: 다시 시도해주세요."); window.location.href = "/signup.html";</script>`);
    }
});

// 로그인 처리
router.post("/login", async (req, res) => {
    const { userid, password } = req.body;

    try {
        const user = await User.findOne({ userid });
        if (!user) {
            return res.status(401).send(`<script>alert("아이디 또는 비밀번호가 일치하지 않습니다."); window.location.href = "/login.html";</script>`);
        }

        // 비밀번호 비교
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send(`<script>alert("아이디 또는 비밀번호가 일치하지 않습니다."); window.location.href = "/login.html";</script>`);
        }

        // JWT 생성 및 발급
        const token = jwt.sign({ userid: user.userid }, SECRET_KEY, { expiresIn: '1h' });
        res.send(`
            <script>
                localStorage.setItem('token', '${token}');
                window.location.href = "/start.html";
            </script>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send(`<script>alert("서버 오류 발생"); window.location.href = "/login.html";</script>`);
    }
});

// Authorization 헤더에서 토큰을 검증하는 미들웨어
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.redirect('/login.html');
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.redirect('/login.html');
    }
}

// 인증이 필요한 경로
router.get("/start.html", verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/start.html'));
});

// 사용자의 ID 정보를 반환하는 API
router.get("/userinfo", verifyToken, async (req, res) => {
    try {
        const { userid } = req.user; // verifyToken 미들웨어에서 토큰에서 추출한 userid
        const user = await User.findOne({ userid }); // 데이터베이스에서 사용자 조회
        if (!user) {
            return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }
        res.json({ userid: user.userid }); // 사용자 ID 반환
    } catch (error) {
        console.error("사용자 정보를 가져오는 중 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
});


module.exports = router;
