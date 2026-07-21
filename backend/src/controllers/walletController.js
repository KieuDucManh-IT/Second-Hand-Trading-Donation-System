const mongoose = require("mongoose");
const crypto = require("crypto");

const Wallet = require("../models/modelWallet");
const WalletTransaction = require("../models/modelWalletTransaction");
const payOS = require("../config/payos");
const User = require("../models/modelUser");
const sendEmail = require("../utils/sendEmail");

const {
    generateOTP,
    hashOTP,
    saveOTP,
    getOTP,
    deleteOTP,
    increaseAttempts,
} = require("../utils/otpStore");

const {
    createSinglePayout,
    getPayoutDetail,
} = require("../utils/payosPayout");

const WALLET_PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/;

function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function maskEmail(email) {
    const [name, domain] = String(email).split("@");

    if (!name || !domain) return email;

    return `${name.slice(0, 2)}***@${domain}`;
}

function isCorrectOTP(inputOTP, storedHash) {
    const inputHash = Buffer.from(hashOTP(inputOTP), "hex");
    const savedHash = Buffer.from(storedHash, "hex");

    return (
        inputHash.length === savedHash.length &&
        crypto.timingSafeEqual(inputHash, savedHash)
    );
}

function verifyOTPOrThrow(key, otp) {
    const otpData = getOTP(key);

    if (!otpData) {
        throw createHttpError(400, "OTP không tồn tại hoặc đã hết hạn");
    }

    if (otpData.expiresAt < Date.now()) {
        deleteOTP(key);
        throw createHttpError(400, "OTP đã hết hạn");
    }

    if (otpData.attempts >= 5) {
        deleteOTP(key);
        throw createHttpError(
            429,
            "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng gửi lại OTP"
        );
    }

    if (!isCorrectOTP(otp, otpData.otpHash)) {
        increaseAttempts(key);
        throw createHttpError(400, "OTP không chính xác");
    }
}

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

async function verifyWalletPassword(userId, walletPassword) {
    if (!walletPassword) {
        throw createHttpError(400, "Vui lòng nhập mật khẩu ví");
    }

    await ensureWallet(userId);

    const wallet = await Wallet.findOne({ user: userId }).select(
        "+walletPasswordHash +walletPasswordFailedAttempts +walletPasswordLockedUntil"
    );

    if (!wallet.walletPasswordHash) {
        throw createHttpError(
            400,
            "Bạn chưa thiết lập mật khẩu ví"
        );
    }

    if (
        wallet.walletPasswordLockedUntil &&
        wallet.walletPasswordLockedUntil.getTime() > Date.now()
    ) {
        throw createHttpError(
            423,
            "Mật khẩu ví đang bị khóa tạm thời do nhập sai quá nhiều lần"
        );
    }

    const isMatch = await wallet.compareWalletPassword(walletPassword);

    if (!isMatch) {
        wallet.walletPasswordFailedAttempts += 1;

        if (wallet.walletPasswordFailedAttempts >= 5) {
            wallet.walletPasswordFailedAttempts = 0;
            wallet.walletPasswordLockedUntil = new Date(
                Date.now() + 15 * 60 * 1000
            );
        }

        await wallet.save();

        throw createHttpError(401, "Mật khẩu ví không chính xác");
    }

    wallet.walletPasswordFailedAttempts = 0;
    wallet.walletPasswordLockedUntil = null;

    await wallet.save();

    return wallet;
}

async function syncWithdrawTransaction(transactionId, userId = null) {
    const filter = {
        _id: transactionId,
    };

    if (userId) {
        filter.user = userId;
    }

    const transaction = await WalletTransaction.findOne(filter);

    if (transaction.providerStatus === "OTP_PENDING") {
        throw new Error("Giao dịch chưa được xác nhận OTP");
    }

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

        const walletWithSecurity = await Wallet.findById(wallet._id)
            .select("+walletPasswordHash");

        const hasWalletPassword = Boolean(
            walletWithSecurity.walletPasswordHash
        );

        const transactions = await WalletTransaction.find({ user: userId })
            .populate({
                path: "order",
                populate: [
                    { path: "productId", select: "title thumbnail images price" },
                    { path: "buyerId", select: "fullName email avatar userName" },
                    { path: "sellerId", select: "fullName email avatar userName" }
                ]
            })
            .populate({
                path: "exchangeInvoice",
                populate: [
                    { path: "requesterProduct", select: "title thumbnail images price" },
                    { path: "receiverProduct", select: "title thumbnail images price" },
                    { path: "requester", select: "fullName email avatar userName" },
                    { path: "receiver", select: "fullName email avatar userName" }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(20);


        res.json({
            success: true,
            wallet: {
                id: wallet._id,
                address: wallet.address,
                balance: wallet.balance,
                lockedBalance: wallet.lockedBalance,
                availableBalance:
                    wallet.balance - wallet.lockedBalance,
                currency: wallet.currency || "VND",
                status: wallet.status || "active",

                // thêm field này
                hasWalletPassword
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

        const description = `SL DEP${orderCode}`.slice(0, 25);

        const paymentLink = await payOS.paymentRequests.create({
            orderCode,
            amount,
            description,
            items: [
                {
                    name: "Nap tien vi SHTD System",
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

exports.sendWithdrawOTP = async (req, res) => {
    let transaction = null;

    try {
        const userId = getUserId(req);

        const {
            amount,
            bankCode,
            bankBin,
            bankName,
            accountNumber,
            accountName,
            walletPassword,
        } = req.body;

        const withdrawAmount = Number(amount);
        const toBin = bankBin || bankCode;

        if (!withdrawAmount || withdrawAmount < 10000) {
            throw createHttpError(
                400,
                "Số tiền rút tối thiểu là 10.000đ"
            );
        }

        if (!toBin || !bankName || !accountNumber || !accountName) {
            throw createHttpError(
                400,
                "Vui lòng nhập đầy đủ thông tin ngân hàng"
            );
        }

        if (!/^\d{6,20}$/.test(String(accountNumber))) {
            throw createHttpError(
                400,
                "Số tài khoản phải gồm từ 6 đến 20 chữ số"
            );
        }

        await verifyWalletPassword(userId, walletPassword);

        const wallet = await Wallet.findOne({ user: userId });

        if (!wallet || wallet.status !== "active") {
            throw createHttpError(423, "Ví hiện đang bị khóa");
        }

        const availableBalance =
            wallet.balance - wallet.lockedBalance;

        if (availableBalance < withdrawAmount) {
            throw createHttpError(400, "Số dư khả dụng không đủ");
        }

        // Đánh dấu các OTP rút tiền cũ là hết hạn
        await WalletTransaction.updateMany(
            {
                user: userId,
                type: "withdraw",
                status: "pending",
                providerStatus: "OTP_PENDING",
                createdAt: {
                    $lt: new Date(Date.now() - 5 * 60 * 1000),
                },
            },
            {
                $set: {
                    status: "expired",
                    providerStatus: "OTP_EXPIRED",
                    note: "OTP xác nhận rút tiền đã hết hạn",
                },
            }
        );

        const existingRequest = await WalletTransaction.findOne({
            user: userId,
            type: "withdraw",
            status: "pending",
            providerStatus: "OTP_PENDING",
            createdAt: {
                $gte: new Date(Date.now() - 5 * 60 * 1000),
            },
        });

        if (existingRequest) {
            throw createHttpError(
                429,
                "Bạn đang có một yêu cầu rút tiền chờ nhập OTP"
            );
        }

        const referenceId =
            `WDR_${Date.now()}_${String(userId).slice(-6)}`;

        transaction = new WalletTransaction({
            wallet: wallet._id,
            user: userId,
            type: "withdraw",
            status: "pending",
            amount: withdrawAmount,
            code: referenceId,
            provider: "payos",
            payoutReferenceId: referenceId,
            providerStatus: "OTP_PENDING",
            note: "Đang chờ người dùng xác nhận OTP",
        });

        transaction.setEncryptedBankInfo({
            bankCode: toBin,
            bankName,
            accountNumber: String(accountNumber),
            accountName: String(accountName).trim().toUpperCase(),
        });

        await transaction.save();

        const user = await User.findById(userId).select("email");

        const otpKey = `withdraw:${userId}:${transaction._id}`;
        const otp = generateOTP();

        saveOTP(otpKey, otp);

        try {
            await sendEmail({
                to: user.email,
                subject: "Mã OTP xác nhận rút tiền SecondLife",
                html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Xác nhận rút tiền</h2>

            <p>Số tiền:</p>
            <h3>${withdrawAmount.toLocaleString("vi-VN")} VND</h3>

            <p>Ngân hàng: ${bankName}</p>
            <p>Số tài khoản: ******${String(accountNumber).slice(-4)}</p>

            <p>Mã OTP của bạn là:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>

            <p>Mã có hiệu lực trong 5 phút.</p>
            <p>Không cung cấp mã OTP cho bất kỳ ai.</p>
          </div>
        `,
            });
        } catch (error) {
            deleteOTP(otpKey);
            await WalletTransaction.deleteOne({ _id: transaction._id });
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: "OTP xác nhận rút tiền đã được gửi đến email",
            transactionId: transaction._id,
            email: maskEmail(user.email),
            expiresIn: 300,
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message:
                error.message ||
                "Không thể gửi OTP xác nhận rút tiền",
        });
    }
};

exports.syncWithdrawStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const userId = getUserId(req);

        const transaction = await syncWithdrawTransaction(
            transactionId,
            userId
        );
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

exports.getMyTransactions = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập",
            });
        }

        const transactions = await WalletTransaction.find({ user: userId })
            .populate({
                path: "order",
                populate: [
                    { path: "productId", select: "title thumbnail images price" },
                    { path: "buyerId", select: "fullName email avatar userName" },
                    { path: "sellerId", select: "fullName email avatar userName" }
                ]
            })
            .populate({
                path: "exchangeInvoice",
                populate: [
                    { path: "requesterProduct", select: "title thumbnail images price" },
                    { path: "receiverProduct", select: "title thumbnail images price" },
                    { path: "requester", select: "fullName email avatar userName" },
                    { path: "receiver", select: "fullName email avatar userName" }
                ]
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            transactions,
        });
    } catch (error) {
        console.error("GET TRANSACTIONS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách lịch sử giao dịch",
            error: error.message,
        });
    }
};

exports.sendWalletPasswordOTP = async (req, res) => {
    try {
        console.log("=== SEND WALLET PASSWORD OTP START ===");

        const userId = getUserId(req);

        console.log("Wallet OTP userId:", userId);

        const user = await User.findById(userId).select("email");

        console.log("Wallet OTP user email:", user?.email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản",
            });
        }

        await ensureWallet(userId);

        const wallet = await Wallet.findOne({ user: userId }).select(
            "+walletPasswordHash"
        );

        if (wallet.walletPasswordHash) {
            return res.status(409).json({
                success: false,
                message: "Ví đã được thiết lập mật khẩu",
            });
        }

        const otpKey = `wallet-password:${userId}`;
        const oldOTP = getOTP(otpKey);

        if (oldOTP && Date.now() - oldOTP.createdAt < 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: "Vui lòng chờ 60 giây trước khi gửi lại OTP",
            });
        }

        const otp = generateOTP();

        saveOTP(otpKey, otp);

        console.log("Preparing to send wallet OTP...");

        try {
            await sendEmail({
                to: user.email,
                subject: "Mã OTP thiết lập mật khẩu ví SecondLife",
                html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Thiết lập mật khẩu ví</h2>
            <p>Mã OTP của bạn là:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>
            <p>Mã có hiệu lực trong 5 phút.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          </div>
        `,
            });

            console.log("Wallet OTP email sent successfully");
        } catch (error) {
            console.error("SEND WALLET PASSWORD OTP ERROR:", error);

            return res.status(error.status || 500).json({
                success: false,
                message:
                    error.message ||
                    "Không thể gửi OTP thiết lập mật khẩu ví",
            });
        }

        return res.json({
            success: true,
            message: "OTP đã được gửi đến email đăng ký",
            email: maskEmail(user.email),
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Không thể gửi OTP",
        });
    }
};

exports.setupWalletPassword = async (req, res) => {
    try {
        const userId = getUserId(req);

        const {
            otp,
            walletPassword,
            confirmWalletPassword,
        } = req.body;

        if (!otp || !walletPassword || !confirmWalletPassword) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ OTP và mật khẩu ví",
            });
        }

        if (!WALLET_PASSWORD_REGEX.test(walletPassword)) {
            return res.status(400).json({
                success: false,
                message:
                    "Mật khẩu ví phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
            });
        }

        if (walletPassword !== confirmWalletPassword) {
            return res.status(400).json({
                success: false,
                message: "Xác nhận mật khẩu ví không khớp",
            });
        }

        const otpKey = `wallet-password:${userId}`;

        verifyOTPOrThrow(otpKey, otp);

        await ensureWallet(userId);

        const wallet = await Wallet.findOne({ user: userId }).select(
            "+walletPasswordHash"
        );

        if (wallet.walletPasswordHash) {
            deleteOTP(otpKey);

            return res.status(409).json({
                success: false,
                message: "Ví đã được thiết lập mật khẩu",
            });
        }

        await wallet.setWalletPassword(walletPassword);
        await wallet.save();

        deleteOTP(otpKey);

        return res.json({
            success: true,
            message: "Thiết lập mật khẩu ví thành công",
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Không thể thiết lập mật khẩu ví",
        });
    }
};

exports.confirmWithdrawOTP = async (req, res) => {
    let transaction = null;
    let walletLocked = false;
    let payoutCreated = false;

    try {
        const userId = getUserId(req);
        const { transactionId, otp } = req.body;

        if (!transactionId || !otp) {
            throw createHttpError(
                400,
                "Vui lòng nhập mã giao dịch và OTP"
            );
        }

        transaction = await WalletTransaction.findOne({
            _id: transactionId,
            user: userId,
            type: "withdraw",
            status: "pending",
            providerStatus: "OTP_PENDING",
        }).select(
            [
                "+bankInfo.accountNumberEncrypted",
                "+bankInfo.accountNumberIv",
                "+bankInfo.accountNumberAuthTag",
                "+bankInfo.accountNameEncrypted",
                "+bankInfo.accountNameIv",
                "+bankInfo.accountNameAuthTag",
            ].join(" ")
        );

        if (!transaction) {
            throw createHttpError(
                404,
                "Không tìm thấy yêu cầu rút tiền đang chờ OTP"
            );
        }

        const otpKey = `withdraw:${userId}:${transaction._id}`;

        verifyOTPOrThrow(otpKey, otp);

        /*
         * Chuyển trạng thái bằng điều kiện OTP_PENDING.
         * Điều này ngăn hai request xác nhận cùng một OTP.
         */
        const reservedTransaction =
            await WalletTransaction.findOneAndUpdate(
                {
                    _id: transaction._id,
                    user: userId,
                    status: "pending",
                    providerStatus: "OTP_PENDING",
                },
                {
                    $set: {
                        providerStatus: "OTP_VERIFIED",
                        note: "OTP hợp lệ, đang khóa số dư",
                    },
                },
                {
                    new: true,
                }
            );

        if (!reservedTransaction) {
            throw createHttpError(
                409,
                "Yêu cầu rút tiền đã được xử lý"
            );
        }

        const withdrawAmount = Number(transaction.amount.toString());

        /*
         * Khóa tiền bằng một câu lệnh atomic.
         * Hai yêu cầu đồng thời không thể cùng sử dụng một số dư.
         */
        const lockedWallet = await Wallet.findOneAndUpdate(
            {
                user: userId,
                status: "active",

                $expr: {
                    $gte: [
                        {
                            $subtract: ["$balance", "$lockedBalance"],
                        },
                        withdrawAmount,
                    ],
                },
            },
            {
                $inc: {
                    lockedBalance: withdrawAmount,
                },
            },
            {
                new: true,
            }
        );

        if (!lockedWallet) {
            await WalletTransaction.updateOne(
                { _id: transaction._id },
                {
                    $set: {
                        status: "failed",
                        providerStatus: "INSUFFICIENT_BALANCE",
                        note: "Số dư khả dụng không đủ tại thời điểm xác nhận OTP",
                    },
                }
            );

            deleteOTP(otpKey);

            throw createHttpError(
                400,
                "Số dư khả dụng không đủ"
            );
        }

        walletLocked = true;
        deleteOTP(otpKey);

        const bankInfo = transaction.getDecryptedBankInfo();

        const payoutPayload = {
            referenceId: transaction.payoutReferenceId,
            amount: withdrawAmount,
            description: `Rut tien SecondLife ${transaction.payoutReferenceId}`.slice(
                0,
                50
            ),
            toBin: bankInfo.bankCode,
            toAccountNumber: bankInfo.accountNumber,
            category: ["withdraw"],
        };

        const payoutData = await createSinglePayout(payoutPayload);

        payoutCreated = true;

        const firstTransaction = Array.isArray(payoutData.transactions)
            ? payoutData.transactions[0]
            : payoutData.transactions?.[0];

        transaction.payoutId = payoutData.id;

        transaction.providerStatus =
            firstTransaction?.state ||
            payoutData.approvalState ||
            "PROCESSING";

        transaction.providerPayload = payoutData;
        transaction.note =
            "Lệnh rút tiền đã gửi sang payOS, đang xử lý";

        await transaction.save();

        setTimeout(() => {
            syncWithdrawTransaction(transaction._id).catch((error) => {
                console.error("AUTO SYNC WITHDRAW ERROR:", error.message);
            });
        }, 8000);

        return res.status(201).json({
            success: true,
            message:
                "OTP chính xác. Yêu cầu rút tiền đang được xử lý",
            transaction,
        });
    } catch (error) {
        /*
         * Chỉ hoàn tiền khóa nếu payOS chưa tạo payout.
         * Nếu payOS đã tạo payout thì không được tự mở khóa,
         * vì tiền có thể đang được chuyển.
         */
        if (walletLocked && transaction && !payoutCreated) {
            const amount = Number(transaction.amount.toString());

            await Wallet.updateOne(
                {
                    _id: transaction.wallet,
                    lockedBalance: {
                        $gte: amount,
                    },
                },
                {
                    $inc: {
                        lockedBalance: -amount,
                    },
                }
            );

            await WalletTransaction.updateOne(
                { _id: transaction._id },
                {
                    $set: {
                        status: "failed",
                        providerStatus: "CREATE_PAYOUT_FAILED",
                        note: "Tạo lệnh rút tiền thất bại, đã hoàn tiền khóa",
                    },
                }
            );
        }

        return res.status(error.status || 500).json({
            success: false,
            message:
                error.response?.desc ||
                error.message ||
                "Không thể xác nhận yêu cầu rút tiền",
        });
    }
};