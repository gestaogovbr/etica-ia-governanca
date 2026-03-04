"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { IconNames } from "@/types/menu";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import * as icones from "react-icons/hi2";

export default function ListaUsuarios() {
	const { showDialog } = UseDialog();
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	const [usuarios, setUsuarios] = useState<User[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [filtroBuscaGeral, setFiltroBuscaGeral] = useState("");
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [newUser, setNewUser] = useState<User>({
		admin: true,
		active: true,
		id: "",
		social_number: "",
		name: "",
		email: "",
		role: [],
		position: "",
		password: "",
	});

	function getIcone(iconName: IconNames) {
		const IconComponent = (icones as any)[iconName];
		if (!IconComponent) return null;
		return <IconComponent style={{ marginTop: 4, marginRight: 5 }} size={16} />;
	}

	const fetchUsuarios = async () => {
		try {
			const users = await fetchApi("admin", "GET");
			const resultado: any = await users.json();
			if (users.ok) setUsuarios(resultado);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		fetchUsuarios();
	}, []);

	const toggleModal = (user?: User) => {
		if (user) {
			setEditingUser(user);
		} else {
			setEditingUser(null);
			setNewUser({
				admin: true,
				active: true,
				id: "",
				social_number: "",
				name: "",
				email: "",
				role: [],
				position: "",
				password: "",
			});
		}
		setIsModalOpen(!isModalOpen);
	};

	const unificaPesquisa = (json: string) => {
		return json
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[\s.,;:!@#$%^&*()_+=[\]{}|\\/'"`~<>?¿¡-]/g, " ")
			.toUpperCase()
			.split(" ")
			.filter((word) => word);
	};

	const filtroBuscaPalavras = unificaPesquisa(filtroBuscaGeral);

	const handleDelete = async (id: string) => {
		showDialog(
			t("dlg.attention"),
			t("admins.delete"),
			"#1451B4",
			t("dlg.yes"),
			"error",
			async () => {
				try {
					const dadosProcesso = await fetchApi("admin/" + id, "DELETE");
					if (dadosProcesso.ok) fetchUsuarios();
				} catch (error) {
					console.log(error);
				}
			},
			true
		);
	};

	const handleSave = async () => {
		let method: "POST" | "PUT";
		let body: Partial<User> | null = null;

		if (editingUser) {
			method = "PUT";
			body = {
				name: editingUser.name,
				social_number: editingUser.social_number,
				email: editingUser.email,
				position: editingUser.position,
				...(editingUser.password ? { password: editingUser.password } : {}),
			};
		} else {
			method = "POST";
			body = {
				name: newUser!.name,
				social_number: newUser!.social_number,
				email: newUser!.email,
				position: newUser!.position,
				password: newUser!.password,
			};
		}

		try {
			const resp = await fetchApi(editingUser ? "admin/" + editingUser.id : "admin", method, body);
			if (resp.ok) {
				fetchUsuarios();
				showDialog(t("dlg.success"), t("dlg.saved"), "#1451B4", t("dlg.thanks"), "success", () => { });
			} else {
				showDialog(t("dlg.attention"), t("dlg.unableContinue"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
			}
		} catch (error) {
			console.log(error);
		}
		toggleModal();
	};

	const handleInputChange = (e: any) => {
		const { name, value, type, checked } = e.target;
		if (editingUser) {
			setEditingUser((prev) => (prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : null));
		} else {
			setNewUser((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value } as User));
		}
	};

	return (
		<DefaultLayout>
			<div className="p-4 sm:p-6">
				{/* Título + Busca + Adicionar */}
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<h1 className="text-xl text-[#1451B4] font-bold leading-tight md:flex-shrink-0">{t("admins.title")}</h1>

					<div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2 md:w-auto md:flex-nowrap">
						{/* campo de busca */}
						<div className="relative w-full md:w-80">
							<input
								type="text"
								value={filtroBuscaGeral}
								onChange={(e) => setFiltroBuscaGeral(e.target.value)}
								placeholder={t("common.search") ?? "Buscar em todos os campos..."}
								className="w-full rounded-md border border-gray-300 p-2 pr-9"
							/>
							{filtroBuscaGeral && (
								<button
									aria-label="Limpar busca"
									className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									onClick={() => setFiltroBuscaGeral("")}
								>
									{(icones as any).HiXMark?.({ size: 18 })}
								</button>
							)}
						</div>

						{/* botão adicionar */}
						<button
							className="br-button primary mr-3 w-full sm:w-auto justify-center"
							onClick={() => toggleModal()}
						>
							{t("common.add")} {t("admins")}
						</button>
					</div>
				</div>

				<div className="br-card">
					<div className="card-content">
						<div className="mt-4 overflow-x-auto -mx-4 sm:mx-0">
							<table className="card-content mt-3">
								<thead>
									<tr>
										<th className="py-2 px-4 border-b text-left">{t("admins.name")}</th>
										<th className="py-2 px-4 border-b text-left">{t("admins.email")}</th>
										<th className="py-2 px-4 border-b">{t("admins.created")}</th>
										<th className="py-2 px-4 border-b">{t("admins.lastAccess")}</th>
										<th className="py-2 px-4 border-b text-center">{t("admins.actions")}</th>
									</tr>
								</thead>
								<tbody className="divide-gray-200 divide-y bg-white dark:border-strokedark dark:bg-boxdark">
									{usuarios.map((usuario, index) => {
										const textoObjeto = JSON.stringify(usuario)
											.normalize("NFD")
											.replace(/[\u0300-\u036f]/g, "")
											.toUpperCase();

										if (
											(!filtroBuscaPalavras.length || filtroBuscaPalavras.every((word) => textoObjeto.includes(word))) &&
											usuario
										) {
											return (
												<tr key={index}>
													<td className="py-2 px-4">{usuario.name}</td>
													<td className="py-2 px-4">{usuario.email}</td>
													<td className="py-1 px-4 text-center text-sm whitespace-nowrap truncate">
														{usuario.date_created &&
															new Date(usuario.date_created).toLocaleString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															})}
													</td>
													<td className="py-1 px-4 text-center text-sm whitespace-nowrap truncate">
														{usuario.last_access &&
															new Date(usuario.last_access).toLocaleString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															})}
													</td>
													<td className="py-2 px-4">
														<button
															className="br-button circle mr-3"
															onClick={() => toggleModal(usuario)}
															title={t("common.edit")}
														>
															<i className="fas fa-edit"></i>
														</button>
														<button
															className="br-button circle"
															onClick={() => handleDelete(usuario.id)}
															title={t("common.delete")}
														>
															<i className="fas fa-trash"></i>
														</button>
													</td>
												</tr>
											);
										}
										return null;
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{isModalOpen && (
					<div
						style={{ zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
						className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[600px] max-w-[95vw]">
							<h2 className="text-xl font-bold mb-4">
								{editingUser ? `${t("common.edit")}` : `${t("common.add")}`}
							</h2>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
								<div className="sm:col-span-2">
									<label className="block mb-1">
										{t("admins.name")}
										<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="name"
										value={editingUser ? editingUser.name : newUser?.name}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="sm:col-span-2">
									<label className="block mb-1">
										{t("admins.email")}<b className="text-red"> *</b>
									</label>
									<input
										type="email"
										name="email"
										value={editingUser ? editingUser.email : newUser?.email}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div>
									<label className="block mb-1">
										{t("admins.position")}
										<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="position"
										value={editingUser ? editingUser.position : newUser?.position}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="sm:col-span-2">
									<label className="block mb-1">
										{t("admins.social_number")}
										<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="social_number"
										value={editingUser ? editingUser.social_number : newUser?.social_number}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div>
									<label className="block mb-1">
										{t("admins.password")}
										{!editingUser ? <b className="text-red"> *</b> : null}
									</label>
									<input
										type="text"
										name="password"
										value={editingUser ? editingUser.password : newUser?.password}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
									{editingUser && (
										<b className="text-red" style={{ fontSize: 12 }}>
											({t("admins.passOptional")})
										</b>
									)}
								</div>
							</div>

							<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
								<button
									className="br-button secondary mr-3 w-full sm:w-auto justify-center"
									onClick={() => toggleModal()}
								>
									{t("common.cancel")}
								</button>
								<button
									// style={{ background: "#1451B4" }}
									className="br-button primary mr-3 w-full sm:w-auto justify-center"
									onClick={handleSave}
								>
									{editingUser ? t("common.save") : t("common.add")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DefaultLayout>
	);
}
