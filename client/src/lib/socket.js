import { io } from "socket.io-client";
import Cookies from "js-cookie";

// Cria socket, mas não conecta automaticamente
const socket = io("http://localhost:3000", {
	autoConnect: false,
	withCredentials: true,
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
	}
};

// Interceptor de eventos de erro
socket.on("connect_error", (err) => {
	console.error("Socket connection error:", err.message);

	// Se for erro de autenticação, pode lidar aqui
	if (
		err.message === "Autenticação necessária" ||
		err.message === "Erro na autenticação"
	) {
		// Talvez redirecionar para login ou tentar reconectar
		console.log("Erro de autenticação no socket");
	}
});

export default socket;
