import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCw, Check, LockKeyhole, Eye, EyeOff, User } from "lucide-react";
import axios from "@/lib/axios";

const PasswordChangeForm = () => {
	const { user } = useAuth();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const resetForm = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Reset states
		setError("");
		setSuccess(false);

		// Validações
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError("Todos os campos são obrigatórios");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("As senhas não coincidem");
			return;
		}

		if (newPassword.length < 6) {
			setError("A nova senha deve ter pelo menos 6 caracteres");
			return;
		}

		setLoading(true);

		try {
			const response = await axios.post("/api/auth/update-password", {
				currentPassword,
				newPassword,
			});

			if (response.data.success) {
				setSuccess(true);
				resetForm();

				// Limpar mensagem de sucesso após 3s
				setTimeout(() => {
					setSuccess(false);
				}, 3000);
			} else {
				setError(response.data.message || "Erro ao atualizar senha");
			}
		} catch (error) {
			console.error("Erro ao atualizar senha:", error);
			setError(
				error.response?.data?.message ||
					"Erro ao atualizar senha. Verifique sua senha atual."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{error && (
				<div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">
					{error}
				</div>
			)}

			{success && (
				<div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-md flex items-center justify-center gap-1">
					<Check className="h-4 w-4" />
					Senha atualizada com sucesso!
				</div>
			)}

			<div className="space-y-1.5">
				<Label htmlFor="username" className="text-zinc-800">
					Nome de usuário
				</Label>
				<div className="relative">
					<Input
						id="username"
						value={user?.username || ""}
						disabled
						className="pl-8 rounded-full bg-white/50 border-white/60"
					/>
					<User className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
				</div>
				<p className="text-xs text-zinc-500 ml-2">
					O nome de usuário não pode ser alterado
				</p>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="current-password" className="text-zinc-800">
					Senha atual
				</Label>
				<div className="relative">
					<Input
						id="current-password"
						type={showCurrentPassword ? "text" : "password"}
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						className="pl-8 pr-10 rounded-full bg-white/50 border-white/60"
					/>
					<LockKeyhole className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
					<button
						type="button"
						onClick={() =>
							setShowCurrentPassword(!showCurrentPassword)
						}
						className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-800"
					>
						{showCurrentPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="new-password" className="text-zinc-800">
					Nova senha
				</Label>
				<div className="relative">
					<Input
						id="new-password"
						type={showNewPassword ? "text" : "password"}
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						className="pl-8 pr-10 rounded-full bg-white/50 border-white/60"
					/>
					<LockKeyhole className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
					<button
						type="button"
						onClick={() => setShowNewPassword(!showNewPassword)}
						className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-800"
					>
						{showNewPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="confirm-password" className="text-zinc-800">
					Confirmar nova senha
				</Label>
				<div className="relative">
					<Input
						id="confirm-password"
						type={showConfirmPassword ? "text" : "password"}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="pl-8 pr-10 rounded-full bg-white/50 border-white/60"
					/>
					<LockKeyhole className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
					<button
						type="button"
						onClick={() =>
							setShowConfirmPassword(!showConfirmPassword)
						}
						className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-800"
					>
						{showConfirmPassword ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			<Button
				type="submit"
				disabled={loading}
				className="rounded-full bg-blue-500 hover:bg-blue-600 text-white gap-1 mt-2 self-center px-6"
			>
				{loading ? (
					<>
						<RotateCw className="h-4 w-4 animate-spin" />
						Atualizando...
					</>
				) : (
					<>
						<Check className="h-4 w-4" />
						Atualizar senha
					</>
				)}
			</Button>
		</form>
	);
};

export default PasswordChangeForm;
