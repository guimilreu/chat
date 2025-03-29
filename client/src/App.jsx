import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";

function App() {
	const [authMode, setAuthMode] = useState("login"); // 'login' ou 'register'
	const { isAuthenticated, loading } = useAuth();

	const switchToRegister = () => setAuthMode("register");
	const switchToLogin = () => setAuthMode("login");

	if (loading) {
		return (
			<div className="flex mx-auto w-2/5 h-screen min-h-screen p-12">
				<div className="flex flex-col gap-4 justify-center items-center w-full h-full rounded-3xl border border-white/50 shadow-xl bg-white/50 backdrop-blur-lg p-6">
					<div className="text-xl font-medium text-zinc-900 animate-pulse">
						Carregando...
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mx-auto w-full h-screen min-h-screen p-12 gap-4">
				<div className={`${isAuthenticated ? "w-3/5" : "w-2/5"} flex flex-col gap-4 justify-between h-full rounded-3xl border border-white/50 shadow-xl bg-white/50 backdrop-blur-lg p-6`}>
					{!isAuthenticated ? (
						authMode === "login" ? (
							<Login switchToRegister={switchToRegister} />
						) : (
							<Register switchToLogin={switchToLogin} />
						)
					) : (
						<Chat />
					)}
				</div>
			</div>
		</>
	);
}

export default App;
