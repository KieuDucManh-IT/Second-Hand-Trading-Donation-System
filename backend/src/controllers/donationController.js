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