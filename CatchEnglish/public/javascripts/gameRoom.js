const socket = io('http://localhost:3000'); // 서버 주소 명시

let currentQuestionIndex = 0; // 현재 문제 인덱스
let questions = []; // 문제 리스트

// 서버에서 문제 데이터를 가져오는 함수
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

// 문제와 보기를 화면에 로드하는 함수
function loadQuestion() {
    if (questions.length === 0) {
        document.getElementById("question-text").textContent = "문제를 불러오는 중 오류가 발생했습니다.";
        return;
    }

    const question = questions[currentQuestionIndex];
    const questionText = document.getElementById("question-text");
    const choicesContainer = document.getElementById("choices");

    // 문제 텍스트 표시
    questionText.textContent = `Q${currentQuestionIndex + 1}. ${question.question}`;

    // 보기 표시 (버튼 대신 텍스트로만 표시)
    choicesContainer.innerHTML = ""; // 기존 보기 초기화
    question.choices.forEach((choice, index) => {
        const choiceItem = document.createElement("div");
        choiceItem.textContent = `${index + 1}. ${choice}`;
        choiceItem.classList.add("choice-item");
        choicesContainer.appendChild(choiceItem);
    });
}

// 정답 확인 결과 수신
socket.on("answer result", ({ isCorrect, userId }) => {
    if (isCorrect) {
        alert(`${userId}님이 정답을 맞혔습니다!`);
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            alert("모든 문제를 풀었습니다. 게임 종료!");
            socket.emit("end game", { userId: "Player1" });
        }
    } else {
        alert("오답입니다. 다시 시도하세요!");
    }
});

// 서버에서 받은 채팅 메시지 처리
socket.on("chat message", (msg) => {
    const chatBox = document.querySelector("#chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");
    messageDiv.textContent = `${msg.userId}: ${msg.message}`;
    chatBox.appendChild(messageDiv);
});

// 채팅 메시지 보내기 (정답 제출 포함)
document.querySelector(".input-box").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const message = e.target.value.trim();
        if (message) {
            // 메시지를 서버로 전송
            socket.emit("chat message", { userId: "Player1", message });

            // 정답 제출 (채팅 메시지를 그대로 서버에 보냄)
            socket.emit("check answer", { answer: message, userId: "Player1" });
        }
        e.target.value = ""; // 입력 필드 초기화
    }
});

// 페이지 로드 시 문제 데이터를 가져오고 첫 번째 문제를 표시
document.addEventListener("DOMContentLoaded", async () => {
    questions = await fetchQuestions();
    loadQuestion();
});
