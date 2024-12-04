document.querySelector(".login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // 폼 기본 동작 방지
    const userid = document.querySelector("input[name='userid']").value;
    const password = document.querySelector("input[name='password']").value;

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userid, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || "로그인 실패");
            return;
        }

        const data = await response.json();
        localStorage.setItem("token", data.token); // 토큰 저장
        localStorage.setItem("userid", data.userid); // 사용자 ID 저장
        localStorage.setItem("character", data.character); // 사용자 캐릭터 저장
        window.location.href = "/start.html"; // 대기실 페이지로 이동
    } catch (error) {
        console.error('로그인 오류:', error);
        alert("서버 오류가 발생했습니다.");
    }
});
