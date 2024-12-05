const socket = io(); // 서버 주소 명시

let currentQuestionIndex = 0; // 현재 문제 인덱스
let questions = []; // 문제 리스트

/**
 * 서버에서 문제 데이터를 가져오는 함수
 */

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const gameType = params.get("gameType");
    const difficulty = params.get("difficulty");
    console.log("Received gameType:", gameType);
    console.log("Received difficulty:", difficulty);
    return { gameType, difficulty };
}



async function fetchQuestions() {
    const { gameType, difficulty } = getQueryParams();
    const collectionName = `game_${gameType}_${difficulty}`;
    console.log("Fetching questions for collectionName:", collectionName);
    try {
        const response = await fetch(`/api/quiz/questions/${encodeURIComponent(collectionName)}`);
        console.log("Fetch response status:", response.status);

        if (!response.ok) throw new Error("문제 데이터를 가져오는데 실패했습니다.");

        const data = await response.json();
        console.log("Fetched questions:", data);
        return data;
    } catch (error) {
        console.error("문제 데이터를 가져오는 중 오류 발생:", error);
        return [];
    }
}

/**
 * 문제와 보기를 화면에 로드하는 함수
 */
function loadQuestion() {
    const questionText = document.getElementById("question-text");
    const choicesContainer = document.getElementById("choices");

    if (questions.length === 0) {
        questionText.textContent = "문제를 불러오는 중 오류가 발생했습니다.";
        return;
    }

    const question = questions[currentQuestionIndex];

    // 문제 텍스트 표시
    questionText.textContent = `Q${currentQuestionIndex + 1}. ${question.question}`;

    // 보기 표시 (기존 보기 초기화 후 추가)
    choicesContainer.innerHTML = "";
    question.choices.forEach((choice, index) => {
        const choiceItem = document.createElement("div");
        choiceItem.textContent = `${index + 1}. ${choice}`;
        choiceItem.classList.add("choice-item");
        choicesContainer.appendChild(choiceItem);
    });
}

// 정답 제출 처리
document.querySelector(".input-box").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const message = e.target.value.trim();
        if (message) {
            const question = questions[currentQuestionIndex];
            // 채팅 메시지 서버로 전송
            socket.emit("chatMessage", { userId: "Player1", message });

            // 정답 제출
            socket.emit("check answer", {
                answer: message,
                correctAnswer: question.answer,
                questionIndex: currentQuestionIndex,
                userId: "Player1",
            });

            e.target.value = ""; // 입력 필드 초기화
        }
    }
});

// 서버로부터 정답 결과 수신
socket.on("answer result", ({ isCorrect, userId }) => {
    if (isCorrect) {
        alert(`${userId}님이 정답을 맞혔습니다!`);
        currentQuestionIndex++;
        loadQuestion();
    }
});

// 서버로부터 채팅 메시지 수신
socket.on("chatMessage", (data) => {
    const chatBox = document.querySelector("#chat-messages");
    if (!chatBox) {
        console.error("chatBox 요소를 찾을 수 없습니다. HTML에 #chat-messages 요소를 추가하세요.");
        return;
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");
    messageDiv.textContent = `${data.userId}: ${data.message}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // 채팅창 스크롤을 최신 메시지로 이동
    console.log("gameRoom 채팅 작동");
});


/**
 * 페이지 로드 시 실행
 */
document.addEventListener("DOMContentLoaded", async () => {
    questions = await fetchQuestions(); // 문제 데이터 가져오기
    console.log("Questions loaded:", questions);
    loadQuestion(); // 첫 번째 문제 표시
    setupSocketListeners(); // 소켓 이벤트 설정
    setupUserEventListeners(); // 사용자 이벤트 설정
});
