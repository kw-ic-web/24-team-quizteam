document.addEventListener("DOMContentLoaded", function () {
    const editorIcon = document.getElementById("editorIcon");
    const profileIcon = document.getElementById("profileIcon");
    const characterModal = document.getElementById("characterModal");
    const closeModal = document.getElementById("closeModal");
    const characterOptions = document.querySelectorAll(".character-option");

    // editor-icon 클릭 시 모달 열기
    editorIcon.addEventListener("click", () => {
        characterModal.style.display = "flex";
    });

    // 닫기 버튼 클릭 시 모달 닫기
    closeModal.addEventListener("click", () => {
        characterModal.style.display = "none";
    });

    // 캐릭터 옵션 클릭 시 프로필 이미지 변경 및 모달 닫기
    characterOptions.forEach(option => {
        option.addEventListener("click", (event) => {
            const selectedImage = event.target.getAttribute("data-image");
            profileIcon.src = selectedImage;
            characterModal.style.display = "none"; // 모달 닫기
        });
    });

    // 모달 외부 클릭 시 모달 닫기
    window.addEventListener("click", (event) => {
        if (event.target === characterModal) {
            characterModal.style.display = "none";
        }
    });
});
