const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || "gmdev-chat-secret-key";

// Middleware para proteger rotas com JWT
exports.protect = async (req, res, next) => {
	let token;

	// Verificar se o token está nos headers ou nos cookies
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		// Obter token do header Authorization
		token = req.headers.authorization.split(" ")[1];
	} else if (req.cookies.token) {
		// Obter token dos cookies
		token = req.cookies.token;
	}

	// Verificar se o token existe
	if (!token) {
		return res.status(401).json({
			success: false,
			message: "Acesso não autorizado",
		});
	}

	try {
		// Verificar o token
		const decoded = jwt.verify(token, JWT_SECRET);

		// Adicionar usuário decodificado à requisição
		req.user = decoded;
		next();
	} catch (error) {
		console.error("Erro ao verificar token:", error);
		return res.status(401).json({
			success: false,
			message: "Acesso não autorizado",
		});
	}
};

// Middleware para verificar token em socket.io
exports.verifySocketToken = async (socket, next) => {
	try {
		const token =
			socket.handshake.auth.token ||
			socket.handshake.headers.authorization?.split(" ")[1] ||
			socket.handshake.headers.cookie?.split("token=")[1]?.split(";")[0];

		if (!token) {
			return next(new Error("Autenticação necessária"));
		}

		const decoded = jwt.verify(token, JWT_SECRET);

		// Encontrar usuário pelo ID
		const user = await User.findById(decoded.id).select("-password");

		if (!user) {
			return next(new Error("Usuário não encontrado"));
		}

		// Salvar informações do usuário no objeto socket
		socket.user = {
			id: user._id,
			username: user.username,
		};

		next();
	} catch (error) {
		console.error("Erro na autenticação do socket:", error);
		next(new Error("Erro na autenticação"));
	}
};
