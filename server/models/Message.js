// server/models/Message.js

const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
	chat: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Chat",
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	message: {
		type: String,
		required: true,
		trim: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Message", MessageSchema);
