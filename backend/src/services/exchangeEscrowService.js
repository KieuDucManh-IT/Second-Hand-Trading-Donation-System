const mongoose = require("mongoose");
const crypto = require("crypto");

const ExchangeInvoice = require("../models/modelExchangeInvoice");
const Wallet = require("../models/modelWallet");
const WalletTransaction = require("../models/modelWalletTransaction");
const Product = require("../models/modelProduct");

const EXCHANGE_FEE_RATE = Number(process.env.EXCHANGE_FEE_RATE || 0.1);

function getId(value) {
  return String(value?._id || value);
}

function sameId(a, b) {
  return getId(a) === getId(b);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function makeWalletAddress(userId) {
  return `SL${String(userId).slice(-10).toUpperCase()}`;
}

function makeTransactionCode(prefix) {
  return `${prefix}${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function ensureWallet(userId, session) {
  let wallet = await Wallet.findOne({ user: userId }).session(session || null);

  if (!wallet) {
    const created = await Wallet.create(
      [
        {
          user: userId,
          address: makeWalletAddress(userId),
          balance: 0,
          lockedBalance: 0,
          currency: "VND",
          status: "active",
        },
      ],
      session ? { session } : undefined
    );

    wallet = created[0];
  }

  return wallet;
}

async function createWalletTransaction({
  wallet,
  user,
  type,
  amount,
  exchangeInvoice,
  note,
  metadata = {},
  session,
}) {
  const prefixMap = {
    exchange_deposit: "EXD",
    exchange_refund: "EXR",
    exchange_fee: "EXF",
  };

  const created = await WalletTransaction.create(
    [
      {
        wallet,
        user,
        type,
        status: "completed",
        amount,
        code: makeTransactionCode(prefixMap[type] || "TX"),
        exchangeInvoice,
        note,
        metadata,
      },
    ],
    session ? { session } : undefined
  );

  return created[0];
}

function getProductOwner(product) {
  return (
    product.ownerId ||
    product.userId ||
    product.user ||
    product.owner ||
    product.seller ||
    product.createdBy
  );
}

function getProductPrice(product) {
  const price = Number(
    product.price ??
    product.productPrice ??
    product.currentPrice ??
    product.value ??
    0
  );

  if (!price || price <= 0) {
    throw new Error("Sản phẩm chưa có giá trị hợp lệ để trao đổi");
  }

  return price;
}

/**
 * A gửi yêu cầu đổi sản phẩm A của mình lấy sản phẩm B của B.
 */
async function createExchangeRequest({
  requesterId,
  requesterProductId,
  receiverProductId,
}) {
  const requesterProduct = await Product.findById(requesterProductId);
  const receiverProduct = await Product.findById(receiverProductId);

  if (!requesterProduct || !receiverProduct) {
    throw new Error("Không tìm thấy sản phẩm trao đổi");
  }

  const requesterOwner = getProductOwner(requesterProduct);
  const receiverOwner = getProductOwner(receiverProduct);

  if (!requesterOwner || !receiverOwner) {
    throw new Error("Sản phẩm thiếu thông tin chủ sở hữu");
  }

  if (!sameId(requesterOwner, requesterId)) {
    throw new Error("Bạn chỉ có thể dùng sản phẩm của mình để trao đổi");
  }

  if (sameId(receiverOwner, requesterId)) {
    throw new Error("Không thể tự trao đổi với chính mình");
  }

  const requesterDepositAmount = getProductPrice(requesterProduct);
  const receiverDepositAmount = getProductPrice(receiverProduct);

  const invoice = await ExchangeInvoice.create({
    requester: requesterId,
    receiver: receiverOwner,
    requesterProduct: requesterProductId,
    receiverProduct: receiverProductId,

    requesterDepositAmount,
    receiverDepositAmount,
    totalInvoiceAmount: requesterDepositAmount + receiverDepositAmount,

    feeRate: EXCHANGE_FEE_RATE,
    status: "pending_receiver_accept",
  });

  return invoice;
}

/**
 * B đồng ý request.
 */
async function acceptExchangeRequest(invoiceId, receiverId) {
  const invoice = await ExchangeInvoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn trao đổi");
  }

  if (!sameId(invoice.receiver, receiverId)) {
    throw new Error("Bạn không có quyền xác nhận yêu cầu trao đổi này");
  }

  if (invoice.status !== "pending_receiver_accept") {
    throw new Error("Yêu cầu trao đổi này không còn chờ xác nhận");
  }

  invoice.status = "waiting_deposits";
  invoice.acceptedAt = new Date();

  await invoice.save();

  return invoice;
}

/**
 * Một bên thanh toán tiền bảo hiểm từ ví.
 */
async function payExchangeDeposit(invoiceId, userId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const invoice = await ExchangeInvoice.findById(invoiceId).session(session);

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn trao đổi");
    }

    if (!["waiting_deposits", "active"].includes(invoice.status)) {
      throw new Error("Hóa đơn trao đổi chưa ở trạng thái thanh toán bảo hiểm");
    }

    let side;
    let depositAmount;

    if (sameId(invoice.requester, userId)) {
      side = "requester";
      depositAmount = Number(invoice.requesterDepositAmount || 0);

      if (invoice.requesterDepositStatus === "paid") {
        throw new Error("Bạn đã thanh toán tiền bảo hiểm rồi");
      }
    } else if (sameId(invoice.receiver, userId)) {
      side = "receiver";
      depositAmount = Number(invoice.receiverDepositAmount || 0);

      if (invoice.receiverDepositStatus === "paid") {
        throw new Error("Bạn đã thanh toán tiền bảo hiểm rồi");
      }
    } else {
      throw new Error("Bạn không thuộc hóa đơn trao đổi này");
    }

    const wallet = await ensureWallet(userId, session);

    const availableBalance =
      Number(wallet.balance || 0) - Number(wallet.lockedBalance || 0);

    if (availableBalance < depositAmount) {
      throw new Error(
        `Số dư ví không đủ. Cần ${depositAmount.toLocaleString("vi-VN")}đ, vui lòng nạp thêm.`
      );
    }

    wallet.balance -= depositAmount;
    await wallet.save({ session });

    if (side === "requester") {
      invoice.requesterDepositStatus = "paid";
    } else {
      invoice.receiverDepositStatus = "paid";
    }

    if (
      invoice.requesterDepositStatus === "paid" &&
      invoice.receiverDepositStatus === "paid"
    ) {
      invoice.status = "active";
      invoice.activeAt = new Date();
      invoice.autoReleaseAt = addDays(new Date(), 7);

      // Mark both products as reserved — không dùng session để đảm bảo
      // product status luôn được cập nhật dù session wallet có lỗi
      await Product.findByIdAndUpdate(
        invoice.requesterProduct,
        { status: "reserved", isAvailable: false }
      );
      await Product.findByIdAndUpdate(
        invoice.receiverProduct,
        { status: "reserved", isAvailable: false }
      );
    } else {
      invoice.status = "waiting_deposits";
    }

    await invoice.save({ session });

    await createWalletTransaction({
      wallet: wallet._id,
      user: userId,
      type: "exchange_deposit",
      amount: depositAmount,
      exchangeInvoice: invoice._id,
      note: "Thanh toán tiền bảo hiểm trao đổi",
      metadata: {
        side,
        direction: "debit",
      },
      session,
    });

    await session.commitTransaction();

    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Một bên xác nhận đã hoàn tất trao đổi.
 */
async function confirmExchangeCompleted(invoiceId, userId) {
  const invoice = await ExchangeInvoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn trao đổi");
  }

  if (invoice.status !== "active") {
    throw new Error("Chỉ có thể xác nhận khi giao dịch đang hoạt động");
  }

  if (sameId(invoice.requester, userId)) {
    invoice.requesterConfirmed = true;
  } else if (sameId(invoice.receiver, userId)) {
    invoice.receiverConfirmed = true;
  } else {
    throw new Error("Bạn không thuộc hóa đơn trao đổi này");
  }

  if (invoice.requesterConfirmed && invoice.receiverConfirmed) {
    invoice.status = "both_confirmed";
  }

  await invoice.save();

  if (invoice.status === "both_confirmed") {
    return releaseExchangeDeposits(invoice._id, "both_confirmed");
  }

  return invoice;
}

/**
 * Hoàn tiền bảo hiểm cho cả 2 bên, trừ phí trung gian 10%.
 */
async function releaseExchangeDeposits(invoiceId, reason = "auto_after_7_days") {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const invoice = await ExchangeInvoice.findById(invoiceId).session(session);

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn trao đổi");
    }

    if (invoice.status === "disputed" || invoice.autoRefundPaused) {
      throw new Error("Giao dịch đang khiếu nại, không thể hoàn tiền tự động");
    }

    if (!["active", "both_confirmed"].includes(invoice.status)) {
      throw new Error("Hóa đơn không ở trạng thái có thể hoàn tiền");
    }

    if (
      invoice.requesterDepositStatus !== "paid" ||
      invoice.receiverDepositStatus !== "paid"
    ) {
      throw new Error("Cả hai bên chưa thanh toán đủ tiền bảo hiểm");
    }

    const requesterDeposit = Number(invoice.requesterDepositAmount || 0);
    const receiverDeposit = Number(invoice.receiverDepositAmount || 0);

    const requesterFee = Math.round(requesterDeposit * invoice.feeRate);
    const receiverFee = Math.round(receiverDeposit * invoice.feeRate);

    const requesterRefund = requesterDeposit - requesterFee;
    const receiverRefund = receiverDeposit - receiverFee;

    const requesterWallet = await ensureWallet(invoice.requester, session);
    const receiverWallet = await ensureWallet(invoice.receiver, session);

    requesterWallet.balance += requesterRefund;
    receiverWallet.balance += receiverRefund;

    await requesterWallet.save({ session });
    await receiverWallet.save({ session });

    invoice.requesterFee = requesterFee;
    invoice.receiverFee = receiverFee;
    invoice.requesterRefundAmount = requesterRefund;
    invoice.receiverRefundAmount = receiverRefund;

    invoice.requesterDepositStatus = "refunded";
    invoice.receiverDepositStatus = "refunded";
    invoice.status = "completed";
    invoice.completedAt = new Date();

    await invoice.save({ session });

    // Mark both products as sold — cập nhật NGAY sau khi lưu invoice
    // Không dùng session cho product update để tránh trường hợp
    // session abort (do lỗi ví) khiến product bị kẹt ở trạng thái "reserved"
    await Product.findByIdAndUpdate(
      invoice.requesterProduct,
      { status: "sold", isAvailable: false }
    );
    await Product.findByIdAndUpdate(
      invoice.receiverProduct,
      { status: "sold", isAvailable: false }
    );

    await createWalletTransaction({
      wallet: requesterWallet._id,
      user: invoice.requester,
      type: "exchange_refund",
      amount: requesterRefund,
      exchangeInvoice: invoice._id,
      note: "Hoàn tiền bảo hiểm trao đổi sau khi trừ phí",
      metadata: {
        direction: "credit",
        depositAmount: requesterDeposit,
        fee: requesterFee,
        reason,
      },
      session,
    });

    await createWalletTransaction({
      wallet: requesterWallet._id,
      user: invoice.requester,
      type: "exchange_fee",
      amount: requesterFee,
      exchangeInvoice: invoice._id,
      note: "Phí trung gian trao đổi",
      metadata: {
        direction: "fee",
        reason,
      },
      session,
    });

    await createWalletTransaction({
      wallet: receiverWallet._id,
      user: invoice.receiver,
      type: "exchange_refund",
      amount: receiverRefund,
      exchangeInvoice: invoice._id,
      note: "Hoàn tiền bảo hiểm trao đổi sau khi trừ phí",
      metadata: {
        direction: "credit",
        depositAmount: receiverDeposit,
        fee: receiverFee,
        reason,
      },
      session,
    });

    await createWalletTransaction({
      wallet: receiverWallet._id,
      user: invoice.receiver,
      type: "exchange_fee",
      amount: receiverFee,
      exchangeInvoice: invoice._id,
      note: "Phí trung gian trao đổi",
      metadata: {
        direction: "fee",
        reason,
      },
      session,
    });

    await session.commitTransaction();

    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Một bên khiếu nại, hệ thống dừng hoàn tiền tự động.
 */
async function disputeExchange(invoiceId, userId, reason = "", evidences = []) {
  const invoice = await ExchangeInvoice.findById(invoiceId);

  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn trao đổi");
  }

  if (!sameId(invoice.requester, userId) && !sameId(invoice.receiver, userId)) {
    throw new Error("Bạn không thuộc hóa đơn trao đổi này");
  }

  const finalReason = reason?.trim() || "Người dùng mở khiếu nại";
  const newComplaint = {
    reason: finalReason,
    evidences: Array.isArray(evidences) ? evidences : [],
    status: "pending",
    createdAt: new Date(),
  };

  if (invoice.status === "disputed") {
    // Invoice đang disputed — kiểm tra bên nào đã gửi rồi
    const alreadyDisputed =
      sameId(invoice.disputeBy, userId) ||
      sameId(invoice.counterDisputeBy, userId);

    if (alreadyDisputed) {
      throw new Error("Bạn đã gửi khiếu nại cho giao dịch này rồi");
    }

    if (invoice.counterComplaint) {
      throw new Error("Giao dịch này đã có đủ 2 khiếu nại");
    }

    // Cho phép bên còn lại gửi counterComplaint
    invoice.counterDisputeBy = userId;
    invoice.counterComplaint = newComplaint;

    await invoice.save();
    return invoice;
  }

  if (invoice.status !== "active") {
    throw new Error("Chỉ có thể khiếu nại giao dịch đang hoạt động");
  }

  // Lần đầu dispute — gửi complaint chính
  invoice.status = "disputed";
  invoice.disputedAt = new Date();
  invoice.disputeReason = finalReason;
  invoice.disputeBy = userId;
  invoice.autoRefundPaused = true;
  invoice.complaint = newComplaint;

  await invoice.save();

  return invoice;
}

/**
 * Quá 7 ngày không khiếu nại thì tự động hoàn tiền cho 2 bên.
 */
async function autoReleaseExpiredExchangeInvoices() {
  const now = new Date();

  const invoices = await ExchangeInvoice.find({
    status: "active",
    autoRefundPaused: { $ne: true },
    requesterDepositStatus: "paid",
    receiverDepositStatus: "paid",
    autoReleaseAt: { $lte: now },
  }).select("_id");

  let success = 0;
  let failed = 0;

  for (const invoice of invoices) {
    try {
      await releaseExchangeDeposits(invoice._id, "auto_after_7_days");
      success += 1;
    } catch (error) {
      failed += 1;
      console.error("AUTO RELEASE EXCHANGE ERROR:", invoice._id, error.message);
    }
  }

  return {
    total: invoices.length,
    success,
    failed,
  };
}

/**
 * Manager giải quyết tranh chấp trao đổi (Exchange)
 */
async function resolveExchangeDispute(invoiceId, resolution, hasReturnedGoods = false, note = "") {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const invoice = await ExchangeInvoice.findById(invoiceId).session(session);

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn trao đổi");
    }

    if (invoice.status !== "disputed") {
      throw new Error("Giao dịch không ở trạng thái tranh chấp");
    }

    const allowedResolutions = [
      "accept",
      "reject",
      "refund_a",
      "refund_b",
      "continue_auto_release",
    ];

    if (!allowedResolutions.includes(resolution)) {
      throw new Error("Loại giải quyết tranh chấp không hợp lệ");
    }

    const requesterDeposit = Number(invoice.requesterDepositAmount || 0);
    const receiverDeposit = Number(invoice.receiverDepositAmount || 0);
    const totalDeposit = requesterDeposit + receiverDeposit;

    const feeRate = Number(invoice.feeRate ?? EXCHANGE_FEE_RATE ?? 0.1);
    const totalFee = Math.round(totalDeposit * feeRate);
    const netRefundAmount = Math.max(totalDeposit - totalFee, 0);

    const requesterWallet = await ensureWallet(invoice.requester, session);
    const receiverWallet = await ensureWallet(invoice.receiver, session);

    const disputerId = invoice.disputeBy;
    const isRequesterDisputer = sameId(invoice.requester, disputerId);

    const disputer = isRequesterDisputer ? invoice.requester : invoice.receiver;
    const opponent = isRequesterDisputer ? invoice.receiver : invoice.requester;

    const disputerWallet = isRequesterDisputer ? requesterWallet : receiverWallet;
    const opponentWallet = isRequesterDisputer ? receiverWallet : requesterWallet;

    const markComplaintResolved = (status, resolutionNote) => {
      if (invoice.complaint) {
        invoice.complaint.status = status;
        invoice.complaint.resolvedAt = new Date();
        invoice.complaint.resolutionNote = resolutionNote;
      }

      if (invoice.counterComplaint) {
        invoice.counterComplaint.status = status;
        invoice.counterComplaint.resolvedAt = new Date();
        invoice.counterComplaint.resolutionNote = resolutionNote;
      }
    };

    /*
      refund_a:
      A = người khiếu nại.
      Manager hoàn toàn bộ tiền cọc/giá trị escrow cho A.
    */
    if (resolution === "refund_a") {
      disputerWallet.balance += netRefundAmount;
      await disputerWallet.save({ session });

      if (isRequesterDisputer) {
        invoice.requesterRefundAmount = netRefundAmount;
        invoice.receiverRefundAmount = 0;

        invoice.requesterFee = totalFee;
        invoice.receiverFee = 0;

        invoice.requesterDepositStatus = "refunded";
        invoice.receiverDepositStatus = "forfeited";
      } else {
        invoice.requesterRefundAmount = 0;
        invoice.receiverRefundAmount = netRefundAmount;

        invoice.requesterFee = 0;
        invoice.receiverFee = totalFee;

        invoice.requesterDepositStatus = "forfeited";
        invoice.receiverDepositStatus = "refunded";
      }

      invoice.status = "completed";
      invoice.completedAt = new Date();
      invoice.autoRefundPaused = false;

      markComplaintResolved(
        "resolved",
        note || "Manager quyết định hoàn giá trị cho bên A sau khi trừ phí giao dịch"
      );

      await invoice.save({ session });

      await createWalletTransaction({
        wallet: disputerWallet._id,
        user: disputer,
        type: "exchange_refund",
        amount: netRefundAmount,
        exchangeInvoice: invoice._id,
        note: `Manager hoàn tiền cho bên A sau khi trừ phí ${Math.round(
          feeRate * 100
        )}%: ${note}`,
        metadata: {
          direction: "credit",
          reason: "manager_refund_a",
          requesterDeposit,
          receiverDeposit,
          totalDeposit,
          feeRate,
          fee: totalFee,
          netRefundAmount,
        },
        session,
      });

      await createWalletTransaction({
        wallet: disputerWallet._id,
        user: disputer,
        type: "exchange_fee",
        amount: totalFee,
        exchangeInvoice: invoice._id,
        note: `Phí giao dịch ${Math.round(feeRate * 100)}% khi Manager hoàn tiền cho bên A`,
        metadata: {
          direction: "fee",
          reason: "manager_refund_a_fee",
          totalDeposit,
          feeRate,
          fee: totalFee,
        },
        session,
      });

      await Product.findByIdAndUpdate(invoice.requesterProduct, {
        status: "sold",
        isAvailable: false,
      });

      await Product.findByIdAndUpdate(invoice.receiverProduct, {
        status: "sold",
        isAvailable: false,
      });
    }

    /*
      refund_b:
      B = bên bị khiếu nại.
      Manager hoàn toàn bộ tiền cọc/giá trị escrow cho B.
    */
    else if (resolution === "refund_b") {
      opponentWallet.balance += netRefundAmount;
      await opponentWallet.save({ session });

      if (isRequesterDisputer) {
        invoice.requesterRefundAmount = 0;
        invoice.receiverRefundAmount = netRefundAmount;

        invoice.requesterFee = 0;
        invoice.receiverFee = totalFee;

        invoice.requesterDepositStatus = "forfeited";
        invoice.receiverDepositStatus = "refunded";
      } else {
        invoice.requesterRefundAmount = netRefundAmount;
        invoice.receiverRefundAmount = 0;

        invoice.requesterFee = totalFee;
        invoice.receiverFee = 0;

        invoice.requesterDepositStatus = "refunded";
        invoice.receiverDepositStatus = "forfeited";
      }

      invoice.status = "completed";
      invoice.completedAt = new Date();
      invoice.autoRefundPaused = false;

      markComplaintResolved(
        "resolved",
        note || "Manager quyết định hoàn giá trị cho bên B sau khi trừ phí giao dịch"
      );

      await invoice.save({ session });

      await createWalletTransaction({
        wallet: opponentWallet._id,
        user: opponent,
        type: "exchange_refund",
        amount: netRefundAmount,
        exchangeInvoice: invoice._id,
        note: `Manager hoàn tiền cho bên B sau khi trừ phí ${Math.round(
          feeRate * 100
        )}%: ${note}`,
        metadata: {
          direction: "credit",
          reason: "manager_refund_b",
          requesterDeposit,
          receiverDeposit,
          totalDeposit,
          feeRate,
          fee: totalFee,
          netRefundAmount,
        },
        session,
      });

      await createWalletTransaction({
        wallet: opponentWallet._id,
        user: opponent,
        type: "exchange_fee",
        amount: totalFee,
        exchangeInvoice: invoice._id,
        note: `Phí giao dịch ${Math.round(feeRate * 100)}% khi Manager hoàn tiền cho bên B`,
        metadata: {
          direction: "fee",
          reason: "manager_refund_b_fee",
          totalDeposit,
          feeRate,
          fee: totalFee,
        },
        session,
      });

      await Product.findByIdAndUpdate(invoice.requesterProduct, {
        status: "sold",
        isAvailable: false,
      });

      await Product.findByIdAndUpdate(invoice.receiverProduct, {
        status: "sold",
        isAvailable: false,
      });
    }
    /*
      continue_auto_release:
      Manager từ chối giải quyết.
      Giao dịch quay lại active, mở lại auto refund.
      Tiền vẫn tiếp tục theo mốc autoReleaseAt hiện có.
    */
    else if (resolution === "continue_auto_release") {
      invoice.status = "active";
      invoice.autoRefundPaused = false;

      if (!invoice.autoReleaseAt) {
        invoice.autoReleaseAt = addDays(new Date(), 7);
      }

      markComplaintResolved(
        "rejected",
        note || "Manager từ chối giải quyết, giao dịch tiếp tục cơ chế tự động hoàn tiền"
      );

      await invoice.save({ session });
    }

    /*
      Giữ tương thích logic cũ:
      accept = bên khiếu nại thắng.
    */
    else if (resolution === "accept") {
      const disputerDeposit = isRequesterDisputer ? requesterDeposit : receiverDeposit;
      const opponentDeposit = isRequesterDisputer ? receiverDeposit : requesterDeposit;

      if (hasReturnedGoods) {
        disputerWallet.balance += disputerDeposit;
        opponentWallet.balance += opponentDeposit;

        await disputerWallet.save({ session });
        await opponentWallet.save({ session });

        invoice.requesterRefundAmount = invoice.requesterDepositAmount;
        invoice.receiverRefundAmount = invoice.receiverDepositAmount;
        invoice.requesterDepositStatus = "refunded";
        invoice.receiverDepositStatus = "refunded";

        await createWalletTransaction({
          wallet: disputerWallet._id,
          user: disputer,
          type: "exchange_refund",
          amount: disputerDeposit,
          exchangeInvoice: invoice._id,
          note: `Hoàn tiền cọc trao đổi do chấp thuận khiếu nại, đã trả hàng: ${note}`,
          metadata: {
            direction: "credit",
            depositAmount: disputerDeposit,
            reason: "dispute_accepted_returned",
          },
          session,
        });

        await createWalletTransaction({
          wallet: opponentWallet._id,
          user: opponent,
          type: "exchange_refund",
          amount: opponentDeposit,
          exchangeInvoice: invoice._id,
          note: `Hoàn tiền cọc trao đổi do chấp thuận khiếu nại, đã nhận lại hàng: ${note}`,
          metadata: {
            direction: "credit",
            depositAmount: opponentDeposit,
            reason: "dispute_accepted_returned",
          },
          session,
        });

        await Product.findByIdAndUpdate(invoice.requesterProduct, {
          status: "available",
          isAvailable: true,
        });

        await Product.findByIdAndUpdate(invoice.receiverProduct, {
          status: "available",
          isAvailable: true,
        });
      } else {
        opponentWallet.balance += opponentDeposit + disputerDeposit;
        await opponentWallet.save({ session });

        if (isRequesterDisputer) {
          invoice.requesterRefundAmount = 0;
          invoice.receiverRefundAmount = opponentDeposit + disputerDeposit;
          invoice.requesterDepositStatus = "forfeited";
          invoice.receiverDepositStatus = "refunded";
        } else {
          invoice.requesterRefundAmount = opponentDeposit + disputerDeposit;
          invoice.receiverRefundAmount = 0;
          invoice.requesterDepositStatus = "refunded";
          invoice.receiverDepositStatus = "forfeited";
        }

        await createWalletTransaction({
          wallet: opponentWallet._id,
          user: opponent,
          type: "exchange_refund",
          amount: opponentDeposit,
          exchangeInvoice: invoice._id,
          note: `Hoàn tiền cọc trao đổi của bạn: ${note}`,
          metadata: {
            direction: "credit",
            depositAmount: opponentDeposit,
            reason: "dispute_accepted_not_returned",
          },
          session,
        });

        await createWalletTransaction({
          wallet: opponentWallet._id,
          user: opponent,
          type: "exchange_refund",
          amount: disputerDeposit,
          exchangeInvoice: invoice._id,
          note: `Bồi thường từ cọc của đối phương do không hoàn trả hàng: ${note}`,
          metadata: {
            direction: "credit",
            depositAmount: disputerDeposit,
            reason: "dispute_compensation",
          },
          session,
        });

        await Product.findByIdAndUpdate(invoice.requesterProduct, {
          status: "sold",
          isAvailable: false,
        });

        await Product.findByIdAndUpdate(invoice.receiverProduct, {
          status: "sold",
          isAvailable: false,
        });
      }

      invoice.status = "completed";
      invoice.completedAt = new Date();
      invoice.autoRefundPaused = false;

      markComplaintResolved("resolved", note);

      await invoice.save({ session });
    }

    /*
      Giữ tương thích logic cũ:
      reject = bác khiếu nại và hoàn cọc 2 bên trừ phí.
    */
    else if (resolution === "reject") {
      const requesterFee = Math.round(requesterDeposit * invoice.feeRate);
      const receiverFee = Math.round(receiverDeposit * invoice.feeRate);

      const requesterRefund = requesterDeposit - requesterFee;
      const receiverRefund = receiverDeposit - receiverFee;

      requesterWallet.balance += requesterRefund;
      receiverWallet.balance += receiverRefund;

      await requesterWallet.save({ session });
      await receiverWallet.save({ session });

      invoice.requesterFee = requesterFee;
      invoice.receiverFee = receiverFee;
      invoice.requesterRefundAmount = requesterRefund;
      invoice.receiverRefundAmount = receiverRefund;

      invoice.requesterDepositStatus = "refunded";
      invoice.receiverDepositStatus = "refunded";
      invoice.status = "completed";
      invoice.completedAt = new Date();
      invoice.autoRefundPaused = false;

      markComplaintResolved("rejected", note);

      await invoice.save({ session });

      await Product.findByIdAndUpdate(invoice.requesterProduct, {
        status: "sold",
        isAvailable: false,
      });

      await Product.findByIdAndUpdate(invoice.receiverProduct, {
        status: "sold",
        isAvailable: false,
      });

      await createWalletTransaction({
        wallet: requesterWallet._id,
        user: invoice.requester,
        type: "exchange_refund",
        amount: requesterRefund,
        exchangeInvoice: invoice._id,
        note: `Hoàn tiền bảo hiểm trao đổi sau khi bác bỏ khiếu nại: ${note}`,
        metadata: {
          direction: "credit",
          depositAmount: requesterDeposit,
          fee: requesterFee,
          reason: "dispute_rejected",
        },
        session,
      });

      await createWalletTransaction({
        wallet: receiverWallet._id,
        user: invoice.receiver,
        type: "exchange_refund",
        amount: receiverRefund,
        exchangeInvoice: invoice._id,
        note: `Hoàn tiền bảo hiểm trao đổi sau khi bác bỏ khiếu nại: ${note}`,
        metadata: {
          direction: "credit",
          depositAmount: receiverDeposit,
          fee: receiverFee,
          reason: "dispute_rejected",
        },
        session,
      });
    }

    await session.commitTransaction();
    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Repair: Đồng bộ lại product status dựa trên trạng thái invoice.
 * Dùng để fix data cũ bị inconsistent khi session abort giữa chừng.
 */
async function repairExchangeProductStatuses() {
  const results = { fixed: 0, errors: 0, details: [] };

  // 1. Invoice completed/disputed-resolved → products phải là "sold" hoặc "available"
  const completedInvoices = await ExchangeInvoice.find({
    status: "completed",
  }).lean();

  for (const invoice of completedInvoices) {
    try {
      const complaintStatus = invoice.complaint?.status;

      // Logic xác định trạng thái đích:
      // - "resolved" + cả 2 refundAmount == depositAmount → hàng đã trả lại → "available"
      // - Mọi trường hợp còn lại (reject, accept không trả hàng, hoàn tất bình thường) → "sold"
      const bothGotFullRefund =
        Number(invoice.requesterRefundAmount) === Number(invoice.requesterDepositAmount) &&
        Number(invoice.receiverRefundAmount) === Number(invoice.receiverDepositAmount);

      const targetStatus =
        complaintStatus === "resolved" && bothGotFullRefund ? "available" : "sold";

      const targetAvailable = targetStatus === "available";

      if (invoice.requesterProduct) {
        const reqProduct = await Product.findById(invoice.requesterProduct);
        if (
          reqProduct &&
          (reqProduct.status !== targetStatus ||
            reqProduct.isAvailable !== targetAvailable)
        ) {
          await Product.findByIdAndUpdate(invoice.requesterProduct, {
            status: targetStatus,
            isAvailable: targetAvailable,
          });
          results.fixed++;
          results.details.push({
            invoiceId: invoice._id,
            productId: invoice.requesterProduct,
            from: reqProduct.status,
            to: targetStatus,
          });
        }
      }

      if (invoice.receiverProduct) {
        const recProduct = await Product.findById(invoice.receiverProduct);
        if (
          recProduct &&
          (recProduct.status !== targetStatus ||
            recProduct.isAvailable !== targetAvailable)
        ) {
          await Product.findByIdAndUpdate(invoice.receiverProduct, {
            status: targetStatus,
            isAvailable: targetAvailable,
          });
          results.fixed++;
          results.details.push({
            invoiceId: invoice._id,
            productId: invoice.receiverProduct,
            from: recProduct.status,
            to: targetStatus,
          });
        }
      }
    } catch (err) {
      results.errors++;
      console.error("REPAIR ERROR invoice", invoice._id, err.message);
    }
  }

  // 2. Invoice cancelled → products phải là "available" trở lại (nếu chưa bán qua cách khác)
  const cancelledInvoices = await ExchangeInvoice.find({
    status: "cancelled",
  }).lean();

  for (const invoice of cancelledInvoices) {
    try {
      for (const productId of [
        invoice.requesterProduct,
        invoice.receiverProduct,
      ]) {
        if (!productId) continue;
        const product = await Product.findById(productId);
        // Chỉ reset nếu product vẫn đang "reserved" (bị kẹt)
        if (product && product.status === "reserved") {
          await Product.findByIdAndUpdate(productId, {
            status: "available",
            isAvailable: true,
          });
          results.fixed++;
          results.details.push({
            invoiceId: invoice._id,
            productId,
            from: "reserved",
            to: "available",
          });
        }
      }
    } catch (err) {
      results.errors++;
      console.error("REPAIR CANCEL ERROR invoice", invoice._id, err.message);
    }
  }

  return results;
}

module.exports = {
  createExchangeRequest,
  acceptExchangeRequest,
  payExchangeDeposit,
  confirmExchangeCompleted,
  releaseExchangeDeposits,
  disputeExchange,
  autoReleaseExpiredExchangeInvoices,
  resolveExchangeDispute,
  repairExchangeProductStatuses,
};