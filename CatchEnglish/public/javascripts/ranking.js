document.addEventListener("DOMContentLoaded", async () => {
    const rankingBody = document.getElementById("ranking-body");

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
});
