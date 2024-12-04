const socket = io('http://localhost:3000'); // 서버 주소 명시

let currentQuestionIndex = 0; // 현재 문제 인덱스
let questions = []; // 문제 리스트

/**
 * 서버에서 문제 데이터를 가져오는 함수
 */
async function fetchQuestions() {
    try {
        const response = await fetch("/api/quiz/questions/game_blankQuiz_easy");
        if (!response.ok) throw new Error("문제 데이터를 가져오는데 실패했습니다.");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("문제 데이터를 가져오는 중 오류 발생:", error);
        alert("문제를 가져오는 데 실패했습니다. 다시 시도하세요.");
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

/**
 * 채팅 메시지를 화면에 추가하는 함수
 */
function addChatMessage(msg) {
    const chatBox = document.querySelector("#chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");
    messageDiv.textContent = `${msg.userId}: ${msg.message}`;
    chatBox.appendChild(messageDiv);

    // 새 메시지가 추가되면 채팅 창 스크롤 하단으로 이동
    chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * 정답 제출 함수
 */
function submitAnswer(message) {
    const userId = "Player1"; // 사용자 ID (임의로 설정)
    socket.emit("chat message", { userId, message }); // 채팅 메시지 전송
    socket.emit("check answer", { answer: message, userId }); // 정답 제출
}

/**
 * 소켓 이벤트 설정
 */
function setupSocketListeners() {
    // 정답 확인 결과 수신
    socket.on("answer result", ({ isCorrect, userId }) => {
        if (isCorrect) {
            alert(`${userId}님이 정답을 맞혔습니다!`);
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                loadQuestion();
            } else {
                alert("모든 문제를 풀었습니다. 게임 종료!");
                socket.emit("end game", { userId });
            }
        } else {
            alert("오답입니다. 다시 시도하세요!");
        }
    });

    // 서버에서 받은 채팅 메시지 처리
    socket.on("chat message", (msg) => {
        addChatMessage(msg);
    });
}

/**
 * 사용자 이벤트 설정
 */
function setupUserEventListeners() {
    const inputBox = document.querySelector(".input-box");
    const sendButton = document.querySelector("#sendBtn");

    // Enter 키로 메시지 전송 및 정답 제출
    inputBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const message = inputBox.value.trim();
            if (message) {
                submitAnswer(message);
                inputBox.value = ""; // 입력 필드 초기화
            }
        }
    });

    // 버튼 클릭으로 메시지 전송 및 정답 제출
    sendButton.addEventListener("click", () => {
        const message = inputBox.value.trim();
        if (message) {
            submitAnswer(message);
            inputBox.value = ""; // 입력 필드 초기화
        }
    });
}

/**
 * 페이지 로드 시 실행
 */
document.addEventListener("DOMContentLoaded", async () => {
    questions = await fetchQuestions(); // 문제 데이터 가져오기
    loadQuestion(); // 첫 번째 문제 표시
    setupSocketListeners(); // 소켓 이벤트 설정
    setupUserEventListeners(); // 사용자 이벤트 설정
});
