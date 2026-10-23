
const API_BASE = "/api/student/fees";

const $ = (id) => document.getElementById(id);

let feeList = [];

function getAuthToken() {
    // Sử dụng đúng key token của auth.js trong dự án hiện tại.
    return localStorage.getItem("token");
}

async function apiRequest(url) {
    const token = getAuthToken();

    if (!token) {
        throw new Error("Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message = typeof data === "string"
            ? data
            : data?.message || `Yêu cầu thất bại (${response.status})`;

        throw new Error(message);
    }

    return data;
}

function formatMoney(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "—";

    const parts = String(value).slice(0, 10).split("-");
    if (parts.length !== 3) return value;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatMonth(value) {
    if (!value) return "—";

    const parts = String(value).slice(0, 7).split("-");
    if (parts.length !== 2) return value;

    return `${parts[1]}/${parts[0]}`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function statusLabel(status) {
    return {
        PAID: "Đã thanh toán",
        PARTIAL: "Thanh toán một phần",
        UNPAID: "Chưa thanh toán"
    }[status] || status || "Chưa xác định";
}

function getRemaining(fee) {
    if (fee.remainingAmount !== undefined &&
        fee.remainingAmount !== null) {
        return Math.max(0, Number(fee.remainingAmount));
    }

    return Math.max(
        0,
        Number(fee.amount || 0) - Number(fee.paidAmount || 0)
    );
}

function showMessage(message, isError = false) {
    const element = $("message");
    element.hidden = false;
    element.textContent = message;
    element.className = isError
        ? "fee-message fee-error"
        : "fee-message";
}

function renderSummary() {
    const total = feeList.reduce(
        (sum, fee) => sum + Number(fee.amount || 0), 0
    );

    const paid = feeList.reduce(
        (sum, fee) => sum + Number(fee.paidAmount || 0), 0
    );

    const remaining = feeList.reduce(
        (sum, fee) => sum + getRemaining(fee), 0
    );

    $("totalAmount").textContent = formatMoney(total);
    $("paidAmount").textContent = formatMoney(paid);
    $("remainingAmount").textContent = formatMoney(remaining);
}

function renderFees() {
    const tbody = $("feeTableBody");

    if (!feeList.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="fee-empty">
                    Bạn chưa có khoản phí nào được ghi nhận.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = feeList.map(fee => {
        const status = String(fee.status || "UNPAID").toUpperCase();

        return `
            <tr>
                <td>${escapeHtml(fee.feeName || "Khoản thu KTX")}</td>
                <td>${formatMonth(fee.billingMonth)}</td>
                <td>${formatDate(fee.dueDate)}</td>
                <td>${formatMoney(fee.amount)}</td>
                <td>${formatMoney(fee.paidAmount)}</td>
                <td>${formatMoney(getRemaining(fee))}</td>
                <td>
                    <span class="fee-status status-${escapeHtml(status)}">
                        ${escapeHtml(statusLabel(status))}
                    </span>
                </td>
                <td>
                    <button
                        type="button"
                        class="fee-action"
                        data-fee-id="${Number(fee.id)}"
                        data-fee-name="${escapeHtml(fee.feeName || "Khoản phí")}"
                    >
                        Xem lịch sử
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    tbody.querySelectorAll("[data-fee-id]").forEach(button => {
        button.addEventListener("click", () => {
            loadHistory(
                Number(button.dataset.feeId),
                button.dataset.feeName
            );
        });
    });
}

async function loadHistory(feeId, feeName) {
    const panel = $("historyPanel");
    const content = $("historyContent");

    panel.hidden = false;
    $("historyTitle").textContent =
        `Lịch sử thanh toán: ${feeName}`;
    content.textContent = "Đang tải lịch sử thanh toán...";

    try {
        const history = await apiRequest(
            `${API_BASE}/${encodeURIComponent(feeId)}/payments`
        );

        if (!Array.isArray(history) || history.length === 0) {
            content.innerHTML = `
                <p class="fee-empty">
                    Khoản phí này chưa có giao dịch thanh toán.
                </p>
            `;
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        content.innerHTML = history.map(payment => {
            const method = payment.paymentMethod === "BANK_TRANSFER"
                ? "Chuyển khoản"
                : payment.paymentMethod === "CASH"
                    ? "Tiền mặt"
                    : payment.paymentMethod || "—";

            return `
                <div class="fee-history-row">
                    <div>
                        <strong>${formatMoney(payment.amount)}</strong>
                        <div class="fee-history-meta">
                            Thời gian: ${formatDateTime(payment.paidAt)}
                        </div>
                        <div class="fee-history-meta">
                            Hình thức: ${escapeHtml(method)}
                        </div>
                        ${payment.referenceCode ? `
                            <div class="fee-history-meta">
                                Mã giao dịch: ${escapeHtml(payment.referenceCode)}
                            </div>
                        ` : ""}
                        ${payment.note ? `
                            <div class="fee-history-meta">
                                Ghi chú: ${escapeHtml(payment.note)}
                            </div>
                        ` : ""}
                    </div>
                    <div class="fee-history-meta">
                        Người ghi nhận: ${escapeHtml(payment.receivedBy || "—")}
                    </div>
                </div>
            `;
        }).join("");

        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        content.textContent = error.message;
    }
}

function formatDateTime(value) {
    if (!value) return "—";

    const text = String(value);
    const datePart = formatDate(text.slice(0, 10));
    const timePart = text.length >= 16 ? text.slice(11, 16) : "";

    return timePart ? `${datePart} ${timePart}` : datePart;
}

async function loadFees() {
    $("welcomeUser").textContent =
        `Xin chào, ${localStorage.getItem("username") || "Sinh viên"}`;

    try {
        feeList = await apiRequest(API_BASE);

        if (!Array.isArray(feeList)) {
            throw new Error("Dữ liệu khoản phí trả về không hợp lệ.");
        }

        renderSummary();
        renderFees();
    } catch (error) {
        showMessage(error.message, true);

        $("feeTableBody").innerHTML = `
            <tr>
                <td colspan="8" class="fee-empty">
                    Không thể tải danh sách khoản phí.
                </td>
            </tr>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadFees();
});
