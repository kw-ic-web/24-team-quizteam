document.addEventListener("DOMContentLoaded", function () {
    const createRoomBtn = document.querySelector(".create-room-btn");
    const roomCreationModal = document.getElementById("roomCreationModal");
    const createRoomModalBtn = document.getElementById("createRoomBtn");
    const cancelRoomBtn = document.getElementById("cancelRoomBtn");
    const roomsContainer = document.getElementById("rooms-container");
    const roomNameInput = document.getElementById("roomName");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    const profileIcon = document.getElementById("profileIcon");
    const editorIcon = document.getElementById("editorIcon");
    const usernameElement = document.querySelector(".username");
    const chatBox = document.querySelector(".chat-box");
    const inputBox = document.querySelector(".input-box");
    const sendBtn = document.querySelector("#sendBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const socket = io();

    const userid = localStorage.getItem("userid"); // 로컬 스토리지에서 userid 가져오기
    if (userid) {
        socket.emit("register", userid); // 서버에 userid 전달
    } else {
        console.error("로그인 정보가 없습니다. userid를 확인해주세요.");
    }

    let userName = "USER";

    let selectedGameType = null;
    let selectedDifficulty = null;
    let rooms = [];
    const roomsPerPage = 6;
    let currentPage = 0;

    // 로그인한 사용자의 ID 가져오기
    fetch('/api/users/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("사용자 정보를 가져오지 못했습니다.");
            }
            return response.json();
        })
        .then(data => {
            if (data && data.userid) {
                usernameElement.textContent = `${data.userid} 님`;
                profileIcon.src = `/images/character_${data.character}.png?timestamp=${Date.now()}`;
                userName = data.userid; // 사용자 이름 업데이트
            } else {
                usernameElement.textContent = "알 수 없음 님";
            }
        })
        .catch(error => {
            console.error("사용자 정보 요청 중 오류:", error);
            usernameElement.textContent = "알 수 없음 님";
        });

    // 방 슬롯 초기화
    function initializeEmptySlots() {
        roomsContainer.innerHTML = "";
        for (let i = 0; i < roomsPerPage; i++) {
            const roomSlot = document.createElement("div");
            roomSlot.className = "room-slot empty";
            roomsContainer.appendChild(roomSlot);
        }
    }

    document.querySelectorAll(".game-type-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".game-type-btn").forEach(btn => btn.classList.remove("selected"));
            button.classList.add("selected");
            selectedGameType = button.getAttribute("data-type");
        });
    });

    document.querySelectorAll(".difficulty-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
            button.classList.add("selected");
            selectedDifficulty = button.getAttribute("data-difficulty");
        });
    });

    createRoomBtn.addEventListener("click", () => {
        roomCreationModal.style.display = "flex";
    });

    cancelRoomBtn.addEventListener("click", () => {
        roomCreationModal.style.display = "none";
    });

    createRoomModalBtn.addEventListener("click", () => {
        const roomName = roomNameInput.value.trim();
        if (!roomName || !selectedGameType || !selectedDifficulty) {
            alert("모든 항목을 선택해주세요.");
            return;
        }

        const room = {
            name: roomName,
            gameType: selectedGameType,
            difficulty: selectedDifficulty,
            host: userName
        };

        rooms.push(room);
        updateRoomsDisplay();
        roomCreationModal.style.display = "none";
        roomNameInput.value = "";
        selectedGameType = null;
        selectedDifficulty = null;
        document.querySelectorAll(".game-type-btn, .difficulty-btn").forEach(btn => btn.classList.remove("selected"));
    });

    function updateRoomsDisplay() {
        roomsContainer.innerHTML = "";
        const start = currentPage * roomsPerPage;
        const end = start + roomsPerPage;
        const visibleRooms = rooms.slice(start, end);

        visibleRooms.forEach(room => {
            const roomSlot = document.createElement("div");
            roomSlot.className = "room-slot";
            roomSlot.innerHTML = `
                <div class="room-info">
                    <div class="game-type-label ${getDifficultyClass(room.difficulty)}">${room.gameType}</div>
                    <div class="room-details">
                        <p class="room-name">${room.name}</p>
                        <span>방장</span> <span class="user-label">${room.host}</span>
                    </div>
                </div>
            `;
            roomsContainer.appendChild(roomSlot);
        });

        for (let i = visibleRooms.length; i < roomsPerPage; i++) {
            const roomSlot = document.createElement("div");
            roomSlot.className = "room-slot empty";
            roomsContainer.appendChild(roomSlot);
        }

        updatePaginationButtons();
    }

    function updatePaginationButtons() {
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = (currentPage + 1) * roomsPerPage >= rooms.length;
    }

    prevBtn.addEventListener("click", () => {
        if (currentPage > 0) {
            currentPage--;
            updateRoomsDisplay();
        }
    });

    nextBtn.addEventListener("click", () => {
        if ((currentPage + 1) * roomsPerPage < rooms.length) {
            currentPage++;
            updateRoomsDisplay();
        }
    });

    function getDifficultyClass(difficulty) {
        switch (difficulty) {
            case "어려움": return "difficulty-hard";
            case "보통": return "difficulty-medium";
            case "쉬움": return "difficulty-easy";
            default: return "";
        }
    }

    // 로그아웃
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem('token');
        window.location.href = "/login.html";
    });

    // 채팅
    sendBtn.addEventListener("click", () => {
        const message = inputBox.value.trim();
        if (message) {
            socket.emit("chatMessage", { user: userid, message });
            inputBox.value = ""; // 입력창 초기화
        }
    });

    inputBox.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendBtn.click();
        }
    });

    socket.on("chatMessage", (data) => {
        const newMessage = document.createElement("div");
        newMessage.classList.add("chat-message");
        newMessage.innerHTML = `<strong>${data.user}:</strong> ${data.message}`;
        chatBox.appendChild(newMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on("userStatus", (status) => {
        const statusMessage = document.createElement("div");
        statusMessage.classList.add("status-message");
        statusMessage.textContent = status;
        chatBox.appendChild(statusMessage);
    });

    initializeEmptySlots();
    updateRoomsDisplay();
});
