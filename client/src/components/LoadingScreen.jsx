// src/components/LoadingScreen.jsx

const LoadingScreen = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full w-full">
			<div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full border-t-transparent animate-spin"></div>
			<p className="mt-4 text-zinc-700 font-medium">Carregando...</p>
		</div>
	);
};

export default LoadingScreen;
