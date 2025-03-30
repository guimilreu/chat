const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
	register,
	login,
	getMe,
	logout,
	updatePassword,
	updateAvatar
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Configuração do multer para armazenar os uploads na memória
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // limite de 5MB
	},
	fileFilter: (req, file, cb) => {
		// Aceitar apenas imagens
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Apenas imagens são permitidas'), false);
		}
	}
});

// Rotas de autenticação
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/logout", logout);

// Novas rotas para atualização de perfil
router.post("/update-password", protect, updatePassword);
router.post("/update-avatar", protect, upload.single('avatar'), updateAvatar);

module.exports = router;