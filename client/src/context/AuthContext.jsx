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
				const token = Cookies.get("token");
				if (token) {
					// Configure axios to use the token for all requests
					axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
					
					const res = await axios.get("/api/auth/me");
					if (res.data?.data) {
						setUser(res.data.data);

						// Conectar ao socket com token
						socket.auth = { token };
						socket.connect();
					}
				}
			} catch (err) {
				console.error("Erro ao verificar autenticação:", err);
				// Clear any invalid token
				Cookies.remove("token");
				delete axios.defaults.headers.common["Authorization"];
			} finally {
				setLoading(false);
			}
		};

		checkLoggedIn();
		
		// Add event listener for focus to recheck authentication when tab becomes active
		window.addEventListener('focus', checkLoggedIn);
		return () => window.removeEventListener('focus', checkLoggedIn);
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

			// Set Authorization header for subsequent requests
			const token = res.data.token || Cookies.get("token");
			if (token) {
				axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
			}
			
			// Salvar token no cookie (já feito pelo servidor)
			setUser(res.data.user);

			// Conectar ao socket com token
			socket.auth = { token };
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

			// Set Authorization header for subsequent requests
			const token = res.data.token || Cookies.get("token");
			if (token) {
				axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
			}
			
			// Salvar token no cookie (já feito pelo servidor)
			setUser(res.data.user);

			// Conectar ao socket com token
			socket.auth = { token };
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
			
			// Remove Authorization header
			delete axios.defaults.headers.common["Authorization"];

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
