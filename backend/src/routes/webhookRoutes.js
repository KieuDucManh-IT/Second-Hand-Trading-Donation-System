const express = require("express");
const router = express.Router();

const payosWebhookController = require("../controllers/payosWebhookController");

router.post("/payos", payosWebhookController.handlePayosWebhook);

module.exports = router;