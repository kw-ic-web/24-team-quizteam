const express = require('express');
const User = require('../../mongoose/schemas/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const path = require('path');
const { userScores }=require("../../modules/socketHandler");
require("dotenv").config();

const SECRET_KEY = "your_secret_key"; // JWT 생성 시 사용할 비밀 키 (환경 변수로 설정하는 것이 좋습니다)

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

//로그인
router.post("/login", async (req, res) => {
    const { userid, password } = req.body;

    try {
        const user = await User.findOne({ userid });
        if (!user) {
            return res.status(401).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
        }

        // 비밀번호 비교
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
        }

        // JWT 생성 및 발급
        const token = jwt.sign({ userid: user.userid }, SECRET_KEY, { expiresIn: '1h' });

        // JSON으로 응답
        res.json({ userid: user.userid, token, character: user.character });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류 발생" });
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

// 사용자 정보 반환 API
router.get("/userinfo", verifyToken, async (req, res) => {
    try {
        const { userid } = req.user; // verifyToken 미들웨어에서 추출한 userid
        const user = await User.findOne({ userid }); // 데이터베이스에서 사용자 정보 조회

        if (!user) {
            return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }

        res.json({
            userid: user.userid,
            character: user.character || 'A' // 데이터베이스에 없는 경우 기본값 반환
        });
    } catch (error) {
        console.error("사용자 정보를 가져오는 중 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
});


// 사용자 캐릭터 업데이트 API
router.post("/update-character", verifyToken, async (req, res) => {
    const { character } = req.body;
    const { userid } = req.user;

    try {
        const user = await User.findOneAndUpdate(
            { userid },
            { $set: { character } },
            { new: true } // 업데이트 후의 최신 문서 반환
        );

        if (!user) {
            return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }

        res.json({ success: true, character: user.character });
    } catch (error) {
        console.error("캐릭터 업데이트 중 오류:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
});

// 순위 데이터 반환 API
router.get("/ranking", (req, res) => {
    try {
        const ranking = Array.from(userScores)
            .sort(([, a], [, b]) => b - a) // 점수 기준 내림차순 정렬
            .map(([userId, score], index) => ({
                userId,
                correctAnswers: score,
                rank: index + 1,
            }));

        console.log("최종 순위 데이터:", ranking);
        res.json(ranking); // 클라이언트에 순위 데이터 전송
    } catch (error) {
        console.error("순위 데이터 처리 중 오류:", error);
        res.status(500).json({ error: "순위 데이터를 가져오는 중 오류가 발생했습니다." });
    }
});



router.post("/increment-correct-answers", verifyToken, async (req, res) => {
    const { userid } = req.user;

    try {
        await User.updateOne({ userid }, { $inc: { correctAnswers: 1 } });
        res.status(200).json({ message: "정답 점수 증가 완료" });
    } catch (error) {
        console.error("점수 증가 중 오류:", error);
        res.status(500).json({ error: "점수 증가 중 서버 오류 발생" });
    }
});

router.post("/reset-scores", (req, res) => {
    userScores.forEach((value, key) => {
        userScores.set(key, 0); // 점수 초기화
    });

    console.log("모든 사용자의 점수가 초기화되었습니다.");
    res.status(200).json({ message: "점수가 초기화되었습니다." });
});

router.post("/end-game", verifyToken, async (req, res) => {
    const { userid } = req.user;
    const { isCorrect } = req.body; // 마지막 정답 여부

    try {
        // 최종 점수 가져오기
        const user = await User.findOne({ userid });
        const score = user.correctAnswers;

        // 점수 초기화
        await User.updateOne({ userid }, { correctAnswers: 0 });

        res.status(200).json({ message: "게임 종료", score });
    } catch (error) {
        console.error("게임 종료 중 오류:", error);
        res.status(500).json({ error: "게임 종료 실패" });
    }
});



module.exports = router;
