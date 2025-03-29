import { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import axios from "../lib/axios";
import socket from "../lib/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Verificar se o usuário já está autenticado ao carregar a página
	useEffect(() => {
		const checkLoggedIn = async () => {
			try {
				if (Cookies.get("token")) {
					const res = await axios.get("/api/auth/me");
					setUser(res.data.data);

					// Conectar ao socket com token
					socket.auth = { token: Cookies.get("token") };
					socket.connect();
				}
			} catch (err) {
				console.error("Erro ao verificar autenticação:", err);
				Cookies.remove("token");
			} finally {
				setLoading(false);
			}
		};

		checkLoggedIn();
	}, []);

	// Registrar usuário
	const register = async (username, password) => {
		try {
			setLoading(true);
			setError(null);

			const res = await axios.post("/api/auth/register", {
				username,
				password,
			});

			// Salvar token no cookie (já feito pelo servidor)
			setUser(res.data.user);

			// Conectar ao socket com token
			socket.auth = { token: res.data.token };
			socket.connect();

			return true;
		} catch (err) {
			setError(
				err.response?.data?.message || "Erro ao registrar usuário"
			);
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Login de usuário
	const login = async (username, password) => {
		try {
			setLoading(true);
			setError(null);

			const res = await axios.post("/api/auth/login", {
				username,
				password,
			});

			// Salvar token no cookie (já feito pelo servidor)
			setUser(res.data.user);

			// Conectar ao socket com token
			socket.auth = { token: res.data.token };
			socket.connect();

			return true;
		} catch (err) {
			setError(err.response?.data?.message || "Credenciais inválidas");
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Logout de usuário
	const logout = async () => {
		try {
			await axios.get("/api/auth/logout");

			// Remover token do cookie
			Cookies.remove("token");

			// Desconectar socket
			socket.emit("user disconnecting");
			socket.disconnect();

			setUser(null);
			return true;
		} catch (err) {
			console.error("Erro ao fazer logout:", err);
			return false;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				error,
				register,
				login,
				logout,
				isAuthenticated: !!user,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
