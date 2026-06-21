const mongoose = require("mongoose");
const crypto = require("crypto");

const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const payOS = require("../config/payos");
const {
    createSinglePayout,
    getPayoutDetail,
} = require("../utils/payosPayout");

function getUserId(req) {
    return req.user?._id || req.user?.id || req.userId;
}

function makeWalletAddress(userId) {
    return `SL${String(userId).slice(-10).toUpperCase()}`;
}

function makeCode(prefix) {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}${Date.now()}${random}`;
}

function makeOrderCode() {
    return Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`);
}

async function ensureWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
        wallet = await Wallet.create({
            user: userId,
            address: makeWalletAddress(userId),
            balance: 0,
            lockedBalance: 0,
        });
    }

    return wallet;
}

exports.getMyWallet = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        const wallet = await ensureWallet(userId);

        const transactions = await WalletTransaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            wallet: {
                id: wallet._id,
                address: wallet.address,
                balance: wallet.balance,
                lockedBalance: wallet.lockedBalance,
                availableBalance: wallet.balance - wallet.lockedBalance,
                currency: wallet.currency || "VND",
                status: wallet.status || "active",
            },
            transactions,
        });
    } catch (error) {
        console.error("GET WALLET ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Không thể lấy thông tin ví",
            error: error.message,
        });
    }
};

exports.createDepositRequest = async (req, res) => {
    try {
        const userId = getUserId(req);
        const amount = Number(req.body.amount);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        if (!amount || amount < 10000) {
            return res.status(400).json({
                success: false,
                message: "Số tiền nạp tối thiểu là 10.000đ",
            });
        }

        if (
            !process.env.PAYOS_CLIENT_ID ||
            !process.env.PAYOS_API_KEY ||
            !process.env.PAYOS_CHECKSUM_KEY
        ) {
            return res.status(500).json({
                success: false,
                message: "Thiếu cấu hình payOS trong file .env",
            });
        }

        if (!process.env.FRONTEND_URL) {
            return res.status(500).json({
                success: false,
                message: "Thiếu FRONTEND_URL trong file .env",
            });
        }

        const wallet = await ensureWallet(userId);
        const orderCode = makeOrderCode();

        // payOS giới hạn mô tả khá ngắn, nên dùng không dấu và ngắn gọn
        const description = `SL DEP${orderCode}`.slice(0, 25);

        const paymentLink = await payOS.paymentRequests.create({
            orderCode,
            amount,
            description,
            items: [
                {
                    name: "Nap tien vi SecondLife",
                    quantity: 1,
                    price: amount,
                },
            ],
            returnUrl: `${process.env.FRONTEND_URL}/wallet?payment=success`,
            cancelUrl: `${process.env.FRONTEND_URL}/wallet?payment=cancel`,
        });

        const transaction = await WalletTransaction.create({
            wallet: wallet._id,
            user: userId,
            type: "deposit",
            status: "pending",
            amount,
            code: `DEP${orderCode}`,
            orderCode,
            transferContent: description,
            provider: "payos",
            paymentLinkId: paymentLink.paymentLinkId,
            checkoutUrl: paymentLink.checkoutUrl,
            qrCode: paymentLink.qrCode,
            providerPayload: paymentLink,
            note: "Đang chờ thanh toán qua payOS",
        });

        res.status(201).json({
            success: true,
            message: "Đã tạo mã nạp tiền",
            transaction,
            payment: {
                orderCode,
                amount,
                transferContent: description,
                checkoutUrl: paymentLink.checkoutUrl,
                qrCode: paymentLink.qrCode,
            },
        });
    } catch (error) {
        console.error("CREATE DEPOSIT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Không thể tạo yêu cầu nạp tiền",
            error: error.message,
        });
    }
};

exports.createWithdrawRequest = async (req, res) => {
    let createdTransaction = null;

    try {
        const userId = getUserId(req);
        const {
            amount,
            bankCode,
            bankBin,
            bankName,
            accountNumber,
            accountName,
        } = req.body;

        const withdrawAmount = Number(amount);
        const toBin = bankBin || bankCode;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        if (!withdrawAmount || withdrawAmount < 10000) {
            return res.status(400).json({
                success: false,
                message: "Số tiền rút tối thiểu là 10.000đ",
            });
        }

        if (!toBin || !bankName || !accountNumber || !accountName) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ ngân hàng, số tài khoản và tên chủ tài khoản",
            });
        }

        const wallet = await ensureWallet(userId);
        const availableBalance = wallet.balance - wallet.lockedBalance;

        if (availableBalance < withdrawAmount) {
            return res.status(400).json({
                success: false,
                message: "Số dư khả dụng không đủ",
            });
        }

        const referenceId = `WDR_${Date.now()}_${String(userId).slice(-6)}`;

        wallet.lockedBalance += withdrawAmount;
        await wallet.save();

        createdTransaction = await WalletTransaction.create({
            wallet: wallet._id,
            user: userId,
            type: "withdraw",
            status: "pending",
            amount: withdrawAmount,
            code: referenceId,
            provider: "payos",
            payoutReferenceId: referenceId,
            providerStatus: "CREATED",
            bankInfo: {
                bankCode: toBin,
                bankName,
                accountNumber,
                accountName,
            },
            note: "Đã khóa tiền, đang tạo lệnh chi tự động",
        });

        const payoutPayload = {
            referenceId,
            amount: withdrawAmount,
            description: `Rut tien SecondLife ${referenceId}`.slice(0, 50),
            toBin,
            toAccountNumber: accountNumber,
            category: ["withdraw"],
        };

        const payoutData = await createSinglePayout(payoutPayload);

        const firstTransaction = Array.isArray(payoutData.transactions)
            ? payoutData.transactions[0]
            : payoutData.transactions?.[0];

        createdTransaction.payoutId = payoutData.id;
        createdTransaction.providerStatus =
            firstTransaction?.state || payoutData.approvalState || "PROCESSING";
        createdTransaction.providerPayload = payoutData;
        createdTransaction.note = "Lệnh rút tiền đã gửi sang payOS, đang xử lý";

        await createdTransaction.save();

        // Tự kiểm tra sau vài giây để cập nhật completed/failed
        setTimeout(() => {
            syncWithdrawTransaction(createdTransaction._id).catch((error) => {
                console.error("AUTO SYNC WITHDRAW ERROR:", error);
            });
        }, 8000);

        return res.status(201).json({
            success: true,
            message: "Yêu cầu rút tiền đang được xử lý tự động",
            transaction: createdTransaction,
        });
    } catch (error) {
        console.error("CREATE WITHDRAW ERROR:", error);

        if (createdTransaction) {
            await Wallet.updateOne(
                { _id: createdTransaction.wallet },
                {
                    $inc: {
                        lockedBalance: -createdTransaction.amount,
                    },
                }
            );

            createdTransaction.status = "failed";
            createdTransaction.providerStatus = "CREATE_PAYOUT_FAILED";
            createdTransaction.providerPayload = error.response || {
                message: error.message,
            };

            if (
                error.message?.includes("API key không tồn tại") ||
                error.response?.desc?.includes("API key không tồn tại")
            ) {
                createdTransaction.note =
                    "payOS chưa bật hoặc chưa nhận API key cho chức năng Lệnh chi/Payout. Đã hoàn tiền khóa.";
            } else {
                createdTransaction.note = "Tạo lệnh chi thất bại, đã hoàn tiền khóa.";
            }

            await createdTransaction.save();
        }

        return res.status(400).json({
            success: false,
            message:
                error.response?.desc ||
                error.message ||
                "Không thể tạo yêu cầu rút tiền",
            error: error.response,
        });
    }
};
async function syncWithdrawTransaction(transactionId) {
    const transaction = await WalletTransaction.findById(transactionId);

    if (!transaction) {
        throw new Error("Không tìm thấy giao dịch rút tiền");
    }

    if (transaction.status === "completed" || transaction.status === "failed") {
        return transaction;
    }

    if (!transaction.payoutId) {
        await Wallet.updateOne(
            {
                _id: transaction.wallet,
                lockedBalance: { $gte: transaction.amount },
            },
            {
                $inc: {
                    lockedBalance: -transaction.amount,
                },
            }
        );

        transaction.status = "failed";
        transaction.providerStatus = "NO_PAYOUT_ID";
        transaction.note =
            "Giao dịch rút tiền chưa được gửi sang payOS, đã hoàn tiền khóa";

        await transaction.save();

        return transaction;
    }

    const payoutData = await getPayoutDetail(transaction.payoutId);

    const firstTransaction = Array.isArray(payoutData.transactions)
        ? payoutData.transactions[0]
        : payoutData.transactions?.[0];

    const payoutState =
        firstTransaction?.state || payoutData.approvalState || "PROCESSING";

    transaction.providerStatus = payoutState;
    transaction.providerPayload = payoutData;

    if (payoutState === "SUCCEEDED") {
        await Wallet.updateOne(
            {
                _id: transaction.wallet,
                lockedBalance: { $gte: transaction.amount },
                balance: { $gte: transaction.amount },
            },
            {
                $inc: {
                    balance: -transaction.amount,
                    lockedBalance: -transaction.amount,
                },
            }
        );

        transaction.status = "completed";
        transaction.completedAt = new Date();
        transaction.note = "Rút tiền thành công qua payOS";
    } else if (
        ["FAILED", "CANCELED", "REJECTED", "ERROR"].includes(payoutState)
    ) {
        await Wallet.updateOne(
            {
                _id: transaction.wallet,
                lockedBalance: { $gte: transaction.amount },
            },
            {
                $inc: {
                    lockedBalance: -transaction.amount,
                },
            }
        );

        transaction.status = "failed";
        transaction.note = "Rút tiền thất bại, đã hoàn tiền khóa";
    } else {
        transaction.status = "pending";
        transaction.note = `Lệnh rút tiền đang xử lý: ${payoutState}`;
    }

    await transaction.save();

    return transaction;
};
exports.syncWithdrawStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await syncWithdrawTransaction(transactionId);

        return res.json({
            success: true,
            message: "Đã đồng bộ trạng thái rút tiền",
            transaction,
        });
    } catch (error) {
        console.error("SYNC WITHDRAW ERROR:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Không thể đồng bộ trạng thái rút tiền",
        });
    }
};