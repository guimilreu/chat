import React, { useState, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, RotateCw, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "@/lib/axios";

const AvatarUpload = ({ currentAvatar, onAvatarUpdated }) => {
	const { user } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [zoom, setZoom] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	const fileInputRef = useRef(null);
	const imageContainerRef = useRef(null);

	// Função para selecionar arquivo
	const handleFileSelect = (event) => {
		const file = event.target.files[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			setError("Por favor, selecione uma imagem válida.");
			return;
		}

		setSelectedFile(file);
		const fileReader = new FileReader();
		fileReader.onload = () => {
			setPreviewUrl(fileReader.result);
			setIsEditing(true);
			setZoom(1);
			setPosition({ x: 0, y: 0 });
		};
		fileReader.readAsDataURL(file);
	};

	// Abrir seletor de arquivo
	const openFileSelector = () => {
		fileInputRef.current?.click();
	};

	// Cancelar edição
	const cancelEdit = () => {
		setIsEditing(false);
		setSelectedFile(null);
		setPreviewUrl("");
		setError("");
	};

	// Iniciar arrasto da imagem
	const startDrag = (e) => {
		setIsDragging(true);
		setDragStart({
			x: e.clientX - position.x,
			y: e.clientY - position.y,
		});
	};

	// Arrastar imagem
	const handleDrag = useCallback(
		(e) => {
			if (!isDragging) return;

			const containerRect =
				imageContainerRef.current?.getBoundingClientRect();
			if (!containerRect) return;

			const containerSize = Math.min(
				containerRect.width,
				containerRect.height
			);
			const maxOffset = (containerSize * zoom - containerSize) / 2;

			let newX = e.clientX - dragStart.x;
			let newY = e.clientY - dragStart.y;

			// Limitar o movimento para manter a imagem dentro da área visível
			newX = Math.max(Math.min(newX, maxOffset), -maxOffset);
			newY = Math.max(Math.min(newY, maxOffset), -maxOffset);

			setPosition({ x: newX, y: newY });
		},
		[isDragging, dragStart, zoom]
	);

	// Finalizar arrasto
	const endDrag = () => {
		setIsDragging(false);
	};

	// Efeitos para gerenciar eventos de arrasto
	React.useEffect(() => {
		if (isDragging) {
			window.addEventListener("mousemove", handleDrag);
			window.addEventListener("mouseup", endDrag);
		}

		return () => {
			window.removeEventListener("mousemove", handleDrag);
			window.removeEventListener("mouseup", endDrag);
		};
	}, [isDragging, handleDrag]);

	// Salvar avatar
	const saveAvatar = async () => {
		if (!selectedFile || !previewUrl) return;

		setLoading(true);
		setError("");

		try {
			// Criar um canvas para recortar a imagem
			const canvas = document.createElement("canvas");
			const img = new Image();
			img.src = previewUrl;

			await new Promise((resolve) => {
				img.onload = resolve;
			});

			const containerRect =
				imageContainerRef.current?.getBoundingClientRect();
			if (!containerRect) return;

			const containerSize = Math.min(
				containerRect.width,
				containerRect.height
			);
			canvas.width = containerSize;
			canvas.height = containerSize;

			const ctx = canvas.getContext("2d");

			// Limpar o canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Desenhar a imagem com zoom e posição
			const scaledSize = img.width / zoom;
			const sourceX =
				(img.width - scaledSize) / 2 -
				(position.x * img.width) / containerSize;
			const sourceY =
				(img.height - scaledSize) / 2 -
				(position.y * img.height) / containerSize;

			ctx.drawImage(
				img,
				sourceX,
				sourceY,
				scaledSize,
				scaledSize,
				0,
				0,
				canvas.width,
				canvas.height
			);

			// Converter canvas para blob
			const blob = await new Promise((resolve) =>
				canvas.toBlob(resolve, "image/jpeg", 0.9)
			);

			// Criar FormData para envio
			const formData = new FormData();
			formData.append("avatar", blob, "avatar.jpg");

			// Enviar para o servidor
			const response = await axios.post(
				"/api/auth/update-avatar",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				}
			);

			// Se o upload for bem-sucedido
			if (response.data.success) {
				// Notificar o componente pai
				onAvatarUpdated(response.data.avatarUrl);

				// Resetar estado
				setIsEditing(false);
				setSelectedFile(null);
				setPreviewUrl("");
			} else {
				setError(response.data.message || "Erro ao atualizar avatar");
			}
		} catch (error) {
			console.error("Erro ao atualizar avatar:", error);
			setError("Erro ao atualizar avatar. Tente novamente.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileSelect}
				accept="image/*"
				className="hidden"
			/>

			{error && (
				<div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md w-full">
					{error}
				</div>
			)}

			{isEditing ? (
				<>
					<div
						ref={imageContainerRef}
						className="w-40 h-40 rounded-full overflow-hidden relative bg-white border border-white/50 shadow-sm cursor-move"
						onMouseDown={startDrag}
					>
						<div
							className="absolute inset-0 bg-center bg-no-repeat"
							style={{
								backgroundImage: `url(${previewUrl})`,
								backgroundSize: `${zoom * 100}%`,
								transform: `translate(${position.x}px, ${position.y}px)`,
							}}
						/>
					</div>

					<div className="w-full px-2 flex items-center gap-2">
						<span className="text-xs">Zoom:</span>
						<Slider
							value={[zoom]}
							min={1}
							max={3}
							step={0.1}
							onValueChange={(values) => setZoom(values[0])}
							className="w-full"
						/>
					</div>

					<div className="flex gap-2 mt-2">
						<Button
							onClick={cancelEdit}
							variant="outline"
							className="rounded-full gap-1"
							disabled={loading}
						>
							<X className="h-4 w-4" />
							Cancelar
						</Button>
						<Button
							onClick={saveAvatar}
							className="rounded-full bg-blue-500 hover:bg-blue-600 gap-1 text-white"
							disabled={loading}
						>
							{loading ? (
								<RotateCw className="h-4 w-4 animate-spin" />
							) : (
								<Check className="h-4 w-4" />
							)}
							Salvar
						</Button>
					</div>
				</>
			) : (
				<>
					<div className="text-center text-zinc-700 text-sm">
						Sua foto de perfil atual
					</div>
					<Avatar className="w-32 h-32">
						<AvatarImage
							src={currentAvatar}
							alt={user?.username || ""}
						/>
						<AvatarFallback className="bg-blue-500 text-white text-2xl">
							{user?.username?.substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>

					<Button
						onClick={openFileSelector}
						className="rounded-full bg-blue-500 hover:bg-blue-600 text-white gap-1 mt-2"
					>
						<Camera className="h-4 w-4" />
						Alterar foto
					</Button>
				</>
			)}
		</div>
	);
};

export default AvatarUpload;
