const express = require("express");
const Room = require("../../mongoose/schemas/room");
const { verifyToken } = require("../middlewares");
const router = express.Router();

router.post('/create', verifyToken, async (req, res) => {
    const { title, gameType, difficulty } = req.body;
    const { userid } = req.user;

    try {
        // 중복 제목 확인
        const existingRoom = await Room.findOne({ title });
        if (existingRoom) {
            return res.status(400).json({ message: "이미 동일한 제목의 방이 존재합니다." });
        }

        // 방 생성
        const newRoom = await Room.create({
            title,
            gameType,
            difficulty,
            participants: [{ userId: userid }],
        });

        console.log('방 생성 완료:', newRoom);

        res.status(201).json({ roomId: newRoom._id });
    } catch (error) {
        console.error('방 생성 중 오류:', error);
        res.status(500).json({ message: '방 생성 중 문제가 발생했습니다.' });
    }
});

router.get("/", verifyToken, async (req, res) => {
    try {
        const rooms = await Room.find({}, { title: 1, gameType: 1, difficulty: 1, participants: 1 });
        console.log("Fetched rooms:", rooms);

        res.status(200).json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ message: "Server error occurred while fetching the rooms." });
    }
});

module.exports = router;
