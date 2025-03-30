import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Login from "@/components/Login";
import Register from "@/components/Register";
import Chat from "@/components/Chat";
import ChatActions from "@/components/ChatActions";
import ChatList from "@/components/ChatList";
import LoadingScreen from "@/components/LoadingScreen";
import { CreateChatModal, JoinChatModal } from "@/components/ChatModals";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, ChevronUp, User, LogOut } from "lucide-react";
import Cookies from "js-cookie";

function App() {
	const [authMode, setAuthMode] = useState("login"); // 'login' ou 'register'
	const { user, isAuthenticated, loading, logout } = useAuth();
	const [activeChat, setActiveChat] = useState(null); // null = public chat, object = specific chat
	const [createChatModalOpen, setCreateChatModalOpen] = useState(false);
	const [joinChatModalOpen, setJoinChatModalOpen] = useState(false);

	// Log para debug da autenticação
	useEffect(() => {
		const token = Cookies.get("token");
		console.log("App render - Auth state:", {
			isAuthenticated,
			loading,
			hasToken: !!token,
			user,
		});
	}, [isAuthenticated, loading, user]);

	const switchToRegister = () => setAuthMode("register");
	const switchToLogin = () => setAuthMode("login");

	const handleLogout = async () => {
		await logout();
	};

	const handleChatCreated = (newChat) => {
		// Automatically switch to the new chat
		setActiveChat(newChat);
	};

	const handleChatJoined = (joinedChat) => {
		// Automatically switch to the joined chat
		setActiveChat(joinedChat);
	};

	const handleSelectChat = (chat) => {
		setActiveChat(chat);
	};

	return (
		<>
			<div className="flex justify-center mx-auto w-full h-screen min-h-screen p-12 gap-4">
				<div
					className={`
						transition-all duration-300 ease-in-out
						flex flex-col gap-4 justify-between h-full 
						rounded-3xl border border-white/50 shadow-xl bg-white/75 backdrop-blur-lg
						${
							isAuthenticated
								? "w-[18rem] p-6 opacity-100 overflow-hidden"
								: "w-[0rem] p-0 opacity-0 overflow-hidden border-0"
						}
					`}
				>
					{/* Conteúdo do sidebar */}
					{isAuthenticated && (
						<>
							<div className="opacity-100 transition-opacity delay-150 duration-200 flex flex-col gap-2">
								<h3 className="text-lg font-medium w-full text-left border-b border-black/5 pb-1">
									Chats
								</h3>

								{/* Botões de criar/entrar em chat */}

								<ChatList
									onSelectChat={handleSelectChat}
									activeChat={activeChat}
								/>
								{/* Lista de chats */}
							</div>
							<div className="flex flex-col">
								<ChatActions
									openCreateChatModal={() =>
										setCreateChatModalOpen(true)
									}
									openJoinChatModal={() =>
										setJoinChatModalOpen(true)
									}
								/>
								<div className="opacity-100 transition-opacity delay-150 duration-200 border-t border-black/5 pt-2">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												className="w-full justify-between hover:bg-white/30 rounded-full"
											>
												<div className="flex items-center gap-2">
													<Avatar className="h-6 w-6">
														<AvatarImage src="" />
														<AvatarFallback className="bg-blue-500 text-white text-xs">
															{user?.username
																?.substring(
																	0,
																	2
																)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span>
														{user?.username}
													</span>
												</div>
												<ChevronUp className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-48"
										>
											<DropdownMenuLabel>
												Minha conta
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<DropdownMenuItem className="cursor-pointer flex gap-2">
												<User className="h-4 w-4" />
												Meu perfil
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={handleLogout}
												className="cursor-pointer flex gap-2"
											>
												<LogOut className="h-4 w-4" />
												Sair
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="flex flex-col gap-4 justify-between w-2/5 h-full rounded-3xl border border-white/50 shadow-xl bg-white/75 backdrop-blur-lg p-6">
					{loading ? (
						<LoadingScreen />
					) : !isAuthenticated ? (
						authMode === "login" ? (
							<Login switchToRegister={switchToRegister} />
						) : (
							<Register switchToLogin={switchToLogin} />
						)
					) : (
						<Chat
							activeChat={activeChat}
							onBackClick={() => setActiveChat(null)}
						/>
					)}
				</div>
			</div>

			{/* Modais de chat */}
			<CreateChatModal
				isOpen={createChatModalOpen}
				onClose={() => setCreateChatModalOpen(false)}
				onSuccess={handleChatCreated}
			/>

			<JoinChatModal
				isOpen={joinChatModalOpen}
				onClose={() => setJoinChatModalOpen(false)}
				onSuccess={handleChatJoined}
			/>
		</>
	);
}

export default App;
