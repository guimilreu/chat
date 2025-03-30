// src/components/Chat.jsx (atualizado)

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import socket from "../lib/socket";
import { ChevronLeft, X, Send, Copy, Check } from "lucide-react";
import { Badge } from "./ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

const Chat = ({ activeChat = null, onBackClick }) => {
	const { user } = useAuth();
	const [users, setUsers] = useState({});
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [inputFocused, setInputFocused] = useState(false);
	const [typingUsers, setTypingUsers] = useState({});
	const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
	const messageContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);

	useEffect(() => {
		// Clear messages when changing chats
		setMessages([]);

		// Join the active chat room or the public chat
		const roomId = activeChat?._id || "public";
		socket.emit("join room", { roomId }, (response) => {
			if (response.success) {
				// Set messages from history
				setMessages(response.messages || []);
			}
		});

		// Listen for chat messages
		const handleChatMessage = (message, senderName, senderId, room) => {
			// Only add messages for the current room
			if (room === roomId) {
				setMessages((prevMessages) => [
					...prevMessages,
					{
						message,
						username: senderName,
						senderId,
						userId: message.userId || senderId, // Use userId if available for comparison
						timestamp: new Date(),
					},
				]);
			}
		};

		// Listen for user list updates
		const handleUserList = (userList) => {
			setUsers(userList);
		};

		// Listen for typing indicators
		const handleTyping = ({ userId, username, room }) => {
			if (room === roomId) {
				setTypingUsers((prev) => ({
					...prev,
					[userId]: username,
				}));
			}
		};

		// Listen for stop typing indicators
		const handleStopTyping = (userId, room) => {
			if (room === roomId) {
				setTypingUsers((prev) => {
					const updated = { ...prev };
					delete updated[userId];
					return updated;
				});
			}
		};

		// Register event handlers
		socket.on("chat message", handleChatMessage);
		socket.on("user list", handleUserList);
		socket.on("typing", handleTyping);
		socket.on("stop typing", handleStopTyping);

		// Clean up event listeners when component unmounts or active chat changes
		return () => {
			socket.off("chat message", handleChatMessage);
			socket.off("user list", handleUserList);
			socket.off("typing", handleTyping);
			socket.off("stop typing", handleStopTyping);

			// Leave the room when component unmounts or chat changes
			socket.emit("leave room", { roomId });
		};
	}, [activeChat]);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (messageContainerRef.current) {
			messageContainerRef.current.scrollTop =
				messageContainerRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSendMessage = (e) => {
		e?.preventDefault();
		if (newMessage.trim()) {
			const roomId = activeChat?._id || "public";
			socket.emit("chat message", newMessage, roomId);
			setNewMessage("");

			// Stop typing indicator when message is sent
			socket.emit("stop typing", roomId);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		}
	};

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);
		const roomId = activeChat?._id || "public";

		// Send typing indicator
		socket.emit("typing", roomId);

		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// Set timeout to stop typing after 2 seconds of inactivity
		typingTimeoutRef.current = setTimeout(() => {
			socket.emit("stop typing", roomId);
		}, 2000);
	};

	const copyInviteCode = () => {
		if (activeChat && activeChat.inviteCode) {
			navigator.clipboard.writeText(activeChat.inviteCode);
			setInviteCodeCopied(true);
			setTimeout(() => setInviteCodeCopied(false), 2000);
		}
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

	// Check if the user is the owner of the current chat
	const isOwner = activeChat && user && activeChat.owner === user.id;

	return (
		<>
			<div className="flex flex-col w-full pb-4 border-b border-black/5">
				<div className="flex items-center justify-between w-full">
					<button
						onClick={onBackClick}
						className="animate-fade-in outline-none rounded-full w-10 h-10 border border-white/40 bg-white/30 flex items-center justify-center transition hover:bg-white/70 cursor-pointer duration-300"
					>
						<ChevronLeft className="w-4 h-4 text-zinc-800" />
					</button>
					<div
						className="text-2xl font-medium animate-fade-in flex items-center gap-2"
						style={{
							animationDelay: "0.1s",
						}}
					>
						{activeChat ? activeChat.name : "Chat público"}

						{activeChat && (
							<Badge
								variant="outline"
								className="text-xs py-0 h-5 flex items-center gap-1 bg-white/70"
							>
								{isOwner ? "Seu chat" : "Membro"}
							</Badge>
						)}
					</div>
					<button
						style={{
							animationDelay: "0.2s",
						}}
						className="animate-fade-in outline-none rounded-full w-10 h-10 border border-white/40 bg-white/30 flex items-center justify-center transition hover:bg-white/70 cursor-pointer duration-300"
					>
						<X className="w-4 h-4 text-zinc-800" />
					</button>
				</div>
				<div
					className="text-sm text-center text-zinc-700 animate-fade-in flex flex-col items-center gap-1"
					style={{
						animationDelay: "0.2s",
					}}
				>
					{Object.keys(users).length} pessoa
					{Object.keys(users).length !== 1 ? "s" : ""} online
					{/* Código de convite para o dono do chat */}
					{activeChat && isOwner && (
						<div className="flex items-center gap-2 text-xs bg-white/70 rounded-full px-3 py-1 mt-1">
							<span>Código do chat:</span>
							<code className="bg-white/70 px-2 py-0.5 rounded text-zinc-800 font-mono">
								{activeChat.inviteCode}
							</code>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											onClick={copyInviteCode}
											className="text-zinc-600 hover:text-zinc-900"
										>
											{inviteCodeCopied ? (
												<Check className="h-3.5 w-3.5 text-green-500" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>
											{inviteCodeCopied
												? "Copiado!"
												: "Copiar código"}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					)}
				</div>
			</div>
			<div
				ref={messageContainerRef}
				className="flex flex-col gap-2 w-full h-full overflow-y-auto py-2"
			>
				{messages.map((data, index) => {
					// Check if message is from current user (using userId instead of socketId)
					const isCurrentUser =
						user &&
						(data.userId === user.id ||
							data.senderId === socket.id);

					return (
						<div
							key={index}
							className={`${
								isCurrentUser ? "self-end" : "self-start"
							} flex gap-2 items-start animate-fade-in`}
							style={{
								animationDelay: `${0.1 * (index % 5)}s`,
							}}
						>
							{!isCurrentUser && (
								<div className="rounded-full bg-black w-8 h-8"></div>
							)}
							<div
								className={`${
									isCurrentUser ? "items-end" : "items-start"
								} flex flex-col gap-0.5`}
							>
								<div className="text-sm font-medium text-zinc-800">
									{data.username}
								</div>
								<div
									className={`${
										isCurrentUser
											? "bg-blue-500 rounded-tr-none text-white text-right"
											: "bg-white/80 backdrop-blur-md border border-white rounded-tl-none text-zinc-900 text-left"
									} px-2.5 py-1.5 rounded-full text-md`}
								>
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

			<form onSubmit={handleSendMessage} className="w-full">
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
	);
};

export default Chat;
