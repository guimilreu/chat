const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");

// Configure CORS for Express
const corsConfig = {
	origin: "http://localhost:5173", // Your client's origin
	methods: ["GET", "POST"],
	credentials: true // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsConfig));
app.use(express.json());

// Configure Socket.IO with CORS options
const io = new Server(server, {
  cors: corsConfig
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const users = new Map();
const messageHistory = [];
const typingUsers = new Map();

// Helper function to update and broadcast user list
const updateUserList = () => {
    const userList = Object.fromEntries(users);
    io.emit("user list", userList);
    console.log("Current active users:", users.size);
};

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

	// Send message history to the newly connected user
	socket.emit("message history", messageHistory);

	// Handle all forms of disconnection (refresh, close tab, logout)
	const handleDisconnect = () => {
		console.log("user disconnected or logged out", socket.id);
		// Remove user from active users
		users.delete(socket.id);
		// Remove from typing list
		typingUsers.delete(socket.id);
		// Update the user list for all clients
		updateUserList();
		// Stop typing indicator for this user
		io.emit("stop typing", socket.id);
	};

	socket.on("disconnect", handleDisconnect);
	socket.on("user disconnecting", handleDisconnect); 
	socket.on("logout", handleDisconnect);

	socket.on("set name", (username) => {
		if (!username.trim()) return;
		
		users.set(socket.id, username);
		console.log("User set name:", username, "with ID:", socket.id);
		updateUserList();
	});

	socket.on("chat message", (msg) => {
		if (!msg.trim()) return;
		
		console.log("message:", msg);
		const username = users.get(socket.id) || "Anonymous";
		const messageData = {
			message: msg,
			username: username,
			senderId: socket.id,
			timestamp: new Date()
		};
		
		// Store message in history (limit to last 100 messages)
		messageHistory.push(messageData);
		if (messageHistory.length > 100) {
			messageHistory.shift();
		}
		
		// Remove user from typing list
		typingUsers.delete(socket.id);
		io.emit("stop typing", socket.id);
		
		// Send message to all clients
		io.emit("chat message", msg, username, socket.id);
	});
	
	socket.on("typing", () => {
		const username = users.get(socket.id);
		if (username) {
			typingUsers.set(socket.id, username);
			socket.broadcast.emit("typing", { userId: socket.id, username });
		}
	});
	
	socket.on("stop typing", () => {
		typingUsers.delete(socket.id);
		socket.broadcast.emit("stop typing", socket.id);
	});
});

server.listen(3000, () => {
    console.log("listening on *:3000");
});