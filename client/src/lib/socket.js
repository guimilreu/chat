import { io } from "socket.io-client";
import Cookies from "js-cookie";

// Cria socket, mas não conecta automaticamente
const socket = io("http://localhost:3000", {
	autoConnect: false,
	withCredentials: true,
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,
});

// Função para configurar autenticação do socket
export const setupSocketAuth = () => {
	const token = Cookies.get("token");
	if (token) {
		socket.auth = { token };

		// Adiciona token aos headers para permitir autenticação via headers também
		socket.io.opts.extraHeaders = {
			Authorization: `Bearer ${token}`,
		};

		// Reconectar se não estiver conectado
		if (!socket.connected) {
			socket.connect();
		}
	}
};

// Tentar reconectar quando estiver offline
socket.on("disconnect", () => {
	console.log("Socket desconectado, tentando reconectar...");
	const token = Cookies.get("token");
	if (token) {
		setTimeout(() => {
			if (!socket.connected) {
				socket.auth = { token };
				socket.connect();
			}
		}, 2000);
	}
});

// Interceptor de eventos de erro
socket.on("connect_error", (err) => {
	console.error("Socket connection error:", err.message);

	// Se for erro de autenticação, pode lidar aqui
	if (
		err.message === "Autenticação necessária" ||
		err.message === "Erro na autenticação"
	) {
		// Remover token inválido
		console.log("Erro de autenticação no socket");
	}
});

// Conexão bem-sucedida
socket.on("connect", () => {
	console.log("Socket conectado com sucesso!");
});

export default socket;
