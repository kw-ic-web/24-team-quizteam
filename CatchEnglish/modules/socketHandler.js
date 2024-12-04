const { Server } = require('socket.io');
const userMap = new Map(); // socket.id와 userid 매핑

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
    });
};

module.exports = socketHandler;
