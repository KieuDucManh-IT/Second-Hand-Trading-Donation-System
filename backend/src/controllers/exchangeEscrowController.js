const exchangeEscrowService = require("../services/exchangeEscrowService");
const ExchangeInvoice = require("../models/ExchangeInvoice");

function getUserId(req) {
  return req.user?._id || req.user?.id || req.userId;
}

exports.getMyExchangeInvoices = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

    const invoices = await ExchangeInvoice.find({
      $or: [{ requester: userId }, { receiver: userId }],
    })
      .populate("requester", "name fullName username email avatar profileImage")
      .populate("receiver", "name fullName username email avatar profileImage")
      .populate("requesterProduct")
      .populate("receiverProduct")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách trao đổi",
    });
  }
};

exports.createExchangeRequest = async (req, res) => {
  try {
    const requesterId = getUserId(req);
    const { requesterProductId, receiverProductId } = req.body;

    const invoice = await exchangeEscrowService.createExchangeRequest({
      requesterId,
      requesterProductId,
      receiverProductId,
    });

    res.status(201).json({
      success: true,
      message: "Đã gửi yêu cầu trao đổi",
      invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Không thể gửi yêu cầu trao đổi",
    });
  }
};

exports.acceptExchangeRequest = async (req, res) => {
  try {
    const receiverId = getUserId(req);
    const { invoiceId } = req.params;

    const invoice = await exchangeEscrowService.acceptExchangeRequest(
      invoiceId,
      receiverId
    );

    res.json({
      success: true,
      message: "Đã đồng ý trao đổi. Vui lòng thanh toán tiền bảo hiểm.",
      invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Không thể đồng ý trao đổi",
    });
  }
};

exports.payExchangeDeposit = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { invoiceId } = req.params;

    const invoice = await exchangeEscrowService.payExchangeDeposit(
      invoiceId,
      userId
    );

    res.json({
      success: true,
      message: "Đã thanh toán tiền bảo hiểm trao đổi",
      invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Không thể thanh toán tiền bảo hiểm",
    });
  }
};

exports.confirmExchangeCompleted = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { invoiceId } = req.params;

    const invoice = await exchangeEscrowService.confirmExchangeCompleted(
      invoiceId,
      userId
    );

    res.json({
      success: true,
      message: "Đã xác nhận hoàn tất trao đổi",
      invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Không thể xác nhận trao đổi",
    });
  }
};

exports.disputeExchange = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { invoiceId } = req.params;
    const { reason } = req.body;

    const invoice = await exchangeEscrowService.disputeExchange(
      invoiceId,
      userId,
      reason
    );

    res.json({
      success: true,
      message: "Đã mở khiếu nại. Hệ thống sẽ tạm dừng hoàn tiền tự động.",
      invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Không thể mở khiếu nại",
    });
  }
};

exports.manualAutoRelease = async (req, res) => {
  try {
    const result =
      await exchangeEscrowService.autoReleaseExpiredExchangeInvoices();

    res.json({
      success: true,
      message: "Đã chạy auto release exchange",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể chạy auto release",
    });
  }
};

exports.getExchangeInvoiceDetail = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;
    const { invoiceId } = req.params;

    const invoice = await ExchangeInvoice.findById(invoiceId)
      .populate("requester", "name fullName username email avatar profileImage")
      .populate("receiver", "name fullName username email avatar profileImage")
      .populate("requesterProduct")
      .populate("receiverProduct");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn trao đổi",
      });
    }

    const isRequester = String(invoice.requester?._id || invoice.requester) === String(userId);
    const isReceiver = String(invoice.receiver?._id || invoice.receiver) === String(userId);

    if (!isRequester && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hóa đơn trao đổi này",
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy chi tiết hóa đơn trao đổi",
    });
  }
};


