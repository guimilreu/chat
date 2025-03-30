// server/controllers/chatController.js

const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// Criar um novo chat
exports.createChat = async (userId, name) => {
	try {
		const chat = new Chat({
			name,
			owner: userId,
			members: [userId], // Adicionar o criador como membro
		});

		// Gerar código de convite
		chat.generateInviteCode();

		await chat.save();

		return {
			success: true,
			chat: {
				_id: chat._id,
				name: chat.name,
				owner: chat.owner,
				inviteCode: chat.inviteCode,
			},
			inviteCode: chat.inviteCode,
		};
	} catch (error) {
		console.error("Erro ao criar chat:", error);
		return {
			success: false,
			message: "Erro ao criar chat",
		};
	}
};

// Entrar em um chat via código de convite
exports.joinChat = async (userId, inviteCode) => {
	try {
		// Encontrar o chat pelo código de convite
		const chat = await Chat.findOne({ inviteCode });

		if (!chat) {
			return {
				success: false,
				message: "Código de convite inválido",
			};
		}

		// Verificar se o usuário já é membro
		if (chat.isMember(userId)) {
			return {
				success: true,
				chat: {
					_id: chat._id,
					name: chat.name,
					owner: chat.owner,
					inviteCode: chat.inviteCode,
				},
				message: "Você já é membro deste chat",
			};
		}

		// Adicionar usuário aos membros
		chat.members.push(userId);
		await chat.save();

		return {
			success: true,
			chat: {
				_id: chat._id,
				name: chat.name,
				owner: chat.owner,
				inviteCode: chat.inviteCode,
			},
		};
	} catch (error) {
		console.error("Erro ao entrar no chat:", error);
		return {
			success: false,
			message: "Erro ao entrar no chat",
		};
	}
};

// Obter todos os chats de um usuário
exports.getUserChats = async (userId) => {
	try {
		// Encontrar chats onde o usuário é dono ou membro
		const chats = await Chat.find({
			$or: [{ owner: userId }, { members: userId }],
		}).sort({ createdAt: -1 });

		// Mapear para o formato desejado
		const formattedChats = chats.map((chat) => ({
			_id: chat._id,
			name: chat.name,
			owner: chat.owner,
			inviteCode: chat.inviteCode,
		}));

		return {
			success: true,
			chats: formattedChats,
		};
	} catch (error) {
		console.error("Erro ao obter chats do usuário:", error);
		return {
			success: false,
			message: "Erro ao obter chats",
		};
	}
};

// Salvar uma mensagem em um chat
exports.saveMessage = async (chatId, userId, username, message) => {
	try {
		// Criar nova mensagem
		const newMessage = new Message({
			chat: chatId,
			user: userId,
			username,
			message,
		});

		await newMessage.save();

		return {
			success: true,
			message: newMessage,
		};
	} catch (error) {
		console.error("Erro ao salvar mensagem:", error);
		return {
			success: false,
			message: "Erro ao salvar mensagem",
		};
	}
};

// Obter mensagens de um chat
exports.getChatMessages = async (chatId, limit = 100) => {
	try {
		// Verificar se o chatId é válido ou se é 'public'
		if (chatId === "public") {
			return {
				success: true,
				messages: [], // Chat público não tem mensagens salvas no banco
			};
		}

		// Buscar mensagens do chat
		const messages = await Message.find({ chat: chatId })
			.sort({ timestamp: -1 })
			.limit(limit);

		// Mapear para o formato desejado e inverter para ordem cronológica
		const formattedMessages = messages
			.map((msg) => ({
				message: msg.message,
				username: msg.username,
				userId: msg.user, // Usar ID do usuário para comparação
				senderId: null, // Não usamos o socket ID para mensagens do banco
				timestamp: msg.timestamp,
			}))
			.reverse();

		return {
			success: true,
			messages: formattedMessages,
		};
	} catch (error) {
		console.error("Erro ao obter mensagens do chat:", error);
		return {
			success: false,
			message: "Erro ao obter mensagens",
		};
	}
};

// Verificar se um usuário tem acesso a um chat
exports.checkChatAccess = async (chatId, userId) => {
	try {
		// Se for o chat público, qualquer usuário tem acesso
		if (chatId === "public") {
			return { success: true };
		}

		// Buscar o chat
		const chat = await Chat.findById(chatId);

		if (!chat) {
			return {
				success: false,
				message: "Chat não encontrado",
			};
		}

		// Verificar se o usuário é membro ou dono
		if (!chat.isMember(userId)) {
			return {
				success: false,
				message: "Você não tem acesso a este chat",
			};
		}

		return {
			success: true,
			chat: {
				_id: chat._id,
				name: chat.name,
				owner: chat.owner,
				inviteCode: chat.inviteCode,
			},
		};
	} catch (error) {
		console.error("Erro ao verificar acesso ao chat:", error);
		return {
			success: false,
			message: "Erro ao verificar acesso ao chat",
		};
	}
};
