"use client"

export const fetchApi = async (
	endpoint: string,
	metodo: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	body?: any,
	location?: any
) => {
	const url_base_api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/";
	const url = endpoint.startsWith("http") ? endpoint : `${url_base_api}${endpoint}`;
	const token = localStorage.getItem("token") ?? "";

	const headers: Record<string, string> = {
		"Content-Type": "application/json"
	};

	if (location) headers["location"] = `${location.lat},${location.long}`;
	if (token) headers["Authorization"] = `Bearer ${token}`;

	const config: RequestInit = { method: metodo, headers };

	if (["POST", "PUT"].includes(metodo) && body)
		config.body = JSON.stringify(body);

	try {
		const response = await fetch(url, config);
		return response;
	} catch (error) {
		console.error("Erro ao fazer a chamada da API:", error);
		throw error;
	}
};
