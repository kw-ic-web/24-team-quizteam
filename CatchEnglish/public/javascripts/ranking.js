document.addEventListener("DOMContentLoaded", async () => {
    const rankingBody = document.getElementById("ranking-body");
    const urlParams = new URLSearchParams(window.location.search);
    const score = urlParams.get("score"); // 맞춘 문제 수 가져오기

    if (score) {
        // 현재 사용자의 점수 추가
        rankingBody.innerHTML = `
            <tr>
                <td>현재 사용자</td>
                <td>${score} 문제</td>
                <td>${score * 10} 점</td>
                <td>-</td>
            </tr>
        ` + rankingBody.innerHTML;
    }

    // 서버에서 순위 가져오기
    try {
        const response = await fetch("/api/users/ranking", {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
        });

        if (!response.ok) throw new Error("순위 데이터를 가져오는 데 실패했습니다.");

        const rankingData = await response.json();
        rankingBody.innerHTML += rankingData
            .map((user, index) => `
                <tr>
                    <td>${user.name || user.userid}</td>
                    <td>${user.correctAnswers} 문제</td>
                    <td>${user.correctAnswers * 10} 점</td>
                    <td>${index + 1}</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error("순위 데이터 오류:", error);
        rankingBody.innerHTML += `
            <tr>
                <td colspan="4">순위 데이터를 가져오는 중 문제가 발생했습니다.</td>
            </tr>
        `;
    }
});
