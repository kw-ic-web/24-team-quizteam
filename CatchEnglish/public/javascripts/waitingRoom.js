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
            profileIcon.src = `/images/character_${data.character}.png?timestamp=${Date.now()}`; // 캐릭터 이미지 업데이트
        } else {
            usernameElement.textContent = "알 수 없음 님";
        }
    })
    .catch(error => {
        console.error("사용자 정보 요청 중 오류:", error);
        usernameElement.textContent = "알 수 없음 님";
    });

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
    
        fetch('/api/rooms/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: roomName, gameType: selectedGameType, difficulty: selectedDifficulty }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.roomId) {
                    window.location.href = `/gameRoom.html?roomId=${data.roomId}`;
                } else {
                    alert("방 생성 중 문제가 발생했습니다.");
                }
            })
            .catch(error => console.error("방 생성 오류:", error));
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

    //로그아웃
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem('token');
        window.location.href = "/login.html";
    });

    initializeEmptySlots();
    updateRoomsDisplay();
});


