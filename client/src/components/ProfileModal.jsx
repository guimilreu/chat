import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import AvatarUpload from "./AvatarUpload";
import PasswordChangeForm from "./PasswordChangeForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Key } from "lucide-react";

const ProfileModal = ({ isOpen, onClose }) => {
	const { user, updateAvatar } = useAuth();
	const [activeTab, setActiveTab] = useState("profile");
	const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

	// Atualizar o avatar se o usuário mudar
	useEffect(() => {
		if (user?.avatarUrl) {
			setAvatarUrl(user.avatarUrl);
		}
	}, [user]);

	const handleAvatarUpdated = (newAvatarUrl) => {
		setAvatarUrl(newAvatarUrl);
		// A função updateAvatar deve estar disponível no contexto de autenticação
		updateAvatar(newAvatarUrl);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md rounded-3xl">
				<DialogHeader>
					<DialogTitle className="text-xl font-medium">
						Meu perfil
					</DialogTitle>
					<DialogDescription>
						Gerencie suas informações pessoais
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<Avatar className="w-24 h-24 mb-2">
							<AvatarImage
								src={avatarUrl}
								alt={user?.username || ""}
							/>
							<AvatarFallback className="bg-blue-500 text-white text-xl">
								{user?.username?.substring(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<h3 className="text-lg font-medium">
							{user?.username}
						</h3>
						<Badge
							variant="outline"
							className="mt-1 bg-white/70 text-zinc-700"
						>
							Usuário
						</Badge>
					</div>

					<Tabs
						defaultValue="profile"
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid grid-cols-2 w-full rounded-full bg-white/50 p-1">
							<TabsTrigger
								value="profile"
								className="rounded-full data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-800 flex items-center gap-1"
							>
								<User className="h-3.5 w-3.5" />
								Perfil
							</TabsTrigger>
							<TabsTrigger
								value="security"
								className="rounded-full data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-800 flex items-center gap-1"
							>
								<Key className="h-3.5 w-3.5" />
								Segurança
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="profile"
							className="mt-4 focus-visible:outline-none focus-visible:ring-0"
						>
							<AvatarUpload
								currentAvatar={avatarUrl}
								onAvatarUpdated={handleAvatarUpdated}
							/>
						</TabsContent>
						<TabsContent
							value="security"
							className="mt-4 focus-visible:outline-none focus-visible:ring-0"
						>
							<PasswordChangeForm />
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ProfileModal;
