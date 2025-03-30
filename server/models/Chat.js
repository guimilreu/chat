// server/models/Chat.js

const mongoose = require("mongoose");
const crypto = require("crypto");

const ChatSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		maxlength: 50,
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	members: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
	inviteCode: {
		type: String,
		unique: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Método para gerar código de convite aleatório
ChatSchema.methods.generateInviteCode = function () {
	const code = crypto.randomBytes(4).toString("hex");
	this.inviteCode = code;
	return code;
};

// Método para verificar se um usuário é membro do chat
ChatSchema.methods.isMember = function (userId) {
	return (
		this.members.includes(userId) ||
		this.owner.toString() === userId.toString()
	);
};

module.exports = mongoose.model("Chat", ChatSchema);
