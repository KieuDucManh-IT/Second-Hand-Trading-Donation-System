const Product = require("../models/modelProduct");

const Donation = require("../models/modelDonation");
const { sendNotification } = require("../utils/notificationHelper");

function getIO() {
  return global.__io || null;
}

exports.requestDonation = async (req, res) => {
  try {
    const {
      productId,
      donorId,
      message,
      shippingInfo,
    } = req.body;

    const requesterId = req.user.id;

    if (String(donorId) === String(requesterId)) {
      return res.status(400).json({
        message: "Bạn không thể yêu cầu nhận đồ từ chính mình."
      });
    }

    const existed = await Donation.findOne({
      productId,
      requesterId,
    });

    if (existed) {
      return res.status(400).json({
        message: "Bạn đã gửi yêu cầu nhận sản phẩm này rồi."
      });
    }

    const accepted = await Donation.findOne({
      productId,
      status: "accepted",
    });

    if (accepted) {
      return res.status(400).json({
        message: "Sản phẩm này đã được quyên tặng."
      });
    }

    const donation = await Donation.create({
      productId,
      donorId,
      requesterId,
      message,
      shippingInfo,
    });

    try {
      const Product = require("../models/modelProduct");
      const User = require("../models/modelUser");

      const [product, requester] = await Promise.all([
        Product.findById(productId),
        User.findById(requesterId)
      ]);

      const productTitle = product ? product.title : "sản phẩm";
      const requesterName = requester ? (requester.fullName || requester.userName) : "Một người dùng";

      await sendNotification(getIO(), {
        userId: String(donorId),
        type: "donation_created",
        title: "Yêu cầu quyên góp mới",
        message: `${requesterName} muốn nhận sản phẩm "${productTitle}" từ bạn.`,
        data: { orderId: donation._id },
      });
    } catch (notiErr) {
      console.error("[Donation Noti Error]", notiErr.message);
    }

    res.status(201).json(donation);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.acceptDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    donation.status = "accepted";
    donation.deliveryStatus = "shipping";
    donation.acceptedAt = new Date();

    await donation.save();

    await Product.findByIdAndUpdate(
      donation.productId,
      {
        isAvailable: false,
        status: "hidden",
      }
    );

    await Donation.updateMany(
      {
        productId: donation.productId,
        _id: { $ne: donation._id },
        status: "pending",
      },
      {
        status: "rejected",
        rejectReason: "Sản phẩm này đã được quyên tặng.",
        rejectedAt: new Date(),
      }
    );

    if (donation) {
      const Product = require("../models/modelProduct");
      await Product.findByIdAndUpdate(donation.productId, {
        status: "sold",
        isAvailable: false,
      });

      try {
        const User = require("../models/modelUser");
        const product = await Product.findById(donation.productId);
        const donor = await User.findById(donation.donorId);

        const productTitle = product ? product.title : "sản phẩm";
        const donorName = donor ? (donor.fullName || donor.userName) : "Người tặng";

        await sendNotification(getIO(), {
          userId: String(donation.requesterId),
          type: "donation_accepted",
          title: "Yêu cầu quyên góp được chấp nhận",
          message: `${donorName} đã đồng ý tặng sản phẩm "${productTitle}" cho bạn.`,
          data: { orderId: donation._id },
        });
      } catch (notiErr) {
        console.error("[Donation Accept Noti Error]", notiErr.message);
      }
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.rejectDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectReason: req.body.reason,
        rejectedAt: new Date(),
      },
      { new: true }
    );

    if (donation) {
      try {
        const Product = require("../models/modelProduct");
        const User = require("../models/modelUser");
        const product = await Product.findById(donation.productId);
        const donor = await User.findById(donation.donorId);

        const productTitle = product ? product.title : "sản phẩm";
        const donorName = donor ? (donor.fullName || donor.userName) : "Người tặng";
        const reasonStr = req.body.reason ? ` Lý do: ${req.body.reason}` : "";

        await sendNotification(getIO(), {
          userId: String(donation.requesterId),
          type: "donation_rejected",
          title: "Yêu cầu quyên góp bị từ chối",
          message: `${donorName} đã từ chối yêu cầu nhận sản phẩm "${productTitle}" của bạn.${reasonStr}`,
          data: { orderId: donation._id },
        });
      } catch (notiErr) {
        console.error("[Donation Reject Noti Error]", notiErr.message);
      }
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getMyDonations = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.query.page || req.query.limit) {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 10);
      const skip = (page - 1) * limit;

      const query = {
        $or: [
          { donorId: userId },
          { requesterId: userId }
        ]
      };

      const [donations, total] = await Promise.all([
        Donation.find(query)
          .sort({ createdAt: -1 })
          .populate("productId")
          .populate("donorId")
          .populate("requesterId")
          .skip(skip)
          .limit(limit),
        Donation.countDocuments(query)
      ]);

      return res.json({
        success: true,
        donations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const donations = await Donation.find({
      $or: [
        { donorId: userId },
        { requesterId: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .populate("productId")
      .populate("donorId")
      .populate("requesterId");

    res.json(donations);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        deliveryStatus: req.body.deliveryStatus,
      },
      { new: true }
    );

    if (donation) {
      try {
        const Product = require("../models/modelProduct");
        const User = require("../models/modelUser");

        const [product, donor] = await Promise.all([
          Product.findById(donation.productId),
          User.findById(donation.donorId)
        ]);

        const productTitle = product ? product.title : "sản phẩm";
        const donorName = donor ? (donor.fullName || donor.userName) : "Người tặng";

        let statusText = "Đang giao";
        if (req.body.deliveryStatus === "delivered") {
          statusText = "Đã giao";
        }

        await sendNotification(getIO(), {
          userId: String(donation.requesterId),
          type: "donation_delivery_updated",
          title: "Trạng thái vận chuyển quyên góp",
          message: `${donorName} đã chuyển trạng thái đơn quyên góp sản phẩm "${productTitle}" sang "${statusText}".`,
          data: { orderId: donation._id },
        });
      } catch (notiErr) {
        console.error("[Donation Delivery Update Noti Error]", notiErr.message);
      }
    }

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};