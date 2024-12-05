const express = require("express");
const Room = require("../../mongoose/schemas/room");
const { verifyToken } = require("../middlewares");
const router = express.Router();

router.post('/create', verifyToken, async (req, res) => {
    const { title, gameType, difficulty } = req.body;
    const { userid } = req.user;

    try {
        console.log(`방 생성 요청: title=${title}, gameType=${gameType}, difficulty=${difficulty}`);

        // 요청 데이터 검증
        if (!title || !gameType || !difficulty) {
            console.warn("누락된 요청 데이터:", { title, gameType, difficulty });
            return res.status(400).json({ message: "모든 필드를 입력해주세요." });
        }

        // 중복 제목 확인
        const existingRoom = await Room.findOne({ title });
        if (existingRoom) {
            console.warn(`중복된 방 제목 요청: title=${title}`);
            return res.status(400).json({ message: "이미 동일한 제목의 방이 존재합니다." });
        }

        // 고유 roomId 생성
        const roomId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRoom = await Room.create({
            roomId, // 문자열 형식의 roomId
            title,
            gameType,
            difficulty,
            participants: [{ userId: userid }]
        });

        console.log('방 생성 완료:', {
            roomId: newRoom.roomId,
            title: newRoom.title,
            gameType: newRoom.gameType,
            difficulty: newRoom.difficulty
        });

        // 성공 응답
        res.status(201).json({ roomId: newRoom.roomId, message: "방 생성이 완료되었습니다." });
    } catch (error) {
        console.error('방 생성 중 오류 발생:', error);

        // 데이터베이스 오류 처리
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "입력값이 유효하지 않습니다.", details: error.errors });
        }

        res.status(500).json({ message: '방 생성 중 문제가 발생했습니다. 다시 시도해주세요.' });
    }
});

router.get("/:roomId", verifyToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        console.log(`방 상세 정보 요청: roomId=${roomId}`);

        // roomId로 방 정보 검색
        const room = await Room.findOne({ roomId }, { 
            title: 1, 
            gameType: 1, 
            difficulty: 1, 
            participants: 1 
        });

        if (!room) {
            console.warn(`존재하지 않는 방 요청: roomId=${roomId}`);
            return res.status(404).json({ message: "해당 방을 찾을 수 없습니다." });
        }

        console.log("방 상세 정보 반환:", room);
        res.status(200).json(room);
    } catch (error) {
        console.error("방 상세 정보 조회 중 오류:", error);
        res.status(500).json({ message: "방 정보를 가져오는 중 오류가 발생했습니다." });
    }
});


router.get("/", verifyToken, async (req, res) => {
    try {
        const rooms = await Room.find({}, { title: 1, gameType: 1, difficulty: 1, participants: 1 });
        console.log("방 목록 반환:", rooms); // 반환되는 데이터 로그

        res.status(200).json(rooms);
    } catch (error) {
        console.error("방 목록 조회 중 오류:", error);
        res.status(500).json({ message: "방 목록을 가져오는 중 오류가 발생했습니다." });
    }
});

// 방 나가기
router.post("/leave", verifyToken, async (req, res) => {
    const { roomId } = req.body;
    const { userid } = req.user;

    try {
        console.log(`방 나가기 요청: roomId=${roomId}, userId=${userid}`);

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "해당 방을 찾을 수 없습니다." });
        }

        // 방 참가자 목록에서 사용자 제거
        room.participants = room.participants.filter(participant => participant.userId !== userid);

        if (room.participants.length === 0) {
            // 참가자가 없으면 방 삭제
            await Room.deleteOne({ roomId });
            console.log(`참가자가 없어 방이 삭제되었습니다: roomId=${roomId}`);
        } else {
            // 참가자가 남아 있으면 방 정보 업데이트
            await room.save();
            console.log(`사용자가 방에서 나갔습니다: roomId=${roomId}, userId=${userid}`);
        }

        res.status(200).json({ message: "방에서 나갔습니다." });
    } catch (error) {
        console.error("방 나가기 처리 중 오류:", error);
        res.status(500).json({ message: "방 나가기 처리 중 문제가 발생했습니다." });
    }
});

module.exports = router;
