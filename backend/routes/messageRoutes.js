const express = require("express");
const { deleteAllMessages, deleteThreadBetween, getMessages } = require("../models/store");
const { GLOBAL_ROOM } = require("../socketHandler");

const router = express.Router();


router.post("/clear-thread", async (req, res) => {
  const acting = String(req.get("x-acting-user") || "").trim().toLowerCase();
  const partner = String(req.body.withUser || "").trim().toLowerCase();
  if (!acting || !partner || partner === acting) {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid chat participants."
    });
  }
  try {
    const deleted = await deleteThreadBetween(acting, partner);
    const messages = await getMessages();
    const io = req.app.get("io");
    io?.to(GLOBAL_ROOM).emit("chat:history", messages);
    return res.json({ success: true, deleted });
  } catch (err) {
    console.error("POST /api/messages/clear-thread:", err);
    return res.status(500).json({ success: false, message: "Could not clear this chat." });
  }
});

module.exports = router;
