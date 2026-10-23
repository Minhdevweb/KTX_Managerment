const API_BASE = "/api/admin/fees";
const $ = (id) => document.getElementById(id);

let fees = [];
let contracts = [];

// =========================
// 1. XÁC THỰC VÀ GỌI API
// =========================

function getToken() {
    const keys = ["token", "accessToken", "jwt", "access_token"];

    for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) return value;
    }

    return null;
}

async function apiRequest(url, options = {}) {
    const token = getToken();

    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
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
        const message =
            typeof data === "string"
                ? data
                : data?.message ||
                data?.error ||
                `Yêu cầu thất bại (${response.status})`;

        throw new Error(message);
    }

    return data;
}

// =========================
// 2. HÀM TIỆN ÍCH
// =========================

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
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
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
    }[status] || status || "Không xác định";
}

function showMessage(element, message, type = "") {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
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

// =========================
// 3. TẢI DANH SÁCH HỢP ĐỒNG
// =========================

async function loadContracts() {
    const select = $("contractId");

    if (!select) return;

    select.innerHTML = `
        <option value="">Đang tải danh sách hợp đồng...</option>
    `;

    try {
        const data = await apiRequest(`${API_BASE}/active-contracts`);

        if (!Array.isArray(data)) {
            throw new Error("API hợp đồng không trả về danh sách hợp lệ.");
        }

        contracts = data;

        select.innerHTML = `
            <option value="">-- Chọn hợp đồng --</option>
        `;

        if (contracts.length === 0) {
            select.innerHTML = `
                <option value="">Không có hợp đồng đang hoạt động</option>
            `;

            showMessage(
                $("contractMessage"),
                "Hiện không có hợp đồng ACTIVE đủ thông tin để tạo khoản phí.",
                "error"
            );

            renderContractInfo(null);
            return;
        }

        contracts.forEach((contract) => {
            const option = document.createElement("option");

            option.value = contract.id;

            option.textContent =
                `${contract.contractNumber || `Hợp đồng #${contract.id}`} — ` +
                `${contract.studentName || contract.studentUsername || "Chưa có tên"} — ` +
                `${formatMoney(contract.monthlyFee)}`;

            select.appendChild(option);
        });

        renderContractInfo(null);

        showMessage(
            $("contractMessage"),
            `Đã tải ${contracts.length} hợp đồng đang hoạt động.`,
            "success"
        );
    } catch (error) {
        select.innerHTML = `
            <option value="">Không tải được danh sách hợp đồng</option>
        `;

        renderContractInfo(null);

        showMessage(
            $("contractMessage"),
            `Lỗi tải hợp đồng: ${error.message}`,
            "error"
        );
    }
}

// =========================
// 4. HIỂN THỊ THÔNG TIN HỢP ĐỒNG
// =========================

function renderContractInfo(contract) {
    const studentInfo = $("studentInfo");
    const monthlyFeeElement = $("contractMonthlyFee");

    if (!contract) {
        if (studentInfo) {
            studentInfo.innerHTML = `
                <p>Chọn hợp đồng để xem thông tin sinh viên.</p>
            `;
        }

        if (monthlyFeeElement) {
            monthlyFeeElement.textContent =
                "Mức phí tháng: Chưa chọn hợp đồng";
        }

        return;
    }

    if (studentInfo) {
        studentInfo.innerHTML = `
            <h3>Thông tin sinh viên</h3>
            <p>
                <strong>Họ tên:</strong>
                ${escapeHtml(contract.studentName || "Chưa cập nhật")}
            </p>
            <p>
                <strong>Tài khoản:</strong>
                ${escapeHtml(contract.studentUsername || "—")}
            </p>
            <p>
                <strong>Email:</strong>
                ${escapeHtml(contract.studentEmail || "—")}
            </p>
            <p>
                <strong>Số điện thoại:</strong>
                ${escapeHtml(contract.studentPhone || "—")}
            </p>
            <p>
                <strong>Mã hợp đồng:</strong>
                ${escapeHtml(contract.contractNumber || contract.id)}
            </p>
            <p>
                <strong>Thời hạn:</strong>
                ${formatDate(contract.startDate)}
                – ${formatDate(contract.endDate)}
            </p>
        `;
    }

    if (monthlyFeeElement) {
        monthlyFeeElement.textContent =
            `Mức phí tháng: ${formatMoney(contract.monthlyFee)}`;
    }
}

$("contractId")?.addEventListener("change", () => {
    const contractId = Number($("contractId").value);

    const contract = contracts.find(
        item => Number(item.id) === contractId
    );

    renderContractInfo(contract || null);
    showMessage($("contractMessage"), "");
});

// =========================
// 5. THỐNG KÊ KHOẢN PHÍ
// =========================

function renderStats() {
    const paidCount = fees.filter(
        fee => fee.status === "PAID"
    ).length;

    const unpaidCount = fees.filter(
        fee => fee.status !== "PAID"
    ).length;

    const totalDebt = fees.reduce(
        (sum, fee) => sum + getRemaining(fee),
        0
    );

    $("totalFees").textContent = fees.length;
    $("paidFees").textContent = paidCount;
    $("unpaidFees").textContent = unpaidCount;
    $("totalDebt").textContent = formatMoney(totalDebt);
}

// =========================
// 6. HIỂN THỊ BẢNG KHOẢN PHÍ
// =========================

function renderFees() {
    const keyword = $("searchInput").value.trim().toLowerCase();
    const selectedStatus = $("statusFilter").value;

    const filtered = fees.filter((fee) => {
        const searchText = [
            fee.feeName,
            fee.contractNumber,
            fee.studentName,
            fee.studentUsername,
            fee.id
        ].join(" ").toLowerCase();

        return searchText.includes(keyword) &&
            (!selectedStatus || fee.status === selectedStatus);
    });

    const body = $("feeTableBody");

    if (filtered.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="11" class="empty">
                    Không có khoản phí phù hợp.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML = filtered.map((fee) => {
        const remaining = getRemaining(fee);
        const status = fee.status || "UNPAID";

        return `
            <tr>
                <td>${escapeHtml(fee.id)}</td>

                <td>${escapeHtml(fee.feeName || "Tiền phòng")}</td>

                <td>
                    <strong>
                        ${escapeHtml(fee.studentName || "Chưa cập nhật")}
                    </strong>
                    <br>
                    <small>
                        ${escapeHtml(fee.studentUsername || "")}
                    </small>
                </td>

                <td>
                    ${escapeHtml(fee.contractNumber || "—")}
                </td>

                <td>
                    ${escapeHtml(formatMonth(fee.billingMonth))}
                </td>

                <td>${formatMoney(fee.amount)}</td>

                <td>${formatMoney(fee.paidAmount)}</td>

                <td>${formatMoney(remaining)}</td>

                <td>${escapeHtml(formatDate(fee.dueDate))}</td>

                <td>
                    <span class="status status-${escapeHtml(status)}">
                        ${escapeHtml(statusLabel(status))}
                    </span>
                </td>

                <td>
                    <div class="action-group">
                        ${remaining > 0 ? `
                            <button
                                type="button"
                                class="small-btn"
                                data-action="pay"
                                data-id="${escapeHtml(fee.id)}">
                                Thu tiền
                            </button>
                        ` : ""}

                        <button
                            type="button"
                            class="small-btn"
                            data-action="history"
                            data-id="${escapeHtml(fee.id)}">
                            Lịch sử
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// =========================
// 7. TẢI DANH SÁCH KHOẢN PHÍ
// =========================

async function loadFees() {
    showMessage($("listMessage"), "");

    try {
        const data = await apiRequest(API_BASE);

        if (!Array.isArray(data)) {
            throw new Error(
                "API danh sách khoản phí không trả về mảng JSON."
            );
        }

        fees = data;

        renderStats();
        renderFees();
    } catch (error) {
        $("feeTableBody").innerHTML = `
            <tr>
                <td colspan="11" class="empty">
                    Không tải được danh sách khoản phí.
                </td>
            </tr>
        `;

        showMessage($("listMessage"), error.message, "error");
    }
}

// =========================
// 8. TẠO KHOẢN PHÍ
// =========================

$("feeForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const contractId = Number($("contractId").value);
    const billingMonth = $("billingMonth").value;
    const dueDate = $("dueDate").value;
    const feeName = $("feeName").value.trim();

    if (!contractId) {
        showMessage(
            $("formMessage"),
            "Vui lòng chọn hợp đồng.",
            "error"
        );
        return;
    }

    if (!billingMonth || !dueDate || !feeName) {
        showMessage(
            $("formMessage"),
            "Vui lòng nhập đầy đủ thông tin.",
            "error"
        );
        return;
    }

    const selectedContract = contracts.find(
        item => Number(item.id) === contractId
    );

    if (!selectedContract) {
        showMessage(
            $("formMessage"),
            "Không tìm thấy hợp đồng đã chọn. Hãy tải lại danh sách.",
            "error"
        );
        return;
    }

    if (dueDate < `${billingMonth}-01`) {
        showMessage(
            $("formMessage"),
            "Hạn thanh toán không được trước tháng tính phí.",
            "error"
        );
        return;
    }

    const payload = {
        contractId,
        feeName,
        billingMonth: `${billingMonth}-01`,
        dueDate
    };

    const button = event.submitter;

    if (button) button.disabled = true;

    try {
        await apiRequest(API_BASE, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        showMessage(
            $("formMessage"),
            "Tạo khoản phí thành công.",
            "success"
        );

        // Giữ hợp đồng đã chọn, chỉ xóa thông tin khoản phí.
        $("feeName").value = "Tiền phòng";
        $("billingMonth").value = "";
        $("dueDate").value = "";

        await loadFees();
    } catch (error) {
        showMessage($("formMessage"), error.message, "error");
    } finally {
        if (button) button.disabled = false;
    }
});

// =========================
// 9. MỞ MODAL THANH TOÁN / LỊCH SỬ
// =========================

$("feeTableBody").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const feeId = Number(button.dataset.id);

    const fee = fees.find(
        item => Number(item.id) === feeId
    );

    if (!fee) return;

    if (button.dataset.action === "pay") {
        const remaining = getRemaining(fee);

        $("paymentFeeId").value = fee.id;
        $("paymentAmount").value = "";
        $("paymentAmount").max = String(remaining);
        $("paymentAmount").placeholder =
            `Tối đa ${remaining}`;

        $("paymentMethod").value = "CASH";
        $("referenceCode").value = "";
        $("paymentNote").value = "";

        $("paymentFeeInfo").textContent =
            `${fee.feeName || "Khoản phí"} — ` +
            `Sinh viên: ${fee.studentName || "Chưa cập nhật"} — ` +
            `Hợp đồng ${fee.contractNumber || "—"}. ` +
            `Còn phải đóng: ${formatMoney(remaining)}.`;

        showMessage($("paymentMessage"), "");

        $("paymentModal").classList.remove("hidden");
    }

    if (button.dataset.action === "history") {
        await loadHistory(fee);
    }
});

// =========================
// 10. GHI NHẬN THANH TOÁN
// =========================

$("paymentForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const feeId = Number($("paymentFeeId").value);
    const amount = Number($("paymentAmount").value);

    const fee = fees.find(
        item => Number(item.id) === feeId
    );

    if (!fee || !Number.isFinite(amount) || amount <= 0) {
        showMessage(
            $("paymentMessage"),
            "Số tiền thanh toán không hợp lệ.",
            "error"
        );
        return;
    }

    if (amount > getRemaining(fee)) {
        showMessage(
            $("paymentMessage"),
            "Số tiền vượt quá số dư còn phải đóng.",
            "error"
        );
        return;
    }

    const payload = {
        amount,
        paymentMethod: $("paymentMethod").value,
        referenceCode: $("referenceCode").value.trim(),
        note: $("paymentNote").value.trim()
    };

    const button = event.submitter;

    if (button) button.disabled = true;

    try {
        await apiRequest(`${API_BASE}/${feeId}/payments`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        $("paymentModal").classList.add("hidden");

        await loadFees();

        showMessage(
            $("listMessage"),
            "Đã ghi nhận thanh toán thành công.",
            "success"
        );
    } catch (error) {
        showMessage(
            $("paymentMessage"),
            error.message,
            "error"
        );
    } finally {
        if (button) button.disabled = false;
    }
});

// =========================
// 11. XEM LỊCH SỬ THANH TOÁN
// =========================

async function loadHistory(fee) {
    $("historyContent").innerHTML =
        "<p>Đang tải lịch sử thanh toán...</p>";

    $("historyModal").classList.remove("hidden");

    try {
        const payments = await apiRequest(
            `${API_BASE}/${fee.id}/payments`
        );

        if (!Array.isArray(payments) || payments.length === 0) {
            $("historyContent").innerHTML = `
                <p class="empty">
                    Chưa có giao dịch thanh toán.
                </p>
            `;
            return;
        }

        $("historyContent").innerHTML = `
            <p>
                <strong>Khoản phí:</strong>
                ${escapeHtml(fee.feeName || "Khoản phí")}
            </p>

            <p>
                <strong>Sinh viên:</strong>
                ${escapeHtml(fee.studentName || "Chưa cập nhật")}
            </p>

            <p>
                <strong>Hợp đồng:</strong>
                ${escapeHtml(fee.contractNumber || "—")}
            </p>

            <div class="table-wrap">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Ngày thanh toán</th>
                            <th>Số tiền</th>
                            <th>Phương thức</th>
                            <th>Mã giao dịch</th>
                            <th>Người nhận</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${payments.map(payment => `
                            <tr>
                                <td>
                                    ${escapeHtml(
            payment.paidAt
                ? String(payment.paidAt).replace("T", " ")
                : "—"
        )}
                                </td>

                                <td>${formatMoney(payment.amount)}</td>

                                <td>
                                    ${escapeHtml(
            payment.paymentMethod === "BANK_TRANSFER"
                ? "Chuyển khoản"
                : payment.paymentMethod === "CASH"
                    ? "Tiền mặt"
                    : payment.paymentMethod || "—"
        )}
                                </td>

                                <td>
                                    ${escapeHtml(payment.referenceCode || "—")}
                                </td>

                                <td>
                                    ${escapeHtml(payment.receivedBy || "—")}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        $("historyContent").innerHTML = `
            <p class="message error">
                ${escapeHtml(error.message)}
            </p>
        `;
    }
}

// =========================
// 12. ĐÓNG MODAL
// =========================

function closeModals() {
    $("paymentModal").classList.add("hidden");
    $("historyModal").classList.add("hidden");
}

$("closeModal").addEventListener("click", closeModals);
$("cancelPayment").addEventListener("click", closeModals);
$("closeHistory").addEventListener("click", closeModals);

$("refreshBtn").addEventListener("click", async () => {
    await Promise.all([
        loadContracts(),
        loadFees()
    ]);
});

$("searchInput").addEventListener("input", renderFees);
$("statusFilter").addEventListener("change", renderFees);

$("paymentModal").addEventListener("click", (event) => {
    if (event.target === $("paymentModal")) {
        closeModals();
    }
});

$("historyModal").addEventListener("click", (event) => {
    if (event.target === $("historyModal")) {
        closeModals();
    }
});

// =========================
// 13. KHỞI TẠO TRANG
// =========================

async function initFeeManagement() {
    await Promise.all([
        loadContracts(),
        loadFees()
    ]);
}

initFeeManagement();