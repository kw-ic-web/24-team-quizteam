// 임시 문제 데이터 배열
const questions = [
    {
      text: "The company has a rule ______ entrance to the warehouse without official authorization.",
      options: ["prohibited", "prohibiting", "prohibit", "prohibits"],
      answer: 1
    },
    {
      text: "Select the correct synonym for 'abundant'.",
      options: ["Scarce", "Plentiful", "Insufficient", "Sparse"],
      answer: 1
    },
    {
      text: "What is the capital of France?",
      options: ["Rome", "Paris", "Berlin", "Madrid"],
      answer: 1
    },
    {
      text: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Oxygen", "Silver", "Iron"],
      answer: 1
    },
    {
      text: "What is the largest planet in our Solar System?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
      answer: 2
    }
  ];
  
  let currentQuestionIndex = 0;
  
  function loadQuestion() {
    const question = questions[currentQuestionIndex];
    document.getElementById("question-text").textContent = `Q${currentQuestionIndex + 1}. ${question.text}`;
    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.classList.add("option");
      optionDiv.textContent = `(${String.fromCharCode(65 + index)}) ${option}`;
      optionDiv.onclick = () => selectOption(index);
      optionsContainer.appendChild(optionDiv);
    });
  }
  
  function selectOption(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedIndex === currentQuestion.answer) {
      alert("정답입니다!");
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        loadQuestion();
      } else {
        alert("퀴즈가 끝났습니다!");
        location.href = 'ranking.html';
      }
    } else {
      alert("오답입니다. 다시 시도하세요!");
    }
  }
  function updateScore(isCorrect) {
    if (isCorrect) {
        fetch('/api/users/increment-correct-answers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        }).catch(error => console.error("점수 업데이트 오류:", error));
    }
}

function endGame() {
    fetch('/api/users/end-game', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    })
        .then(response => response.json())
        .then(data => {
            alert(`게임 종료! 맞춘 문제 수: ${data.score}`);
            window.location.href = `/ranking.html?score=${data.score}`;
        })
        .catch(error => console.error("게임 종료 중 오류:", error));
}

  
  // 페이지 로드 시 첫 번째 문제를 표시
  document.addEventListener("DOMContentLoaded", loadQuestion);
  