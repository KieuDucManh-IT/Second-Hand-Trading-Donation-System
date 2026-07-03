const Donation = require("../models/modelDonation");

exports.requestDonation = async (req, res) => {
  try {
    const donation = await Donation.create({
      productId: req.body.productId,
      donorId: req.body.donorId,
      requesterId: req.body.requesterId,
      message: req.body.message,
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.acceptDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        status: "accepted",
        deliveryStatus: "shipping",
        acceptedAt: new Date(),
      },
      { new: true }
    );

    if (donation) {
      const Product = require("../models/modelProduct");
      await Product.findByIdAndUpdate(donation.productId, {
        status: "sold",
        isAvailable: false,
      });
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

    const donations = await Donation.find({
      $or: [
        { donorId: userId },
        { requesterId: userId }
      ]
    })
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