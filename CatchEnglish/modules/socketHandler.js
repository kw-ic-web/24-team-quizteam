const { Server } = require("socket.io");
const userMap = new Map(); // socket.id와 userid 매핑
const rooms = []; // 생성된 방 목록 저장
const userScores = new Map(); // userId와 정답 수 매핑
const User = require("../mongoose/schemas/user");

const socketHandler = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000", // CORS 설정
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("새로운 사용자가 연결되었습니다:", socket.id);
        socket.emit("updateRoomList", rooms);

        // 사용자 등록 처리
        socket.on("register", (userid) => {
            if (userid) {
                userMap.set(socket.id, userid);

                if (!userScores.has(userid)) {
                    userScores.set(userid, 0); // 초기 점수 설정
                }

                console.log(`사용자 등록 완료: socket.id=${socket.id}, userid=${userid}`);
            } else {
                console.warn(`userid가 제공되지 않았습니다: socket.id=${socket.id}`);
            }
        });

        // 사용자 정보 요청 처리
        socket.on("request user info", () => {
            const userId = userMap.get(socket.id) || "Guest";
            socket.emit("user info", { userId });
        });

        // 채팅 메시지 처리
        socket.on("chatMessage", ({ roomId, message }) => {
            const userId = userMap.get(socket.id) || "알 수 없는 사용자";
            if (roomId) {
                io.to(roomId).emit("chatMessage", { user: userId, message });
            } else {
                io.emit("chatMessage", { user: userId, message });
            }
        });

        // 방 생성 처리
        socket.on("createRoom", (roomData) => {
            const roomId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newRoom = {
                id: roomId,
                ...roomData,
                hostId: roomData.host,
                participants: [{ userId: roomData.host, character: roomData.hostCharacter || "A" }],
                isStarted: false,
            };

            rooms.push(newRoom);
            socket.emit("roomJoined", newRoom);
            io.emit("roomCreated", newRoom);
            socket.join(roomId);
            io.to(roomId).emit("updatePlayers", newRoom.participants);
        });

        // 방 참가 처리
        socket.on("joinRoom", ({ roomId, userId, character }) => {
            const room = rooms.find((room) => room.id === roomId);

            if (!room) {
                socket.emit("roomJoinError", { message: "방을 찾을 수 없습니다." });
                return;
            }

            // 이미 참가 중인지 확인
            const isAlreadyJoined = room.participants.some((participant) => participant.userId === userId);
            if (isAlreadyJoined) {
                console.warn(`이미 방에 참가 중입니다: roomId=${roomId}, userId=${userId}`);
                socket.emit("roomJoinError", { message: "이미 방에 참가 중입니다." });
                return;
            }

            if (room.participants.length >= (room.maxParticipants || 4)) {
                socket.emit("roomJoinError", { message: "방 정원이 초과되었습니다." });
                return;
            }

            const defaultCharacter = "defaultCharacter"; // 기본 캐릭터 설정
            character = character || defaultCharacter;

            socket.join(roomId);
            room.participants.push({ userId, character });
            io.to(roomId).emit("userStatus", `${userId} 님이 방에 참가했습니다.`);
            io.to(roomId).emit("updatePlayers", room.participants);
        });

        // 방 나가기 처리
        socket.on("leaveRoom", ({ roomId, userId }) => {
            const room = rooms.find((r) => r.id === roomId);
            if (room) {
                room.participants = room.participants.filter((p) => p.userId !== userId);
                console.log(`사용자가 방에서 나갔습니다: roomId=${roomId}, userId=${userId}`);

                socket.leave(roomId);

                if (room.participants.length === 0) {
                    const roomIndex = rooms.findIndex((r) => r.id === roomId);
                    if (roomIndex > -1) {
                        rooms.splice(roomIndex, 1);
                        console.log(`참가자가 없어 방이 삭제되었습니다: roomId=${roomId}`);
                    }
                }

                io.emit("updateRoomList", rooms);
                io.to(roomId).emit("updatePlayers", room.participants);
            } else {
                console.warn(`방을 찾을 수 없습니다: roomId=${roomId}`);
            }
        });

        // 게임 시작 처리
        socket.on("startGame", ({ roomId }) => {
            const room = rooms.find((r) => r.id === roomId);
            const userId = userMap.get(socket.id);

            if (!room) {
                socket.emit("startGameError", { message: "방을 찾을 수 없습니다." });
                return;
            }

            if (room.hostId !== userId) {
                socket.emit("startGameError", { message: "게임 시작 권한이 없습니다." });
                return;
            }

            room.isStarted = true;
            io.to(roomId).emit("gameStarted", { message: "게임이 시작되었습니다!" });
            io.emit("updateRoomList", rooms);
        });

        // 정답 확인 처리
        socket.on("check answer", ({ answer, correctAnswer, userId, roomId }) => {
            const room = rooms.find((r) => r.id === roomId);

            if (!room) {
                console.error(`방을 찾을 수 없습니다: roomId=${roomId}`);
                return;
            }

            const isCorrect = answer.trim().toLowerCase() === correctAnswer.toLowerCase();

            if (isCorrect) {
                userScores.set(userId, (userScores.get(userId) || 0) + 1);

                const ranking = Array.from(userScores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([userId, score]) => ({ userId, score }));

                io.to(roomId).emit("updateRanking", ranking);
            }

            io.to(roomId).emit("answer result", { isCorrect, userId });
        });

        // 순위 요청 처리
        socket.on("requestRanking", () => {
            const ranking = Array.from(userScores)
                .sort(([, a], [, b]) => b - a)
                .map(([userId, score]) => ({ userId, score }));

            socket.emit("updateRanking", ranking);
        });

        // 퀴즈 종료 처리
        socket.on("endQuiz", ({ roomId }) => {
            const room = rooms.find((r) => r.id === roomId);
            if (!room) {
                console.error(`방을 찾을 수 없습니다: roomId=${roomId}`);
                return;
            }

            io.to(roomId).emit("quizEnd");
        });

        // 방 목록 요청 처리
        socket.on("requestRoomList", () => {
            socket.emit("updateRoomList", rooms);
        });

        // 연결 해제 처리
        socket.on("disconnect", () => {
            const userid = userMap.get(socket.id);
            if (userid) {
                rooms.forEach((room) => {
                    const index = room.participants.findIndex((p) => p.userId === userid);
                    if (index !== -1) {
                        room.participants.splice(index, 1);
                        console.log(`연결 해제된 사용자가 방에서 제거되었습니다: roomId=${room.id}, userId=${userid}`);

                        io.to(room.id).emit("updatePlayers", room.participants);
                    }
                });

                io.emit("userStatus", `${userid} 님이 퇴장했습니다.`);
                userMap.delete(socket.id);
            } else {
                console.warn(`연결 해제된 사용자: socket.id=${socket.id} (userid 없음)`);
            }
            console.log("사용자가 연결 해제되었습니다:", socket.id);
        });
    });
};

module.exports = { socketHandler, userScores };
