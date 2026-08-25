const registerForm =
    document.getElementById("registerForm");

const registerButton =
    document.getElementById("registerButton");

const registerMessage =
    document.getElementById("registerMessage");


registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password = document.getElementById("password").value;

        const email = document.getElementById("email").value.trim();

        const fullName = document.getElementById("fullName").value.trim();

        const phone = document.getElementById("phone").value.trim();


        // Xóa thông báo cũ
        registerMessage.className = "register-message";
        registerMessage.textContent = "";

        // Disable button

        registerButton.disabled = true;
        registerButton.textContent = "ĐANG ĐĂNG KÝ...";


        try {

            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password,
                        email: email,
                        fullName: fullName,
                        phone: phone

                    })
                }
            );

            const contentType = response.headers.get("content-type");

            let data;

            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // THÀNH CÔNG

            if (response.ok) {
                registerMessage.className = "register-message success";

                registerMessage.textContent =
                    typeof data === "string"
                        ? data
                        : data.message || "Đăng ký tài khoản thành công!";

                registerForm.reset();

                setTimeout(function () {
                    window.location.href = "/html/login.html";
                }, 1500);
            }

                // THẤT BẠI
            else {

                registerMessage.className = "register-message error";

                if (response.status === 409) {

                    registerMessage.textContent =
                        data.message ||
                        "Tên đăng nhập hoặc email đã tồn tại.";

                }

                else if (response.status === 400) {

                    registerMessage.textContent =
                        data.message ||
                        "Thông tin đăng ký không hợp lệ.";

                }

                else {

                    registerMessage.textContent =
                        data.message || "Đăng ký thất bại.";
                }
            }

        } catch (error) {
            console.error(
                "Lỗi đăng ký:", error
            );

            registerMessage.className = "register-message error";

            registerMessage.textContent = "Không thể kết nối đến máy chủ.";

        }


        finally {

            registerButton.disabled = false;

            registerButton.textContent = "ĐĂNG KÝ";

        }

    }
);