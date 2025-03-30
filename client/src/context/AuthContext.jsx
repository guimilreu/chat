import { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import axios from "../lib/axios";
import socket from "../lib/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Verificar se o usuário já está autenticado ao carregar a página
	useEffect(() => {
		async function loadUserFromCookie() {
			console.log("Verificando autenticação...");
			setLoading(true);
			
			try {
				// Verifica se existe um token nos cookies
				const token = Cookies.get("token");
				console.log("Token encontrado:", !!token);
				
				if (!token) {
					console.log("Nenhum token encontrado, usuário não autenticado");
					setIsAuthenticated(false);
					setUser(null);
					setLoading(false);
					return;
				}
				
				// Configura o token para todas as requisições
				axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
				
				// Conecta ao socket com o token
				socket.auth = { token };
				socket.connect();
				
				// Busca informações do usuário
				const response = await axios.get("/api/auth/me");
				console.log("Resposta da API:", response.data);
				
				if (response.data.success && response.data.data) {
					console.log("Usuário autenticado:", response.data.data);
					setUser(response.data.data);
					setIsAuthenticated(true);
				} else {
					// Se a resposta não contiver dados do usuário, limpa a autenticação
					console.log("Autenticação falhou: resposta sem dados");
					Cookies.remove("token");
					delete axios.defaults.headers.common["Authorization"];
					socket.disconnect();
					setIsAuthenticated(false);
					setUser(null);
				}
			} catch (error) {
				console.error("Erro ao verificar autenticação:", error);
				// Em caso de erro, limpa a autenticação
				Cookies.remove("token");
				delete axios.defaults.headers.common["Authorization"];
				socket.disconnect();
				setIsAuthenticated(false);
				setUser(null);
			} finally {
				setLoading(false);
			}
		}

		loadUserFromCookie();
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

			if (res.data.success && res.data.token) {
				// Define o token nos cookies manualmente para garantir
				Cookies.set("token", res.data.token, { 
					expires: 3, // 3 dias
					secure: process.env.NODE_ENV === "production", 
					sameSite: "strict"
				});
				
				// Define o header de autorização
				axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
				
				// Atualiza o estado
				setUser(res.data.user);
				setIsAuthenticated(true);

				// Conecta ao socket
				socket.auth = { token: res.data.token };
				socket.connect();

				return true;
			} else {
				throw new Error(res.data.message || "Erro ao registrar");
			}
		} catch (err) {
			console.error("Erro de registro:", err);
			setError(
				err.response?.data?.message || err.message || "Erro ao registrar usuário"
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

			if (res.data.success && res.data.token) {
				// Define o token nos cookies manualmente para garantir
				Cookies.set("token", res.data.token, { 
					expires: 3, // 3 dias
					secure: process.env.NODE_ENV === "production", 
					sameSite: "strict"
				});
				
				// Define o header de autorização
				axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
				
				// Atualiza o estado
				setUser(res.data.user);
				setIsAuthenticated(true);

				// Conecta ao socket
				socket.auth = { token: res.data.token };
				socket.connect();

				return true;
			} else {
				throw new Error(res.data.message || "Credenciais inválidas");
			}
		} catch (err) {
			console.error("Erro de login:", err);
			setError(err.response?.data?.message || err.message || "Credenciais inválidas");
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Logout de usuário
	const logout = async () => {
		try {
			// Chama a API de logout (mesmo se falhar, continua o processo de logout)
			await axios.get("/api/auth/logout").catch(err => console.error("Erro na API de logout:", err));

			// Desconecta socket
			socket.emit("user disconnecting");
			socket.disconnect();
			
			// Remove token do cookie
			Cookies.remove("token");
			
			// Remove Authorization header
			delete axios.defaults.headers.common["Authorization"];

			// Limpa estado
			setUser(null);
			setIsAuthenticated(false);
			
			return true;
		} catch (err) {
			console.error("Erro ao fazer logout:", err);
			return false;
		}
	};

	// Fornece função para verificar autenticação externamente
	const checkAuth = async () => {
		try {
			const token = Cookies.get("token");
			if (!token) return false;
			
			const res = await axios.get("/api/auth/me");
			return !!(res.data?.success && res.data?.data);
		} catch (err) {
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
				checkAuth,
				isAuthenticated,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

export default AuthContext;