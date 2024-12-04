const { Server } = require('socket.io');
const userMap = new Map(); // socket.id와 userid 매핑
const rooms = [];

const socketHandler = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("새로운 사용자가 연결되었습니다:", socket.id);

        // 클라이언트에서 userid를 받아와 매핑
        socket.on("register", (userid) => {
            if (userid) {
                userMap.set(socket.id, userid);
                console.log(`사용자 등록 완료: socket.id=${socket.id}, userid=${userid}`);
                io.emit("userStatus", `${userid} 님이 입장했습니다.`);
            } else {
                console.warn(`userid가 제공되지 않았습니다: socket.id=${socket.id}`);
            }
        });

        // 채팅 메시지 처리
        socket.on("chatMessage", (data) => {
            const userid = userMap.get(socket.id) || "알 수 없는 사용자";
            console.log(`메시지 수신: ${userid}: ${data.message}`);
            io.emit("chatMessage", { user: userid, message: data.message });
        });

        // 사용자 연결 해제 처리
        socket.on("disconnect", () => {
            const userid = userMap.get(socket.id);
            if (userid) {
                io.emit("userStatus", `${userid} 님이 퇴장했습니다.`);
                userMap.delete(socket.id); // 연결 해제 시 매핑 삭제
            } else {
                console.warn(`연결 해제된 사용자: socket.id=${socket.id} (userid 없음)`);
            }
            console.log("사용자가 연결 해제되었습니다:", socket.id);
        });

        socket.on("createRoom", (roomData) => {
            const roomId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newRoom = {
                id: roomId,
                ...roomData,
                participants: [{ userId: roomData.host }],
            };

            rooms.push(newRoom);


            // 방 생성자에게만 게임 방으로 이동 명령
            socket.emit("roomJoined", newRoom);

            // 모든 사용자에게 방 생성 알림
            io.emit("roomCreated", newRoom);
        });

        // 방 목록 요청
        socket.on("requestRoomList", () => {
            socket.emit("updateRoomList", rooms);
        });
    });
};

module.exports = socketHandler;
