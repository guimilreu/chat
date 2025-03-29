import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowUp } from "lucide-react";

const Register = ({ switchToLogin }) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [inputFocused, setInputFocused] = useState(false);
	const [passwordFocused, setPasswordFocused] = useState(false);
	const [confirmFocused, setConfirmFocused] = useState(false);
	const [formError, setFormError] = useState("");
	const { register, loading, error } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();

		setFormError("");

		// Validações básicas
		if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
			setFormError("Todos os campos são obrigatórios");
			return;
		}

		if (username.length < 3) {
			setFormError("Nome de usuário deve ter pelo menos 3 caracteres");
			return;
		}

		if (password.length < 6) {
			setFormError("Senha deve ter pelo menos 6 caracteres");
			return;
		}

		if (password !== confirmPassword) {
			setFormError("As senhas não coincidem");
			return;
		}

		await register(username, password);
	};

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-4">
			<div className="text-xl font-medium text-zinc-900 animate-fade-in">
				Criar conta
			</div>

			{(error || formError) && (
				<div className="text-red-500 text-sm animate-fade-in">
					{formError || error}
				</div>
			)}

			<form
				onSubmit={handleSubmit}
				className="w-full flex flex-col items-center gap-3"
			>
				<label
					htmlFor="register-username"
					className={`w-2/3 rounded-full h-12 ${
						inputFocused ? "bg-white/60" : "bg-white/50"
					} overflow-hidden flex items-center justify-between gap-2 pr-4 transition-colors duration-200 animate-fade-in`}
					style={{
						animationDelay: "0.1s",
					}}
				>
					<input
						id="register-username"
						type="text"
						className="border-none outline-none w-full h-full pl-4 text-sm bg-transparent"
						placeholder="Nome de usuário"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						onFocus={() => setInputFocused(true)}
						onBlur={() => setInputFocused(false)}
						disabled={loading}
					/>
				</label>

				<label
					htmlFor="register-password"
					className={`w-2/3 rounded-full h-12 ${
						passwordFocused ? "bg-white/60" : "bg-white/50"
					} overflow-hidden flex items-center justify-between gap-2 pr-4 transition-colors duration-200 animate-fade-in`}
					style={{
						animationDelay: "0.2s",
					}}
				>
					<input
						id="register-password"
						type="password"
						className="border-none outline-none w-full h-full pl-4 text-sm bg-transparent"
						placeholder="Senha"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onFocus={() => setPasswordFocused(true)}
						onBlur={() => setPasswordFocused(false)}
						disabled={loading}
					/>
				</label>

				<label
					htmlFor="confirm-password"
					className={`w-2/3 rounded-full h-12 ${
						confirmFocused ? "bg-white/60" : "bg-white/50"
					} overflow-hidden flex items-center justify-between gap-2 pr-4 transition-colors duration-200 animate-fade-in`}
					style={{
						animationDelay: "0.3s",
					}}
				>
					<input
						id="confirm-password"
						type="password"
						className="border-none outline-none w-full h-full pl-4 text-sm bg-transparent"
						placeholder="Confirmar senha"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						onFocus={() => setConfirmFocused(true)}
						onBlur={() => setConfirmFocused(false)}
						disabled={loading}
					/>
				</label>

				<button
					type="submit"
					disabled={loading}
					className="animate-fade-in w-2/3 rounded-full h-12 mt-2 bg-blue-500 text-white font-medium flex items-center justify-center transition hover:bg-blue-600 cursor-pointer duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
					style={{
						animationDelay: "0.4s",
					}}
				>
					{loading ? "Registrando..." : "Registrar"}
				</button>
			</form>

			<div
				className="text-sm text-zinc-700 mt-2 animate-fade-in"
				style={{
					animationDelay: "0.5s",
				}}
			>
				Já tem uma conta?{" "}
				<button
					onClick={switchToLogin}
					className="text-blue-500 hover:underline"
					disabled={loading}
				>
					Entrar
				</button>
			</div>
		</div>
	);
};

export default Register;
