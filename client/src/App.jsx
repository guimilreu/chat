import { useState, useEffect, useRef } from "react";

import socket from "./lib/socket";

import { ChevronLeft, X, Send, ArrowUp } from "lucide-react";

function App() {
	const [users, setUsers] = useState({});
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [username, setUsername] = useState("");
	const [userNameSend, setUserNameSend] = useState(false);
	const [inputFocused, setInputFocused] = useState(false);
	const [typingUsers, setTypingUsers] = useState({});
	const messageContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	useEffect(() => {
		// Check if username exists in localStorage
		const savedUsername = localStorage.getItem("chatUsername");
		
		if (savedUsername) {
			setUsername(savedUsername);
			setUserNameSend(true);
			// Reconnect with existing username
			socket.emit("set name", savedUsername);
		}

		// Add window unload event to handle page refresh or close
		const handleUnload = () => {
			socket.emit("user disconnecting");
			// We're not using localStorage.removeItem here because
			// we want to remember the username for convenience
			// but the server will consider this user offline
		};
		
		window.addEventListener("beforeunload", handleUnload);

		socket.on("chat message", (message, senderName, senderId) => {
			console.log("New message:", message, "from:", senderName, senderId);
			setMessages((prevMessages) => [
				...prevMessages,
				{ message, username: senderName, senderId, timestamp: new Date() },
			]);
		});

		socket.on("user list", (userList) => {
			console.log("Updated user list:", userList);
			setUsers(userList);
		});

		socket.on("message history", (history) => {
			console.log("Received message history:", history);
			setMessages(history);
		});

		socket.on("typing", ({ userId, username }) => {
			setTypingUsers(prev => ({
				...prev,
				[userId]: username
			}));
		});

		socket.on("stop typing", (userId) => {
			setTypingUsers(prev => {
				const updated = { ...prev };
				delete updated[userId];
				return updated;
			});
		});

		return () => {
			socket.off("chat message");
			socket.off("user list");
			socket.off("message history");
			socket.off("typing");
			socket.off("stop typing");
			window.removeEventListener("beforeunload", handleUnload);
			// Ensure we clean up on component unmount as well
			socket.emit("user disconnecting");
		};
	}, []);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (messageContainerRef.current) {
			messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSetUsername = (e) => {
		e?.preventDefault();
		if (username.trim()) {
			socket.emit("set name", username);
			setUserNameSend(true);
			localStorage.setItem("chatUsername", username);
		}
	};

	const handleSendMessage = (e) => {
		e?.preventDefault();
		if (newMessage.trim()) {
			socket.emit("chat message", newMessage);
			setNewMessage("");
			// Stop typing indicator when message is sent
			socket.emit("stop typing");
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		}
	};

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);
		
		// Send typing indicator
		socket.emit("typing");
		
		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
		
		// Set timeout to stop typing after 2 seconds of inactivity
		typingTimeoutRef.current = setTimeout(() => {
			socket.emit("stop typing");
		}, 2000);
	};

	const handleLogout = () => {
		setUserNameSend(false);
		// We keep the username in localStorage for convenience
		// but notify the server of logout
		socket.emit("user disconnecting");
	};

	// Format typing indicator text
	const getTypingText = () => {
		const count = Object.keys(typingUsers).length;
		if (count === 0) return null;
		if (count === 1) {
			const username = Object.values(typingUsers)[0];
			return `${username} está digitando...`;
		}
		return `${count} usuários estão digitando...`;
	};

	return (
		<>
			<div className="flex mx-auto w-2/5 h-screen min-h-screen p-12">
				<div className="flex flex-col gap-4 justify-between w-full h-full rounded-3xl border border-white/50 shadow-xl bg-white/50 backdrop-blur-lg p-6">
					{!userNameSend ? (
						<div className="w-full h-full flex flex-col items-center justify-center gap-4">
							<div className="text-xl font-medium text-zinc-900 animate-fade-in">Digite seu nome de usuário:</div>
							<form 
								onSubmit={handleSetUsername}
								className="w-full flex flex-col items-center"
							>
								<label
									htmlFor="username"
									className={`w-2/3 rounded-full h-12 ${
										inputFocused ? "bg-white/60" : "bg-white/50"
									} overflow-hidden flex items-center justify-between gap-2 pr-1 transition-colors duration-200 animate-fade-in`}
									style={{
										animationDelay: "0.1s",
									}}
								>
									<input
										id="username"
										type="text"
										className="border-none outline-none w-full h-full pl-4 text-sm bg-transparent"
										placeholder="Digite seu nome..."
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										onFocus={() => setInputFocused(true)}
										onBlur={() => setInputFocused(false)}
									/>
									<button
										type="submit"
										className="animate-fade-in rounded-full w-10 min-w-10 h-10 bg-white/90 border border-white/50 flex items-center justify-center transition hover:bg-white cursor-pointer duration-300"
										style={{
											animationDelay: "0.2s",
										}}
									>
										<ArrowUp className="w-4 h-4 text-zinc-900" />
									</button>
								</label>
							</form>
						</div>
					) : (
						<>
							<div className="flex flex-col w-full pb-4 border-b border-black/5">
								<div className="flex items-center justify-between w-full">
									<button 
										onClick={handleLogout} 
										className="animate-fade-in outline-none rounded-full w-10 h-10 border border-white/40 bg-white/30 flex items-center justify-center transition hover:bg-white/70 cursor-pointer duration-300"
									>
										<ChevronLeft className="w-4 h-4 text-zinc-800" />
									</button>
									<div className="text-2xl font-medium animate-fade-in" style={{
										animationDelay: "0.1s",
									}}>
										Chat público
									</div>
									<button style={{
										animationDelay: "0.2s",
									}} className="animate-fade-in outline-none rounded-full w-10 h-10 border border-white/40 bg-white/30 flex items-center justify-center transition hover:bg-white/70 cursor-pointer duration-300">
										<X className="w-4 h-4 text-zinc-800" />
									</button>
								</div>
								<div className="text-sm text-center mt-2 text-zinc-700 animate-fade-in" style={{
									animationDelay: "0.2s",
								}}>
									{Object.keys(users).length} pessoa{Object.keys(users).length !== 1 ? 's' : ''} online
								</div>
							</div>
							<div 
								ref={messageContainerRef}
								className="flex flex-col gap-2 w-full h-full overflow-y-auto py-2"
							>
								{messages.map((data, index) => {
									// Check if message is from current user
									const isCurrentUser = socket.id === data.senderId;
									return (
										<div
											key={index}
											className={`${
												isCurrentUser
													? "self-end"
													: "self-start"
											} flex gap-2 items-start animate-fade-in`}
											style={{
												animationDelay: `${0.1 * (index % 5)}s`,
											}}
										>
											{!isCurrentUser && (
												<div className="rounded-full bg-black w-8 h-8"></div>
											)}
											<div className={`${isCurrentUser ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
												<div className="text-sm font-medium text-zinc-800">
													{data.username}
												</div>
												<div className={`${isCurrentUser ? "bg-blue-500 rounded-tr-none text-white text-right" : "bg-white/80 backdrop-blur-md border border-white rounded-tl-none text-zinc-900 text-left"} px-2.5 py-1.5 rounded-full text-md`}>
													{data.message}
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{getTypingText() && (
								<div className="text-sm italic text-zinc-600 animate-pulse">
									{getTypingText()}
								</div>
							)}

							<form 
								onSubmit={handleSendMessage}
								className="w-full"
							>
								<label
									htmlFor="message"
									className={`w-full rounded-full h-14 ${
										inputFocused ? "bg-white/60" : "bg-white/50"
									} overflow-hidden flex items-center justify-between gap-2 pr-2 transition-colors duration-200 animate-fade-in`}
									style={{
										animationDelay: "0.3s",
									}}
								>
									<input
										id="message"
										type="text"
										className="border-none outline-none w-full h-full pl-4 text-sm bg-transparent"
										placeholder="Digite sua mensagem..."
										value={newMessage}
										onChange={handleInputChange}
										onFocus={() => setInputFocused(true)}
										onBlur={() => setInputFocused(false)}
									/>
									<button
										type="submit"
										className="animate-fade-in rounded-full w-10 min-w-10 h-10 bg-white/90 border border-white/50 flex items-center justify-center transition hover:bg-white cursor-pointer duration-300"
										style={{
											animationDelay: "0.4s",
										}}
									>
										<Send className="w-4 h-4 text-zinc-900" />
									</button>
								</label>
							</form>
						</>
					)}
				</div>
			</div>
		</>
	);
}

export default App;
