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

    // 게임 유형 선택
document.querySelectorAll(".game-type-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".game-type-btn").forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");
        selectedGameType = button.getAttribute("data-type");
        console.log("Selected Game Type:", selectedGameType);
    });
});

// 난이도 선택
document.querySelectorAll(".difficulty-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".difficulty-btn").forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");
        selectedDifficulty = button.getAttribute("data-difficulty");
        console.log("Selected Difficulty:", selectedDifficulty);
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

        console.log("Selected gameType:", selectedGameType);
        console.log("Selected difficulty:", selectedDifficulty);

        if (!roomName || !selectedGameType || !selectedDifficulty) {
            alert("모든 항목을 입력해주세요.");
            return;
        }

        console.log("Game Type:", selectedGameType); // 디버깅 로그
        console.log("Difficulty:", selectedDifficulty); // 디버깅 로그

        // 서버로 방 생성 요청
        fetch('/api/rooms/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: roomName,
                gameType: selectedGameType,
                difficulty: selectedDifficulty,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data && data.roomId) {
                    const url = `/gameRoom.html?roomId=${data.roomId}&gameType=${encodeURIComponent(selectedGameType)}&difficulty=${encodeURIComponent(selectedDifficulty)}`;
                    console.log("Redirecting to URL:", url); // 로그 추가
                    window.location.href = url;
                } else {
                    alert("방 생성 중 문제가 발생했습니다.");
                }
            })
            .catch(error => {
                console.error("방 생성 요청 중 오류 발생:", error);
            });
        

        // 서버로 방 생성 요청 보내기
        socket.emit("createRoom", {
            title: roomName,
            gameType: selectedGameType,
            difficulty: selectedDifficulty,
            host: userName,
        });

        roomCreationModal.style.display = "none";
    });

    // 방 생성 후 자동으로 방으로 이동
    socket.on("roomJoined", (room) => {
        console.log("생성된 방으로 이동합니다:", room);
        window.location.href = `/gameRoom.html?roomId=${room.id}&gameType=${encodeURIComponent(selectedGameType)}&difficulty=${encodeURIComponent(selectedDifficulty)}`;
    });

    // 서버에서 새 방 생성 알림 받기
    socket.on("roomCreated", (room) => {
        rooms.push(room); // 새 방 추가
        updateRoomsDisplay(); // 방 목록 업데이트
    });

    socket.on("updateRoomList", (updatedRooms) => {
        console.log("서버에서 받은 방 목록:", updatedRooms); // 서버에서 받은 데이터 확인
        rooms = updatedRooms; // 방 목록 동기화
        updateRoomsDisplay(); // 화면에 방 목록 업데이트
    });

    // 방 클릭 시 참가
    roomsContainer.addEventListener("click", (event) => {
        const roomSlot = event.target.closest(".room-slot");
        if (!roomSlot || !roomSlot.dataset.roomId) return;

        const roomId = roomSlot.dataset.roomId;
        fetch(`/api/rooms/${roomId}/join`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "방에 참가했습니다.") {
                    window.location.href = `/gameRoom.html?roomId=${roomId}&gameType=${encodeURIComponent(selectedGameType)}&difficulty=${encodeURIComponent(selectedDifficulty)}`;
                } else {
                    alert(data.message);
                }
            })
            .catch((error) => console.error("방 참가 오류:", error));
    });

    function updateRoomsDisplay() {
        roomsContainer.innerHTML = ""; // 기존 방 목록 초기화
        const start = currentPage * roomsPerPage;
        const end = start + roomsPerPage;
        const visibleRooms = rooms.slice(start, end); // 현재 페이지의 방 목록 가져오기

        // 현재 페이지에 표시할 방 정보를 동적으로 추가
        visibleRooms.forEach(room => {
            const roomSlot = document.createElement("div");
            roomSlot.className = "room-slot"; // 방 슬롯 클래스
            roomSlot.dataset.roomId = room.id; // 데이터 속성으로 방 ID 설정
            roomSlot.innerHTML = `
                <div class="room-info">
                    <div class="game-type-label ${getDifficultyClass(room.difficulty)}">${room.gameType}</div>
                    <div class="room-details">
                        <p class="room-name">${room.title}</p>
                        <span>방장</span> <span class="user-label">${room.participants[0]?.userId || "알 수 없음"}</span>
                    </div>
                </div>
            `;
            roomsContainer.appendChild(roomSlot);
        });

        // 남은 슬롯을 빈 슬롯으로 채우기
        for (let i = visibleRooms.length; i < roomsPerPage; i++) {
            const emptySlot = document.createElement("div");
            emptySlot.className = "room-slot empty"; // 빈 슬롯 클래스
            roomsContainer.appendChild(emptySlot);
        }

        updatePaginationButtons(); // 페이지네이션 버튼 상태 업데이트
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
            case "hard": return "difficulty-hard";
            case "normal": return "difficulty-medium";
            case "easy": return "difficulty-easy";
            default: return "";
        }
    }

    // 캐릭터 선택 기능 추가
    const characterModal = document.createElement("div");
    characterModal.id = "characterModal";
    characterModal.className = "modal";
    characterModal.innerHTML = `
         <div class="modal-content">
             <h2>캐릭터 선택</h2>
             <div class="character-options">
                 <img src="/images/character_A.png" alt="Character A" class="character-option" data-character="A">
                 <img src="/images/character_B.png" alt="Character B" class="character-option" data-character="B">
                 <img src="/images/character_C.png" alt="Character C" class="character-option" data-character="C">
                 <img src="/images/character_D.png" alt="Character D" class="character-option" data-character="D">
             </div>
             <button id="closeCharacterModal" class="cancel-btn">닫기</button>
         </div>
     `;
    document.body.appendChild(characterModal);

    editorIcon.addEventListener("click", () => {
        characterModal.style.display = "flex";
    });

    characterModal.addEventListener("click", (event) => {
        if (event.target.classList.contains("character-option")) {
            const selectedCharacter = event.target.getAttribute("data-character");

            // 서버에 캐릭터 업데이트 요청
            fetch('/api/users/update-character', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ character: selectedCharacter })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("캐릭터 업데이트 실패");
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("캐릭터가 업데이트되었습니다:", data);

                    // 업데이트 후 사용자 정보 재요청
                    return fetch('/api/users/userinfo', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                })
                .then(response => response.json())
                .then(data => {
                    profileIcon.src = `/images/character_${data.character}.png?timestamp=${Date.now()}`; // 캐릭터 업데이트
                })
                .catch(error => {
                    console.error("캐릭터 업데이트 중 오류:", error);
                });
        }
    });


    characterModal.querySelector("#closeCharacterModal").addEventListener("click", () => {
        characterModal.style.display = "none";
    });

    // 로그아웃
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userid');
        localStorage.removeItem('character');
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

    // 서버로 방 목록 요청
    socket.emit("requestRoomList"); // 방 목록 요청

    // 서버에서 방 목록 수신
    socket.on("updateRoomList", (updatedRooms) => {
        console.log("초기 방 목록:", updatedRooms);
        rooms = updatedRooms;
        updateRoomsDisplay(); // 방 목록 UI 업데이트
    });

    initializeEmptySlots();
    updateRoomsDisplay();
});
