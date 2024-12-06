document.addEventListener("DOMContentLoaded", async () => {
    const rankingBody = document.getElementById("ranking-body");
    const leaveRoomBtn = document.getElementById("leave-room-btn");

    try {
        // 서버에서 순위 데이터 가져오기
        const response = await fetch("/api/users/ranking", {
            method: "GET",
        });

        if (!response.ok) {
            console.error("순위 데이터를 가져오지 못했습니다:", response.status, response.statusText);
            throw new Error("순위 데이터를 가져오는 데 실패했습니다.");
        }

        const rankingData = await response.json();

        // 순위 데이터 테이블에 추가
        rankingBody.innerHTML = rankingData
            .map(
                (user, index) => `
        <tr>
            <td>${user.userId}</td>
            <td>${user.correctAnswers || 0} 문제</td>
            <td>${user.correctAnswers * 10 || 0} 점</td>
            <td>${index + 1}</td>
        </tr>
    `
            )
            .join("");
    } catch (error) {
        console.error("순위 데이터를 가져오는 중 오류:", error);
        rankingBody.innerHTML = `
    <tr>
        <td colspan="4">순위 데이터를 가져오는 중 오류가 발생했습니다.</td>
    </tr>
`;
    }

    // 확인 버튼 클릭 이벤트
    leaveRoomBtn.addEventListener("click", async () => {
        try {
            // 점수 초기화 API 호출
            const resetResponse = await fetch("/api/users/reset-scores", {
                method: "POST",
            });

            if (!resetResponse.ok) {
                console.error("점수 초기화에 실패했습니다:", resetResponse.status, resetResponse.statusText);
                throw new Error("점수 초기화 실패");
            }

            // 초기화 성공 시 waiting.html로 이동
            window.location.href = "/waitingRoom.html";
        } catch (error) {
            console.error("확인 버튼 처리 중 오류:", error);
        }
    });
});
