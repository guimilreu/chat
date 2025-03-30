// Novo componente: src/components/ChatList.jsx

import { useState, useEffect } from "react";
import { MessageCircle, Lock, Users, User, Crown, Globe } from "lucide-react";
import { Badge } from "./ui/badge";
import socket from "../lib/socket";
import { useAuth } from "../context/AuthContext";

const ChatList = ({ onSelectChat, activeChat }) => {
	const { user } = useAuth();
	const [chats, setChats] = useState([]);
	const [loading, setLoading] = useState(true);

	// Função para buscar chats do usuário
	const fetchUserChats = () => {
		socket.emit("get chats", (response) => {
			setLoading(false);
			if (response.success) {
				setChats(response.chats);
			}
		});
	};

	useEffect(() => {
		// Fetch user's chats on component mount
		fetchUserChats();

		// Listen for chat updates (new chats, updates to existing chats)
		socket.on("chat update", (updatedChat) => {
			setChats((prevChats) => {
				// Check if the chat already exists in the list
				const chatExists = prevChats.some(
					(chat) => chat._id === updatedChat._id
				);

				if (chatExists) {
					// Update the existing chat
					return prevChats.map((chat) =>
						chat._id === updatedChat._id ? updatedChat : chat
					);
				} else {
					// Add the new chat to the list
					return [...prevChats, updatedChat];
				}
			});
		});

		// Ouvir eventos de atualização de lista
		socket.on("refresh chats", fetchUserChats);

		// Limpar event listeners
		return () => {
			socket.off("chat update");
			socket.off("refresh chats");
		};
	}, []);

	if (loading) {
		return (
			<div className="space-y-2">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="animate-pulse h-8 bg-white/30 rounded-full"
					></div>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{/* Public Chat */}
			<button
				onClick={() => onSelectChat(null)}
				className={`
          flex items-center px-3 py-1.5 justify-start gap-2 
          text-sm rounded-full w-full transition-colors duration-200
		  border border-white/0
          ${
				activeChat === null
					? "bg-blue-500 text-white"
					: "bg-white/60 text-zinc-800 border-white/50 hover:bg-white/100"
			}
        `}
			>
				<Globe className="h-4 w-4" />
				Chat público
				{/* <Badge
					variant="outline"
					className={`ml-auto text-xs py-0 h-5 ${
						activeChat === null
							? "bg-blue-600/50 text-white border-white/20"
							: "bg-white/70"
					}`}
				>
					Público
				</Badge> */}
			</button>

			{/* User's Chats */}
			{chats.map((chat) => {
				const isOwner = chat.owner === user.id;

				return (
					<button
						key={chat._id}
						onClick={() => onSelectChat(chat)}
						className={`
              flex items-center px-3 py-1.5 justify-start gap-2 
              text-sm rounded-full w-full transition-colors duration-200
			  border border-white/0
              ${
					activeChat?._id === chat._id
						? "bg-blue-500 text-white"
						: "bg-white/60 text-zinc-800 border-white/50 hover:bg-white/100"
				}
            `}
					>
						<MessageCircle className="h-4 w-4" />
						{chat.name}
						<Badge
							variant="outline"
							className={`ml-auto text-xs py-0 h-5 px-1 flex items-center gap-1 transition
                ${
					activeChat?._id === chat._id
						? "bg-blue-600/50 text-white border-white/20"
						: "bg-white/70 text-yellow-600 border-yellow-500/20"
				}
              `}
						>
							{isOwner ? (
								<>
									<Crown className="h-3 w-3" />
								</>
							) : (
								<>
									<User className="h-3 w-3" />
								</>
							)}
						</Badge>
					</button>
				);
			})}

			{chats.length === 0 && (
				<div className="text-xs text-center text-zinc-500 italic px-2 py-2">
					Nenhum chat encontrado. Crie um novo ou entre em um
					existente.
				</div>
			)}
		</div>
	);
};

export default ChatList;
