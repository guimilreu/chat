import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowUp } from "lucide-react";

const Login = ({ switchToRegister }) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [inputFocused, setInputFocused] = useState(false);
	const [passwordFocused, setPasswordFocused] = useState(false);
	const { login, loading, error } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (username.trim() && password.trim()) {
			await login(username, password);
		}
	};

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-4">
			<div className="text-xl font-medium text-zinc-900 animate-fade-in">
				Entrar no chat
			</div>

			{error && (
				<div className="text-red-500 text-sm animate-fade-in">
					{error}
				</div>
			)}

			<form
				onSubmit={handleSubmit}
				className="w-full flex flex-col items-center gap-3"
			>
				<label
					htmlFor="username"
					className={`w-2/3 rounded-full h-12 ${
						inputFocused ? "bg-white/60" : "bg-white/50"
					} overflow-hidden flex items-center justify-between gap-2 pr-4 transition-colors duration-200 animate-fade-in`}
					style={{
						animationDelay: "0.1s",
					}}
				>
					<input
						id="username"
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
					htmlFor="password"
					className={`w-2/3 rounded-full h-12 ${
						passwordFocused ? "bg-white/60" : "bg-white/50"
					} overflow-hidden flex items-center justify-between gap-2 pr-4 transition-colors duration-200 animate-fade-in`}
					style={{
						animationDelay: "0.2s",
					}}
				>
					<input
						id="password"
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

				<button
					type="submit"
					disabled={loading}
					className="animate-fade-in w-2/3 rounded-full h-12 mt-2 bg-blue-500 text-white font-medium flex items-center justify-center transition hover:bg-blue-600 cursor-pointer duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
					style={{
						animationDelay: "0.3s",
					}}
				>
					{loading ? "Entrando..." : "Entrar"}
				</button>
			</form>

			<div
				className="text-sm text-zinc-700 mt-2 animate-fade-in"
				style={{
					animationDelay: "0.4s",
				}}
			>
				Não tem uma conta?{" "}
				<button
					onClick={switchToRegister}
					className="text-blue-500 hover:underline"
					disabled={loading}
				>
					Registre-se
				</button>
			</div>
		</div>
	);
};

export default Login;
