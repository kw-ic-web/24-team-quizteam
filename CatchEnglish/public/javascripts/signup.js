document.addEventListener("DOMContentLoaded", () => {
    const signupButton = document.getElementById("signupButton");
    const checkUserIdButton = document.getElementById("checkUserIdButton");
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("confirm-password");
    const useridField = document.getElementById("userid");

    let isUserIdValid = false;

    function validateForm() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        const name = document.getElementById("name").value;
        const dob = document.getElementById("dob").value;

        signupButton.disabled = !(
            isUserIdValid &&
            password === confirmPassword &&
            name &&
            dob &&
            useridField.value
        );
    }

    checkUserIdButton.addEventListener("click", async () => {
        const userid = useridField.value;
        const response = await fetch(`/api/users/check-duplicate-id?userid=${userid}`);
        const data = await response.json();

        if (data.exists) {
            isUserIdValid = false;
            alert("이미 존재하는 아이디입니다.");
        } else {
            isUserIdValid = true;
            alert("사용 가능한 아이디입니다.");
        }
        validateForm();
    });

    passwordField.addEventListener("input", validateForm);
    confirmPasswordField.addEventListener("input", validateForm);
    useridField.addEventListener("input", () => {
        isUserIdValid = false;
        validateForm();
    });

    document.getElementById("name").addEventListener("input", validateForm);
    document.getElementById("dob").addEventListener("input", validateForm);
});