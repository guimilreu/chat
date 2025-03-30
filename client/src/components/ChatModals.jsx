// Novo componente: src/components/ChatModals.jsx

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Copy, Check, LogIn } from "lucide-react";
import socket from "../lib/socket";
import { useAuth } from "../context/AuthContext";

export const CreateChatModal = ({ isOpen, onClose, onSuccess }) => {
	const { user } = useAuth();
	const [chatName, setChatName] = useState("");
	const [loading, setLoading] = useState(false);
	const [inviteCode, setInviteCode] = useState("");
	const [copied, setCopied] = useState(false);
	const [step, setStep] = useState(1); // 1: Create chat form, 2: Success with invite code

	const handleCreateChat = async () => {
		if (!chatName.trim()) return;

		setLoading(true);

		// Emit socket event to create a new chat
		socket.emit("create chat", { name: chatName }, (response) => {
			setLoading(false);

			if (response.success) {
				// Set invite code and move to success step
				setInviteCode(response.inviteCode);
				setStep(2);

				// Emitir evento para atualizar lista de chats de todos os clientes
				socket.emit("refresh chats request");

				// If callback provided, call it with the new chat
				if (onSuccess) {
					onSuccess(response.chat);
				}
			} else {
				// Handle error (could add error state here)
				console.error("Error creating chat:", response.message);
			}
		});
	};

	const copyInviteCode = () => {
		navigator.clipboard.writeText(inviteCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleClose = () => {
		// Reset state when closing
		setChatName("");
		setInviteCode("");
		setStep(1);
		setCopied(false);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md rounded-3xl">
				{step === 1 ? (
					<>
						<DialogHeader>
							<DialogTitle>Criar um novo chat</DialogTitle>
							<DialogDescription>
								Crie um novo chat para conversar com outras
								pessoas.
							</DialogDescription>
						</DialogHeader>
						<div className="flex gap-2">
							<Input
								placeholder="Nome do chat"
								value={chatName}
								onChange={(e) => setChatName(e.target.value)}
								className="w-full font-mono rounded-full"
								disabled={loading}
							/>
							<Button
								onClick={handleCreateChat}
								disabled={!chatName.trim() || loading}
								className="rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
							>
								{loading ? "Criando..." : "Criar chat"}
							</Button>
						</div>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Chat criado com sucesso!</DialogTitle>
							<DialogDescription>
								Compartilhe o código abaixo para convidar outras
								pessoas para seu chat.
							</DialogDescription>
						</DialogHeader>
						<div className="flex items-center gap-2">
							<Input
								value={inviteCode}
								readOnly
								className="font-mono bg-zinc-100 select-all rounded-full"
							/>
							<Button
								size="icon"
								variant="outline"
								onClick={copyInviteCode}
								className="shrink-0 rounded-full bg-white/70 hover:bg-white text-zinc-800 transition-colors duration-200"
							>
								{copied ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

export const JoinChatModal = ({ isOpen, onClose, onSuccess }) => {
	const { user } = useAuth();
	const [inviteCode, setInviteCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleJoinChat = () => {
		if (!inviteCode.trim()) return;

		setLoading(true);
		setError("");

		// Emit socket event to join a chat by invite code
		socket.emit("join chat", { inviteCode }, (response) => {
			setLoading(false);

			if (response.success) {
				// Reset state and close modal
				setInviteCode("");
				onClose();

				// Emitir evento para atualizar lista de chats de todos os clientes
				socket.emit("refresh chats request");

				// If callback provided, call it with the joined chat
				if (onSuccess) {
					onSuccess(response.chat);
				}
			} else {
				// Handle error
				setError(response.message || "Código de convite inválido");
				console.error("Error joining chat:", response.message);
			}
		});
	};

	const handleClose = () => {
		setInviteCode("");
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md rounded-3xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-xl">
						Entrar em um chat
					</DialogTitle>
					<DialogDescription>
						Digite o código de convite para entrar em um chat.
						{error && (
							<p className="text-red-500 mt-2 text-sm font-medium">
								{error}
							</p>
						)}
					</DialogDescription>
				</DialogHeader>
				<div className="flex gap-2">
					<Input
						placeholder="Código de convite"
						value={inviteCode}
						onChange={(e) => setInviteCode(e.target.value)}
						className="w-full font-mono rounded-full"
						disabled={loading}
					/>
					<Button
						onClick={handleJoinChat}
						disabled={!inviteCode.trim() || loading}
						className="rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
					>
						<LogIn className="h-3.5 w-3.5" />
						{loading ? "Entrando..." : "Entrar"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
