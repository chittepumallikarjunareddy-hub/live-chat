const {
  getMessages,
  addMessage,
  deleteMessageForEveryone,
  editMessageForEveryone
} = require("../models/store");

async function fetchMessages() {
  return await getMessages();
}

async function createMessage(payload) {
  return await addMessage(payload);
}

async function deleteMessage(messageId) {
  return await deleteMessageForEveryone(messageId);
}

async function editMessage(messageId, nextText) {
  return await editMessageForEveryone(messageId, nextText);
}

module.exports = {
  fetchMessages,
  createMessage,
  deleteMessage,
  editMessage
};
