document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch('/api/users/start.html', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("인증에 실패했습니다.");
        }

        console.log("인증 성공: 게임을 시작할 수 있습니다.");

        // Add click event for the start button
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            window.location.href = "/waitingRoom.html";
        });
    } catch (error) {
        alert(error.message);
        window.location.href = "/login.html";
    }
});