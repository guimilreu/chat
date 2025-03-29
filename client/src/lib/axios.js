import axios from "axios";
import Cookies from "js-cookie";

const instance = axios.create({
	baseURL: "http://localhost:3000",
	withCredentials: true,
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
		return Promise.reject(error);
	}
);

export default instance;
