// 서버에서 문제 데이터를 가져오는 함수
async function fetchQuestions() {
  try {
    const response = await fetch("/api/quiz/questions/game_blankQuiz_easy"); // 경로 수정
    if (!response.ok) throw new Error("문제 데이터를 가져오는데 실패했습니다.");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("문제 데이터를 가져오는 중 오류 발생:", error);
    alert("문제를 가져오는 데 실패했습니다. 다시 시도하세요.");
    return [];
  }
}

let currentQuestionIndex = 0;
let questions = [];

// 문제를 화면에 로드하는 함수
function loadQuestion() {
  if (questions.length === 0) {
    document.getElementById("question-text").textContent = "문제를 불러오는 중 오류가 발생했습니다.";
    return;
  }

  const question = questions[currentQuestionIndex];
  document.getElementById("question-text").textContent = `Q${currentQuestionIndex + 1}. ${question.question}`;
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = '';

  question.choices.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.classList.add("option");
    optionDiv.textContent = `(${String.fromCharCode(65 + index)}) ${option}`;
    optionDiv.onclick = () => selectOption(index);
    optionsContainer.appendChild(optionDiv);
  });
}

// 사용자가 답안을 선택했을 때의 동작
function selectOption(selectedIndex) {
  const currentQuestion = questions[currentQuestionIndex];
  if (currentQuestion.answer === currentQuestion.choices[selectedIndex]) {
    alert("정답입니다!");
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion();
    } else {
      alert("퀴즈가 끝났습니다!");
      location.href = 'ranking.html'; // 퀴즈 완료 시 순위 페이지로 이동
    }
  } else {
    alert("오답입니다. 다시 시도하세요!");
  }
}

// 페이지 로드 시 문제 데이터를 가져오고 첫 번째 문제를 표시
document.addEventListener("DOMContentLoaded", async () => {
  questions = await fetchQuestions(); // 서버에서 문제 데이터를 가져옴
  loadQuestion(); // 첫 번째 문제 로드
});
