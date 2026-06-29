const exchangeEscrowService = require("../services/exchangeEscrowService");
const ExchangeInvoice = require("../models/modelExchangeInvoice");
const ProductImage = require("../models/modelProductImage");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

function getUserId(req) {
  return req.user?._id || req.user?.id || req.userId;
}

async function attachProductImagesToInvoices(invoices) {
  const plainInvoices = invoices.map((invoice) =>
    invoice.toObject ? invoice.toObject() : invoice
  );

  const productIds = [];

  plainInvoices.forEach((invoice) => {
    if (invoice.requesterProduct?._id) {
      productIds.push(invoice.requesterProduct._id);
    }

    if (invoice.receiverProduct?._id) {
      productIds.push(invoice.receiverProduct._id);
    }
  });

  const images = await ProductImage.find({
    productId: { $in: productIds },
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const imageMap = {};

  images.forEach((img) => {
    const key = String(img.productId);

    if (!imageMap[key]) {
      imageMap[key] = [];
    }

    imageMap[key].push({
      _id: img._id,
      imageUrl: img.imageUrl,
      publicId: img.publicId,
      order: img.order,
    });
  });

  plainInvoices.forEach((invoice) => {
    if (invoice.requesterProduct?._id) {
      invoice.requesterProduct.images =
        imageMap[String(invoice.requesterProduct._id)] || [];
    }

    if (invoice.receiverProduct?._id) {
      invoice.receiverProduct.images =
        imageMap[String(invoice.receiverProduct._id)] || [];
    }
  });

  return plainInvoices;
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

    const invoicesWithImages = await attachProductImagesToInvoices(invoices);

    res.json({
      success: true,
      invoices: invoicesWithImages,
    });
  } catch (error) {
    console.error("GET MY EXCHANGE INVOICES ERROR:", error);

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

exports.uploadDeliveryVideo = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { invoiceId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn video giao hàng",
      });
    }

    if (!req.file.mimetype.startsWith("video/")) {
      return res.status(400).json({
        success: false,
        message: "Chỉ được upload video giao hàng",
      });
    }

    const invoice = await ExchangeInvoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn trao đổi",
      });
    }

    const isRequester = String(invoice.requester) === String(userId);
    const isReceiver = String(invoice.receiver) === String(userId);

    if (!isRequester && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc hóa đơn trao đổi này",
      });
    }

    if (invoice.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Chỉ được upload video khi giao dịch đang trong trạng thái đang trao đổi",
      });
    }

    const myDepositStatus = isRequester
      ? invoice.requesterDepositStatus
      : invoice.receiverDepositStatus;

    if (myDepositStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Bạn cần thanh toán tiền bảo hiểm trước khi upload video giao hàng",
      });
    }

    const existedVideo = isRequester
      ? invoice.requesterDeliveryVideo?.url
      : invoice.receiverDeliveryVideo?.url;

    if (existedVideo) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã upload video giao hàng rồi",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "exchange-delivery-videos",
      resourceType: "video",
    });

    const videoData = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type || "video",
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    if (isRequester) {
      invoice.requesterDeliveryVideo = videoData;
    } else {
      invoice.receiverDeliveryVideo = videoData;
    }

    await invoice.save();

    res.json({
      success: true,
      message: "Đã upload video giao hàng",
      invoice,
    });
  } catch (error) {
    console.error("UPLOAD DELIVERY VIDEO ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Không thể upload video giao hàng",
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

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập lý do khiếu nại",
      });
    }

    const uploadedEvidences = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith("video");

        const result = await uploadToCloudinary(file.buffer, {
          folder: "exchange-complaints",
          resourceType: isVideo ? "video" : "image",
        });

        uploadedEvidences.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: isVideo ? "video" : "image",
          resourceType: result.resource_type,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
      }
    }

    const invoice = await exchangeEscrowService.disputeExchange(
      invoiceId,
      userId,
      reason,
      uploadedEvidences
    );

    res.json({
      success: true,
      message: "Đã mở khiếu nại. Hệ thống sẽ tạm dừng hoàn tiền tự động.",
      invoice,
    });
  } catch (error) {
    console.error("DISPUTE EXCHANGE ERROR:", error);

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

    const isRequester =
      String(invoice.requester?._id || invoice.requester) === String(userId);

    const isReceiver =
      String(invoice.receiver?._id || invoice.receiver) === String(userId);

    if (!isRequester && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hóa đơn trao đổi này",
      });
    }

    const [invoiceWithImages] = await attachProductImagesToInvoices([invoice]);

    res.json({
      success: true,
      invoice: invoiceWithImages,
    });
  } catch (error) {
    console.error("GET EXCHANGE DETAIL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy chi tiết hóa đơn trao đổi",
    });
  }
};


