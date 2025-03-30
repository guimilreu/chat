require("dotenv").config(); // Carregar variáveis de ambiente do arquivo .env
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const { verifySocketToken } = require("./middleware/auth");
const chatController = require("./controllers/chatController");

// Conectar ao MongoDB
mongoose
	.connect(process.env.MONGO_URI || "mongodb://localhost:27017/gmdev-chat", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB conectado"))
	.catch((err) => console.error("Erro de conexão com MongoDB:", err));

// Configure CORS for Express
const corsConfig = {
	origin: "http://localhost:5173", // Your client's origin
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true, // Allow credentials (cookies, authorization headers, etc.)
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"Access-Control-Allow-Headers",
		"X-Requested-With",
	],
};

// Aplicar CORS antes de definir as rotas
app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());

// Middleware para logs de requisições
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rotas de autenticação
app.use("/api/auth", authRoutes);

// Configure Socket.IO with CORS options
const io = new Server(server, {
	cors: corsConfig,
});

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// Armazenar usuários ativos por sala
const rooms = {
	public: { users: new Map(), messageHistory: [] },
};

// Usuários digitando por sala
const typingUsers = new Map();

// Helper function to update and broadcast user list for a specific room
const updateUserList = (roomId) => {
	const room = rooms[roomId];
	if (room) {
		const userList = Object.fromEntries(room.users);
		io.to(roomId).emit("user list", userList);
		console.log(`Room ${roomId}: ${room.users.size} active users`);
	}
};

// Middleware de autenticação para Socket.IO
io.use(verifySocketToken);

io.on("connection", (socket) => {
	console.log(
		"Usuário autenticado conectado:",
		socket.user.username,
		socket.id
	);

	// Inicialmente, adicionar usuário apenas ao room público (sem adicionar a outro chat)
	if (!rooms.public) {
		rooms.public = { users: new Map(), messageHistory: [] };
	}
	rooms.public.users.set(socket.id, socket.user.username);
	socket.join("public");
	updateUserList("public");

	// Enviar histórico de mensagens do chat público
	socket.emit("message history", rooms.public.messageHistory);

	// Handle user disconnection
	const handleDisconnect = () => {
		console.log("user disconnected or logged out", socket.id);

		// Remove user from all rooms they were part of
		for (const [roomId, room] of Object.entries(rooms)) {
			if (room.users.has(socket.id)) {
				room.users.delete(socket.id);
				updateUserList(roomId);
			}
		}

		// Remove from typing list
		typingUsers.delete(socket.id);

		// Notify all rooms where the user was typing
		for (const [roomId, typingMap] of Object.entries(typingUsers)) {
			if (typingMap.has(socket.id)) {
				typingMap.delete(socket.id);
				io.to(roomId).emit("stop typing", socket.id, roomId);
			}
		}
	};

	socket.on("disconnect", handleDisconnect);
	socket.on("user disconnecting", handleDisconnect);
	socket.on("logout", handleDisconnect);

	// Handle chat creation
	socket.on("create chat", async (data, callback) => {
		try {
			const { name } = data;
			if (!name || !name.trim()) {
				return callback({
					success: false,
					message: "Nome do chat é obrigatório",
				});
			}

			const result = await chatController.createChat(
				socket.user.id,
				name
			);

			if (result.success) {
				// Create a room for this chat
				const roomId = result.chat._id.toString();
				rooms[roomId] = { users: new Map(), messageHistory: [] };

				// Join the room
				socket.join(roomId);
				rooms[roomId].users.set(socket.id, socket.user.username);
				updateUserList(roomId);
			}

			callback(result);
		} catch (error) {
			console.error("Error creating chat:", error);
			callback({ success: false, message: "Erro ao criar chat" });
		}
	});

	// Handle joining a chat by invite code
	socket.on("join chat", async (data, callback) => {
		try {
			const { inviteCode } = data;
			if (!inviteCode || !inviteCode.trim()) {
				return callback({
					success: false,
					message: "Código de convite é obrigatório",
				});
			}

			const result = await chatController.joinChat(
				socket.user.id,
				inviteCode
			);

			if (result.success) {
				// Join the room
				const roomId = result.chat._id.toString();

				// Create room if it doesn't exist yet
				if (!rooms[roomId]) {
					rooms[roomId] = { users: new Map(), messageHistory: [] };
				}

				socket.join(roomId);
				rooms[roomId].users.set(socket.id, socket.user.username);
				updateUserList(roomId);
			}

			callback(result);
		} catch (error) {
			console.error("Error joining chat:", error);
			callback({ success: false, message: "Erro ao entrar no chat" });
		}
	});

	// Get user's chats
	socket.on("get chats", async (callback) => {
		try {
			const result = await chatController.getUserChats(socket.user.id);
			callback(result);
		} catch (error) {
			console.error("Error getting user chats:", error);
			callback({ success: false, message: "Erro ao obter chats" });
		}
	});

	// Handle refresh chats request
	socket.on("refresh chats request", async () => {
		try {
			// Emitir para todos os clientes que devem atualizar suas listas de chats
			io.emit("refresh chats");
		} catch (error) {
			console.error("Error requesting chat refresh:", error);
		}
	});

	// Join a specific chat room
	socket.on("join room", async ({ roomId }, callback) => {
		try {
			// Check if user has access to this chat
			let accessResult;

			if (roomId === "public") {
				accessResult = { success: true };
			} else {
				accessResult = await chatController.checkChatAccess(
					roomId,
					socket.user.id
				);
			}

			if (!accessResult.success) {
				return callback(accessResult);
			}

			// Join the room
			if (!rooms[roomId]) {
				rooms[roomId] = { users: new Map(), messageHistory: [] };
			}

			// Leave any previous rooms except 'public'
			for (const [currentRoomId, room] of Object.entries(rooms)) {
				if (currentRoomId !== "public" && room.users.has(socket.id)) {
					socket.leave(currentRoomId);
					room.users.delete(socket.id);
					updateUserList(currentRoomId);
				}
			}

			socket.join(roomId);
			rooms[roomId].users.set(socket.id, socket.user.username);
			updateUserList(roomId);

			// If it's a user chat (not public), fetch messages from database
			let messages = [];
			if (roomId !== "public") {
				const messagesResult = await chatController.getChatMessages(
					roomId
				);
				if (messagesResult.success) {
					messages = messagesResult.messages;
				}
			} else {
				// For public chat, use in-memory message history
				messages = rooms.public.messageHistory;
			}

			callback({
				success: true,
				messages,
			});
		} catch (error) {
			console.error("Error joining room:", error);
			callback({ success: false, message: "Erro ao entrar na sala" });
		}
	});

	// Leave a specific chat room
	socket.on("leave room", ({ roomId }) => {
		if (rooms[roomId] && rooms[roomId].users.has(socket.id)) {
			socket.leave(roomId);
			rooms[roomId].users.delete(socket.id);
			updateUserList(roomId);
		}
	});

	// Handle chat messages
	socket.on("chat message", async (msg, roomId = "public") => {
		if (!msg.trim()) return;

		console.log(`message in room ${roomId}:`, msg);
		const username = socket.user.username;

		const messageData = {
			message: msg,
			username: username,
			senderId: socket.id,
			userId: socket.user.id, // Add user ID for comparison
			timestamp: new Date(),
		};

		// If it's not the public chat, save to database
		if (roomId !== "public") {
			await chatController.saveMessage(
				roomId,
				socket.user.id,
				username,
				msg
			);
		} else {
			// Store public message in memory (limit to last 100 messages)
			rooms.public.messageHistory.push(messageData);
			if (rooms.public.messageHistory.length > 100) {
				rooms.public.messageHistory.shift();
			}
		}

		// Remove user from typing list
		if (!typingUsers[roomId]) {
			typingUsers[roomId] = new Map();
		}
		typingUsers[roomId].delete(socket.id);
		io.to(roomId).emit("stop typing", socket.id, roomId);

		// Send message to all clients in the room
		io.to(roomId).emit("chat message", msg, username, socket.id, roomId);
	});

	// Handle typing indicators
	socket.on("typing", (roomId = "public") => {
		const username = socket.user.username;

		// Initialize typing map for this room if it doesn't exist
		if (!typingUsers[roomId]) {
			typingUsers[roomId] = new Map();
		}

		typingUsers[roomId].set(socket.id, username);
		socket
			.to(roomId)
			.emit("typing", { userId: socket.id, username, room: roomId });
	});

	socket.on("stop typing", (roomId = "public") => {
		if (typingUsers[roomId]) {
			typingUsers[roomId].delete(socket.id);
		}
		socket.to(roomId).emit("stop typing", socket.id, roomId);
	});
});

// Iniciar o servidor
server.listen(3000, () => {
	console.log("listening on *:3000");
});
