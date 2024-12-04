document.addEventListener("DOMContentLoaded", async () => {
    const rankingBody = document.getElementById("ranking-body");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login.html";
        return;
    }

    try {
        // 서버에서 순위 데이터 가져오기
        const response = await fetch("/api/users/ranking", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("순위 데이터를 가져오는 데 실패했습니다.");
        }

        const rankingData = await response.json();

        // 순위 데이터 테이블에 추가
        rankingBody.innerHTML = rankingData
            .map(
                (user, index) => `
        <tr>
            <td>${user.name || user.userid}</td>
            <td>${user.correctAnswers} 문제</td>
            <td>${user.correctAnswers * 10} 점</td>
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