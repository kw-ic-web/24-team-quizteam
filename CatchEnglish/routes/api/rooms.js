const express = require("express");
const Room = require("../../mongoose/schemas/room");
const { verifyToken } = require("../middlewares");
const router = express.Router();

/**
 * 방 생성 API
 */
router.post("/create", verifyToken, async (req, res) => {
    const { title, gameType, difficulty } = req.body;
    const { userid } = req.user;

    try {
        const newRoom = await Room.create({
            title,
            gameType,
            difficulty,
            participants: [{ userId: userid }],
        });
        res.status(201).json({ roomId: newRoom._id });
    } catch (error) {
        console.error("방 생성 오류:", error);
        res.status(500).json({ message: "방 생성 중 오류가 발생했습니다." });
    }
});


/**
 * 방 참가 API
 */
router.put("/:roomId/join", verifyToken, async (req, res) => {
    const { roomId } = req.params;
    const { userid } = req.user;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "방을 찾을 수 없습니다." });
        }

        // 방이 가득 찼는지 확인
        if (room.isFull) {
            return res.status(400).json({ message: "방이 가득 찼습니다." });
        }

        // 참가자 추가
        room.participants.push({ userId: userid });
        await room.save();

        res.status(200).json({ message: "방에 참가했습니다." });
    } catch (error) {
        console.error("방 참가 중 오류:", error);
        res.status(500).json({ message: "방 참가 중 서버 오류가 발생했습니다." });
    }
});


/**
 * 방 나가기 API
 */
router.put("/:roomId/leave", verifyToken, async (req, res) => {
    const { roomId } = req.params;
    const userId = req.decoded.id;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        // 참가자 목록에서 사용자 제거
        room.participants = room.participants.filter(participant => participant.userId !== userId);

        // 참가자가 없으면 방 삭제
        if (room.participants.length === 0) {
            await room.deleteOne();
            console.log(`Room deleted as it became empty: ${roomId}`);
            return res.status(200).json({ message: "Room deleted as it became empty." });
        }

        await room.save();
        console.log("User left the room:", { roomId, userId });

        res.status(200).json({
            message: "Successfully left the room.",
            participants: room.participants,
        });
    } catch (error) {
        console.error("Error leaving room:", error);
        res.status(500).json({ message: "Server error occurred while leaving the room." });
    }
});

/**
 * 모든 방 목록 조회 API
 */
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
