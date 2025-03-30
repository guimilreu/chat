const User = require("../models/User");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || "gmdev-chat-secret-key";
// Tempo de expiração do token (3 dias)
const JWT_EXPIRES = "3d";

// Criar e enviar token JWT como cookie
const sendTokenResponse = (user, statusCode, res) => {
	// Criar token
	const token = jwt.sign(
		{ id: user._id, username: user.username },
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES }
	);

	// Configuração do cookie
	const cookieOptions = {
		expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
		httpOnly: false, // Permitir acesso via JavaScript
		secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
		sameSite: "lax", // Menos restritivo para funcionar com recargas de página
		path: "/", // Disponível em todo o site
	};

	// Enviar cookie com token
	res.status(statusCode)
		.cookie("token", token, cookieOptions)
		.json({
			success: true,
			token,
			user: {
				id: user._id,
				username: user.username,
				avatarUrl: user.avatarUrl,
			},
		});
};

// Registro de usuário
exports.register = async (req, res, next) => {
	try {
		const { username, password } = req.body;

		// Verificar se o usuário já existe
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Nome de usuário já está em uso",
			});
		}

		// Criar novo usuário
		const user = await User.create({
			username,
			password,
		});

		// Enviar token de resposta
		sendTokenResponse(user, 201, res);
	} catch (error) {
		console.error("Erro ao registrar usuário:", error);
		res.status(500).json({
			success: false,
			message: "Erro ao registrar usuário",
		});
	}
};

// Login de usuário
exports.login = async (req, res, next) => {
	try {
		const { username, password } = req.body;

		// Validar username e senha
		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: "Por favor, forneça nome de usuário e senha",
			});
		}

		// Verificar se o usuário existe
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Credenciais inválidas",
			});
		}

		// Verificar se a senha corresponde
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Credenciais inválidas",
			});
		}

		// Enviar token de resposta
		sendTokenResponse(user, 200, res);
	} catch (error) {
		console.error("Erro ao fazer login:", error);
		res.status(500).json({
			success: false,
			message: "Erro ao fazer login",
		});
	}
};

// Obter usuário atual
exports.getMe = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Usuário não encontrado",
			});
		}

		res.status(200).json({
			success: true,
			data: {
				id: user._id,
				username: user.username,
				avatarUrl: user.avatarUrl,
			},
		});
	} catch (error) {
		console.error("Erro ao obter usuário atual:", error);
		res.status(500).json({
			success: false,
			message: "Erro ao obter usuário atual",
		});
	}
};

// Logout (limpar cookie)
exports.logout = (req, res, next) => {
	res.cookie("token", "", {
		expires: new Date(Date.now() + 10 * 1000), // Expira em 10 segundos
		httpOnly: false,
		path: "/",
	});

	res.status(200).json({
		success: true,
		message: "Logout realizado com sucesso",
	});
};

// Atualizar senha do usuário
exports.updatePassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;

		// Verificar se as senhas foram fornecidas
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "Senha atual e nova senha são obrigatórias",
			});
		}

		// Verificar se a nova senha tem o tamanho mínimo
		if (newPassword.length < 6) {
			return res.status(400).json({
				success: false,
				message: "A nova senha deve ter pelo menos 6 caracteres",
			});
		}

		// Buscar usuário por ID incluindo a senha
		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Usuário não encontrado",
			});
		}

		// Verificar se a senha atual está correta
		const isMatch = await user.comparePassword(currentPassword);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Senha atual incorreta",
			});
		}

		// Atualizar senha
		user.password = newPassword;
		await user.save();

		res.status(200).json({
			success: true,
			message: "Senha atualizada com sucesso",
		});
	} catch (error) {
		console.error("Erro ao atualizar senha:", error);
		res.status(500).json({
			success: false,
			message: "Erro ao atualizar senha",
		});
	}
};

// Atualizar avatar do usuário
exports.updateAvatar = async (req, res, next) => {
	try {
		// Verificar se o arquivo foi enviado
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "Nenhuma imagem enviada",
			});
		}

		const userId = req.user.id;

		// Criar diretório de upload se não existir
		const uploadDir = path.join(__dirname, "../uploads/avatars");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Gerar nome de arquivo único baseado no ID do usuário
		const fileExt = path.extname(req.file.originalname);
		const fileName = `${userId}-${Date.now()}${fileExt}`;
		const filePath = path.join(uploadDir, fileName);

		// Salvar o arquivo
		fs.writeFileSync(filePath, req.file.buffer);

		// Caminho relativo para acesso via URL
		const avatarUrl = `/uploads/avatars/${fileName}`;

		// Atualizar usuário no banco de dados
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Usuário não encontrado",
			});
		}

		// Remover avatar antigo se existir
		if (user.avatarUrl) {
			const oldAvatarPath = path.join(__dirname, "..", user.avatarUrl);
			if (fs.existsSync(oldAvatarPath)) {
				fs.unlinkSync(oldAvatarPath);
			}
		}

		// Atualizar URL do avatar
		user.avatarUrl = avatarUrl;
		await user.save();

		res.status(200).json({
			success: true,
			avatarUrl,
			message: "Avatar atualizado com sucesso",
		});
	} catch (error) {
		console.error("Erro ao atualizar avatar:", error);
		res.status(500).json({
			success: false,
			message: "Erro ao atualizar avatar",
		});
	}
};
