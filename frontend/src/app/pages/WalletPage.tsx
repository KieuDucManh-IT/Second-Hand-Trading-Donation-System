import { useEffect, useMemo, useState } from "react";
import {
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    Copy,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    QrCode,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

type WalletData = {
    id: string;
    address: string;
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    currency: string;
    status: string;
};

type Transaction = {
    _id: string;
    type: "deposit" | "withdraw";
    status: "pending" | "completed" | "failed" | "rejected" | "expired";
    amount: number;
    code: string;
    transferContent?: string;
    createdAt: string;
    bankInfo?: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
    };
};

type DepositPayment = {
    orderCode: number;
    amount: number;
    transferContent: string;
    checkoutUrl?: string;
    qrCode?: string;
};

const banks = [
    { name: "Vietcombank", bin: "970436" },
    { name: "Techcombank", bin: "970407" },
    { name: "MB Bank", bin: "970422" },
    { name: "BIDV", bin: "970418" },
    { name: "VietinBank", bin: "970415" },
    { name: "ACB", bin: "970416" },
    { name: "VPBank", bin: "970432" },
    { name: "TPBank", bin: "970423" },
    { name: "Sacombank", bin: "970403" },
    { name: "Agribank", bin: "970405" },
];

function formatMoney(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getToken() {
    return (
        sessionStorage.getItem("token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("authToken") ||
        ""
    );
}

function statusStyle(status: string) {
    switch (status) {
        case "completed":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "pending":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "failed":
        case "rejected":
        case "expired":
            return "bg-red-50 text-red-700 border-red-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

function StatusIcon({ status }: { status: string }) {
    if (status === "completed") return <CheckCircle2 size={16} />;
    if (status === "pending") return <Clock size={16} />;
    return <XCircle size={16} />;
}

export default function WalletPage() {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
    const [loading, setLoading] = useState(false);

    const [depositAmount, setDepositAmount] = useState("");
    const [depositPayment, setDepositPayment] = useState<DepositPayment | null>(
        null
    );

    const [withdrawForm, setWithdrawForm] = useState({
        amount: "",
        bankName: "MB Bank",
        bankBin: "970422",
        accountNumber: "",
        accountName: "",
    });

    const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

    const qrValue = useMemo(() => {
        if (!depositPayment) return "";

        return (
            depositPayment.qrCode ||
            depositPayment.checkoutUrl ||
            depositPayment.transferContent ||
            ""
        );
    }, [depositPayment]);

    async function api(path: string, options: RequestInit = {}) {
        const token = getToken();

        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
                ...(options.headers || {}),
            },
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("API lỗi:", data);
            throw new Error(data.message || data.error || "Có lỗi xảy ra");
        }

        return data;
    }

    async function fetchWallet() {
        try {
            setLoading(true);
            const data = await api("/wallet");
            setWallet(data.wallet);
            setTransactions(data.transactions || []);
        } catch (error: any) {
            alert(error.message || "Không thể tải ví");
        } finally {
            setLoading(false);
        }
    }

    async function createDeposit() {
        try {
            const amount = Number(depositAmount);

            if (!amount || amount < 10000) {
                alert("Số tiền nạp tối thiểu là 10.000đ");
                return;
            }

            setLoading(true);

            const data = await api("/wallet/deposit", {
                method: "POST",
                body: JSON.stringify({ amount }),
            });

            setDepositPayment(data.payment);
            await fetchWallet();
        } catch (error: any) {
            alert(error.message || "Không thể tạo yêu cầu nạp tiền");
        } finally {
            setLoading(false);
        }
    }

    async function syncWithdrawStatus(transactionId: string) {
        try {
            setLoading(true);

            await api(`/wallet/withdraw/${transactionId}/sync`, {
                method: "POST",
            });

            await fetchWallet();
        } catch (error: any) {
            alert(error.message || "Không thể kiểm tra trạng thái rút tiền");
        } finally {
            setLoading(false);
        }
    }

    async function createWithdraw() {
        try {
            const amount = Number(withdrawForm.amount);

            if (!amount || amount < 10000) {
                alert("Số tiền rút tối thiểu là 10.000đ");
                return;
            }

            if (!withdrawForm.bankBin || !withdrawForm.bankName) {
                alert("Vui lòng chọn ngân hàng");
                return;
            }

            if (!withdrawForm.accountNumber.trim()) {
                alert("Vui lòng nhập số tài khoản");
                return;
            }

            if (!withdrawForm.accountName.trim()) {
                alert("Vui lòng nhập tên chủ tài khoản");
                return;
            }

            setLoading(true);

            const data = await api("/wallet/withdraw", {
                method: "POST",
                body: JSON.stringify({
                    amount,
                    bankName: withdrawForm.bankName,
                    bankBin: withdrawForm.bankBin,
                    bankCode: withdrawForm.bankBin,
                    accountNumber: withdrawForm.accountNumber.trim(),
                    accountName: withdrawForm.accountName.trim().toUpperCase(),
                }),
            });

            alert("Đã tạo yêu cầu rút tiền. Hệ thống đang xử lý chuyển khoản tự động.");

            setWithdrawForm({
                amount: "",
                bankName: "MB Bank",
                bankBin: "970422",
                accountNumber: "",
                accountName: "",
            });

            await fetchWallet();

            if (data.transaction?._id) {
                setTimeout(() => {
                    syncWithdrawStatus(data.transaction._id);
                }, 8000);
            }
        } catch (error: any) {
            alert(error.message || "Không thể tạo yêu cầu rút tiền");
        } finally {
            setLoading(false);
        }
    }

    function copyText(value: string) {
        navigator.clipboard.writeText(value);
        alert("Đã sao chép");
    }

    useEffect(() => {
        fetchWallet();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50 px-4 py-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                            <Wallet size={16} />
                            SecondLife Wallet
                        </div>

                        <h1 className="text-4xl font-bold text-slate-900">
                            Ví của tôi
                        </h1>

                        <p className="mt-2 max-w-2xl text-slate-600">
                            Nạp tiền, rút tiền và theo dõi toàn bộ giao dịch của bạn trên hệ
                            thống SecondLife.
                        </p>
                    </div>

                    <button
                        onClick={fetchWallet}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Làm mới
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60">
                            <div className="bg-gradient-to-br from-emerald-500 to-sky-500 p-6 text-white">
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="rounded-2xl bg-white/20 p-3">
                                        <Wallet size={28} />
                                    </div>
                                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                                        Active
                                    </span>
                                </div>

                                <p className="text-sm text-white/80">Số dư khả dụng</p>
                                <h2 className="mt-2 text-4xl font-bold">
                                    {formatMoney(wallet?.availableBalance || 0)}
                                </h2>

                                <div className="mt-6 rounded-2xl bg-white/15 p-4 backdrop-blur">
                                    <p className="text-xs text-white/75">Địa chỉ ví cố định</p>
                                    <div className="mt-1 flex items-center justify-between gap-3">
                                        <p className="font-semibold tracking-wide">
                                            {wallet?.address || "Đang tạo..."}
                                        </p>
                                        {wallet?.address && (
                                            <button onClick={() => copyText(wallet.address)}>
                                                <Copy size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-6">
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                    <span className="text-slate-500">Tổng số dư</span>
                                    <span className="font-bold text-slate-900">
                                        {formatMoney(wallet?.balance || 0)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                    <span className="text-slate-500">Đang chờ xử lý</span>
                                    <span className="font-bold text-amber-600">
                                        {formatMoney(wallet?.lockedBalance || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/60">
                            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                                <button
                                    onClick={() => setActiveTab("deposit")}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${activeTab === "deposit"
                                        ? "bg-white text-emerald-600 shadow-sm"
                                        : "text-slate-500"
                                        }`}
                                >
                                    <ArrowDownToLine size={18} />
                                    Nạp tiền
                                </button>

                                <button
                                    onClick={() => setActiveTab("withdraw")}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${activeTab === "withdraw"
                                        ? "bg-white text-sky-600 shadow-sm"
                                        : "text-slate-500"
                                        }`}
                                >
                                    <ArrowUpFromLine size={18} />
                                    Rút tiền
                                </button>
                            </div>

                            {activeTab === "deposit" && (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <h3 className="mb-2 text-xl font-bold text-slate-900">
                                            Tạo yêu cầu nạp tiền
                                        </h3>
                                        <p className="mb-5 text-sm text-slate-500">
                                            Nhập số tiền cần nạp. Hệ thống sẽ tạo nội dung chuyển
                                            khoản riêng cho ví của bạn.
                                        </p>

                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            placeholder="Nhập số tiền"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                        />

                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {quickAmounts.map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setDepositAmount(String(amount))}
                                                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                >
                                                    {formatMoney(amount)}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={createDeposit}
                                            disabled={loading}
                                            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-200 transition hover:scale-[1.01] disabled:opacity-60"
                                        >
                                            Tạo mã nạp tiền
                                        </button>
                                    </div>

                                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                                        {!depositPayment ? (
                                            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                                                <div className="mb-4 rounded-3xl bg-white p-5 text-slate-400 shadow-sm">
                                                    <QrCode size={52} />
                                                </div>
                                                <h4 className="font-bold text-slate-800">
                                                    QR nạp tiền sẽ hiển thị ở đây
                                                </h4>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Sau khi tạo lệnh nạp, hãy chuyển khoản đúng nội dung
                                                    để hệ thống nhận diện ví.
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="mx-auto mb-4 flex w-fit rounded-3xl bg-white p-4 shadow-sm">
                                                    <QRCodeCanvas value={qrValue} size={190} />
                                                </div>

                                                <div className="space-y-3">
                                                    <InfoRow
                                                        label="Mã đơn nạp"
                                                        value={String(depositPayment.orderCode)}
                                                        copy
                                                        onCopy={() => copyText(String(depositPayment.orderCode))}
                                                    />

                                                    <InfoRow
                                                        label="Số tiền"
                                                        value={formatMoney(depositPayment.amount)}
                                                    />

                                                    <InfoRow
                                                        label="Nội dung thanh toán"
                                                        value={depositPayment.transferContent}
                                                        copy
                                                        important
                                                        onCopy={() => copyText(depositPayment.transferContent)}
                                                    />
                                                </div>

                                                <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
                                                    Lưu ý: vui lòng chuyển khoản đúng số tiền và đúng nội
                                                    dung. Giao dịch sẽ được cộng vào ví sau khi hệ thống
                                                    xác nhận tiền đã vào tài khoản.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "withdraw" && (
                                <div>
                                    <h3 className="mb-2 text-xl font-bold text-slate-900">
                                        Rút tiền về tài khoản ngân hàng
                                    </h3>
                                    <p className="mb-5 text-sm text-slate-500">
                                        Số tiền rút sẽ được giữ ở trạng thái chờ xử lý cho đến khi
                                        hệ thống hoàn tất chuyển khoản.
                                    </p>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-600">
                                                Ngân hàng
                                            </label>
                                            <select
                                                value={withdrawForm.bankBin}
                                                onChange={(e) => {
                                                    const selectedBank = banks.find((bank) => bank.bin === e.target.value);

                                                    setWithdrawForm({
                                                        ...withdrawForm,
                                                        bankBin: selectedBank?.bin || "",
                                                        bankName: selectedBank?.name || "",
                                                    });
                                                }}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            >
                                                {banks.map((bank) => (
                                                    <option key={bank.bin} value={bank.bin}>
                                                        {bank.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-600">
                                                Số tài khoản
                                            </label>
                                            <input
                                                value={withdrawForm.accountNumber}
                                                onChange={(e) =>
                                                    setWithdrawForm({
                                                        ...withdrawForm,
                                                        accountNumber: e.target.value,
                                                    })
                                                }
                                                placeholder="Nhập số tài khoản"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-600">
                                                Tên chủ tài khoản
                                            </label>
                                            <input
                                                value={withdrawForm.accountName}
                                                onChange={(e) =>
                                                    setWithdrawForm({
                                                        ...withdrawForm,
                                                        accountName: e.target.value.toUpperCase(),
                                                    })
                                                }
                                                placeholder="VD: NGUYEN VAN A"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-600">
                                                Số tiền rút
                                            </label>
                                            <input
                                                type="number"
                                                value={withdrawForm.amount}
                                                onChange={(e) =>
                                                    setWithdrawForm({
                                                        ...withdrawForm,
                                                        amount: e.target.value,
                                                    })
                                                }
                                                placeholder="Nhập số tiền"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm text-sky-700">
                                        Số dư khả dụng hiện tại:{" "}
                                        <b>{formatMoney(wallet?.availableBalance || 0)}</b>
                                    </div>

                                    <button
                                        onClick={createWithdraw}
                                        disabled={loading}
                                        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-4 font-bold text-white shadow-lg shadow-sky-200 transition hover:scale-[1.01] disabled:opacity-60"
                                    >
                                        Gửi yêu cầu rút tiền
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/60">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">
                            Lịch sử giao dịch
                        </h3>
                        <span className="text-sm text-slate-500">
                            {transactions.length} giao dịch gần nhất
                        </span>
                    </div>

                    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                        {transactions.length === 0 && (
                            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                                Chưa có giao dịch nào.
                            </div>
                        )}

                        {transactions.map((item) => (
                            <div
                                key={item._id}
                                className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`rounded-2xl p-3 ${item.type === "deposit"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-sky-50 text-sky-600"
                                            }`}
                                    >
                                        {item.type === "deposit" ? (
                                            <ArrowDownToLine size={22} />
                                        ) : (
                                            <ArrowUpFromLine size={22} />
                                        )}
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-900">
                                            {item.type === "deposit" ? "Nạp tiền" : "Rút tiền"}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Mã GD: {item.code}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 md:justify-end">
                                    <p
                                        className={`text-lg font-bold ${item.type === "deposit"
                                            ? "text-emerald-600"
                                            : "text-slate-900"
                                            }`}
                                    >
                                        {item.type === "deposit" ? "+" : "-"}
                                        {formatMoney(item.amount)}
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                                                item.status
                                            )}`}
                                        >
                                            <StatusIcon status={item.status} />
                                            {item.status}
                                        </span>

                                        {item.type === "withdraw" && item.status === "pending" && (
                                            <button
                                                onClick={() => syncWithdrawStatus(item._id)}
                                                disabled={loading}
                                                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                                            >
                                                Kiểm tra
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    copy,
    important,
    onCopy,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
    copy?: boolean;
    important?: boolean;
    onCopy?: () => void;
}) {
    return (
        <div
            className={`rounded-2xl p-3 ${important ? "bg-emerald-50" : "bg-white"
                }`}
        >
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                {icon}
                {label}
            </div>

            <div className="flex items-center justify-between gap-3">
                <p
                    className={`break-all font-semibold ${important ? "text-emerald-700" : "text-slate-800"
                        }`}
                >
                    {value}
                </p>

                {copy && (
                    <button
                        onClick={onCopy}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <Copy size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}