import axios from "axios";
import Cookies from "js-cookie";

const instance = axios.create({
	baseURL: "http://localhost:3000",
	withCredentials: true, // Importante para enviar e receber cookies
	timeout: 10000, // Timeout de 10 segundos
});

// Interceptor para incluir o token JWT em todas as requisições
instance.interceptors.request.use(
	(config) => {
		// Obter token do cookie
		const token = Cookies.get("token");

		// Se o token existir, adicioná-lo aos cabeçalhos
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		console.error("Erro na requisição:", error);
		return Promise.reject(error);
	}
);

// Interceptor para tratar respostas
instance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Se o erro for 401 (não autorizado), limpar o token
		if (error.response && error.response.status === 401) {
			Cookies.remove("token");
		}

		return Promise.reject(error);
	}
);

export default instance;
