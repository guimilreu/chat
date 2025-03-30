// Componente para adicionar na sidebar do App.jsx

import { PlusCircle, LogIn } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

const ChatActions = ({ openCreateChatModal, openJoinChatModal }) => {
	return (
		<div className="flex items-center justify-between w-full gap-2 mb-2">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={openCreateChatModal}
							className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-full py-1.5 px-3 transition-colors duration-200"
						>
							<PlusCircle className="h-3.5 w-3.5" />
							Criar chat
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Criar um novo chat</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							onClick={openJoinChatModal}
							className="flex-1 flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-zinc-800 text-xs rounded-full py-1.5 px-3 transition-colors duration-200 border border-white/50"
						>
							<LogIn className="h-3.5 w-3.5" />
							Entrar
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Entrar em um chat com código</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
};

export default ChatActions;
