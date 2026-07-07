const Product = require("../models/modelProduct");

const Donation = require("../models/modelDonation");

exports.requestDonation = async (req, res) => {
  try {
    const {
      productId,
      donorId,
      requesterId,
      message,
    } = req.body;

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
    });

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

    // Accept request này
    donation.status = "accepted";
    donation.deliveryStatus = "shipping";
    donation.acceptedAt = new Date();

    await donation.save();

    // Ẩn sản phẩm khỏi Marketplace
    await Product.findByIdAndUpdate(
      donation.productId,
      {
        isAvailable: false,
        status: "hidden",
      }
    );

    // Reject toàn bộ request khác
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

    res.json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("productId")
      .populate("donorId")
      .populate("requesterId");

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.getMyDonations = async (req, res) => {
  try {
    const userId = req.user.id;

    const donations = await Donation.find({
      $or: [
        { donorId: userId },
        { requesterId: userId }
      ]
    })
      .sort({ createdAt: -1 })   // Thêm dòng này
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

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};