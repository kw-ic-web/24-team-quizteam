const { Server } = require('socket.io');
const userMap = new Map(); // socket.id와 userid 매핑
const rooms = []; // 생성된 방 목록 저장
const userScores = new Map(); // userId와 정답 수 매핑

const socketHandler = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000", // CORS 설정
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("새로운 사용자가 연결되었습니다:", socket.id);

        // 사용자 등록 처리
        socket.on("register", (userid) => {
            if (userid) {
                userMap.set(socket.id, userid); // socket.id와 userid 매핑

                if (!userScores.has(userid)) {
                    userScores.set(userid, 0); // 초기 점수 설정
                }

                console.log(`사용자 등록 완료: socket.id=${socket.id}, userid=${userid}`);

                // 초기 순위 업데이트
                const ranking = Array.from(userScores)
                    .sort(([, a], [, b]) => b - a) // 정답 수 기준 내림차순 정렬
                    .map(([userId, score]) => ({ userId, score }));

                socket.emit("updateRanking", ranking); // 새로 등록된 사용자에게 순위 전송
                io.emit("userStatus", `${userid} 님이 입장했습니다.`);
            } else {
                console.warn(`userid가 제공되지 않았습니다: socket.id=${socket.id}`);
            }
        });

        // 사용자 정보 요청 처리
        socket.on("request user info", () => {
            const userId = userMap.get(socket.id) || "Guest"; // 기본값으로 Guest 사용
            socket.emit("user info", { userId }); // 사용자 정보 전송
        });

        // 채팅 메시지 처리
        socket.on("chatMessage", (data) => {
            const userid = userMap.get(socket.id) || "알 수 없는 사용자"; // 사용자 ID 가져오기
            console.log(`메시지 수신: ${userid}: ${data.message}`);
            io.emit("chatMessage", { user: userid, message: data.message }); // 메시지를 모든 사용자에게 전송
        });

        // 정답 확인 처리
        socket.on("check answer", (data) => {
            const { answer, correctAnswer } = data;
            const userId = userMap.get(socket.id);

            if (answer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
                if (userId) {
                    userScores.set(userId, (userScores.get(userId) || 0) + 1); // 정답 수 증가
                    console.log(`정답 처리 완료: userId=${userId}, score=${userScores.get(userId)}`);
                }

                // 순위 업데이트
                const ranking = Array.from(userScores)
                    .sort(([, a], [, b]) => b - a) // 정답 수 기준 내림차순 정렬
                    .map(([userId, score]) => ({ userId, score }));

                io.emit("updateRanking", ranking); // 모든 클라이언트에 순위 전송
            }

            io.emit("answer result", { isCorrect: answer.trim().toLowerCase() === correctAnswer.toLowerCase(), userId });
        });

        // 순위 요청 처리
        socket.on("requestRanking", () => {
            const ranking = Array.from(userScores)
                .sort(([, a], [, b]) => b - a) // 정답 수 기준 내림차순 정렬
                .map(([userId, score]) => ({ userId, score }));

            socket.emit("updateRanking", ranking); // 요청한 클라이언트에 순위 전송
        });

        // 사용자 연결 해제 처리
        socket.on("disconnect", () => {
            const userid = userMap.get(socket.id); // 연결 해제된 사용자 ID 가져오기
            if (userid) {
                io.emit("userStatus", `${userid} 님이 퇴장했습니다.`); // 사용자 상태 알림
                userMap.delete(socket.id); // 매핑에서 사용자 제거
            } else {
                console.warn(`연결 해제된 사용자: socket.id=${socket.id} (userid 없음)`);
            }
            console.log("사용자가 연결 해제되었습니다:", socket.id);
        });

        // 방 참가 처리
        socket.on("joinRoom", ({ roomId, userId }) => {
            const room = rooms.find(room => room.id === roomId); // 방 ID로 방 찾기

            if (room) {
                // 방 정원 초과 여부 확인
                if (room.participants.length >= (room.maxParticipants || 4)) {
                    socket.emit("roomJoinError", { message: "방 정원이 초과되었습니다." });
                    return;
                }

                // 참가자를 방에 추가
                room.participants.push({ userId });
                console.log(`방에 참가: roomId=${roomId}, userId=${userId}`);

                // 사용자에게 방 참가 성공 알림
                socket.emit("roomJoined", room);

                // 초기 점수 0으로 세팅 (이미 등록된 사용자면 무시)
                if (!userScores.has(userId)) {
                    userScores.set(userId, 0);
                }

                // 현재 방의 순위 업데이트
                const ranking = Array.from(userScores)
                    .sort(([, a], [, b]) => b - a) // 정답 수 기준 내림차순 정렬
                    .map(([userId, score]) => ({ userId, score }));

                io.to(roomId).emit("updateRanking", ranking); // 방에 있는 사용자들에게만 순위 전송

                // 모든 사용자에게 업데이트된 방 목록 알림
                io.emit("updateRoomList", rooms);
            } else {
                socket.emit("roomJoinError", { message: "방을 찾을 수 없습니다." });
            }
        });


        // 방 생성 처리
        socket.on("createRoom", (roomData) => {
            const roomId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // 고유 방 ID 생성
            const newRoom = {
                id: roomId,
                ...roomData,
                participants: [{ userId: roomData.host }], // 방장 추가
            };

            rooms.push(newRoom); // 방 목록에 추가
            console.log(`방 생성 완료: roomId=${roomId}, title=${roomData.title}`);

            // 방 생성자에게 방 참가 성공 알림
            socket.emit("roomJoined", newRoom);

            // 모든 사용자에게 새 방 정보 알림
            io.emit("roomCreated", newRoom);
        });

        socket.on("leaveRoom", ({ roomId, userId }) => {
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                // 참가자 목록에서 사용자 제거
                room.participants = room.participants.filter(p => p.userId !== userId);
                console.log(`사용자가 방에서 나갔습니다: roomId=${roomId}, userId=${userId}`);
        
                // 참가자가 없으면 방 삭제
                if (room.participants.length === 0) {
                    const roomIndex = rooms.findIndex(r => r.id === roomId);
                    if (roomIndex > -1) {
                        rooms.splice(roomIndex, 1);
                        console.log(`참가자가 없어 방이 삭제되었습니다: roomId=${roomId}`);
                    }
                }
        
                // 모든 클라이언트에게 업데이트된 방 목록 전송
                io.emit("updateRoomList", rooms);
            } else {
                console.warn(`방을 찾을 수 없습니다: roomId=${roomId}`);
            }
        });

        //게임 시작 처리
        socket.on("startGame", ({ roomId }) => {
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                room.isStarted = true; // 게임 시작 상태로 변경
                io.emit("updateRoomList", rooms); // 업데이트된 방 목록을 클라이언트로 전송
            }
        });
        

         // 퀴즈 종료 처리
         socket.on("endQuiz", () => {
            const ranking = Array.from(userScores)
                .sort(([, a], [, b]) => b - a) // 점수 기준 내림차순 정렬
                .map(([userId, score]) => ({ userId, score }));

            console.log("퀴즈 종료. 최종 순위:", ranking);

            // 모든 사용자에게 퀴즈 종료 이벤트 전송
            io.emit("quizEnd");
        });

        // 방 목록 요청 처리
        socket.on("requestRoomList", () => {
            socket.emit("updateRoomList", rooms); // 현재 방 목록 전송
        });
    });
};

module.exports = {socketHandler,userScores};
