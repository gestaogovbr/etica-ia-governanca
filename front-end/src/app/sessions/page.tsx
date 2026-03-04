"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { IconNames } from "@/types/menu";
import { useEffect, useState } from "react";
import * as icones from "react-icons/hi2";

type Session = {
	id: number | string;
	code: string;
	name: string;
	description: string;
	priority: number;
	ethical_principles: string;
	active: boolean;
	is_triage?: boolean;
	is_testing?: boolean;
	next_session_code?: string | null;
	triage_config?: {
		levels: TriageLevel[];
	} | null;
	date_created?: string;
	date_updated?: string;
};

type TriageLevel = {
	key: string;
	label: string;
	min_score: number;
	next_session_code?: string | null;
};

const getTriageLevelDefs = (t: (k: string) => string): Array<{ key: string; label: string }> => [
	{ key: "low", label: t("sessions.triage.level.low") },
	{ key: "medium", label: t("sessions.triage.level.medium") },
	{ key: "advanced", label: t("sessions.triage.level.advanced") },
	{ key: "excessive", label: t("sessions.triage.level.excessive") },
];

const buildDefaultTriageConfig = (t: (k: string) => string): { levels: TriageLevel[] } => ({
	levels: getTriageLevelDefs(t).map((level) => ({
		key: level.key,
		label: level.label,
		min_score:
			level.key === "low" ? 0 : level.key === "medium" ? 12 : level.key === "advanced" ? 25 : 40,
		next_session_code: "",
	})),
});

const normalizeTriageConfig = (t: (k: string) => string, config?: Session["triage_config"] | null) => {
	const existing = new Map<string, TriageLevel>();
	config?.levels?.forEach((level) => existing.set(level.key, level));
	return {
		levels: getTriageLevelDefs(t).map((def) => {
			const current = existing.get(def.key);
			return {
				key: def.key,
				label: def.label,
				min_score: current?.min_score ?? 0,
				next_session_code: current?.next_session_code ?? "",
			};
		}),
	};
};

export default function ListaSessoes() {
	const { showDialog } = UseDialog();
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	const [sessoes, setSessoes] = useState<Session[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [filtroBuscaGeral, setFiltroBuscaGeral] = useState("");
	const [editingSession, setEditingSession] = useState<Session | null>(null);
	const [newSession, setNewSession] = useState<Session>({
		id: "",
		code: "",
		name: "",
		description: "",
		priority: 0,
		ethical_principles: "",
		active: true,
		is_triage: false,
		is_testing: false,
		next_session_code: "",
		triage_config: buildDefaultTriageConfig(t),
	});

	function getIcone(iconName: IconNames) {
		const IconComponent = (icones as any)[iconName];
		if (!IconComponent) return null;
		return <IconComponent size={16} />;
	}

	const fetchSessoes = async () => {
		try {
			const res = await fetchApi("sessions", "GET");
			const json = await res.json();
			if (res.ok) setSessoes(json);
		} catch (e) {
			console.log(e);
		}
	};

	useEffect(() => {
		fetchSessoes();
	}, []);

	const toggleModal = (sess?: Session) => {
		if (sess) {
			setEditingSession({
				...sess,
				triage_config: normalizeTriageConfig(t, sess.triage_config),
			});
		} else {
			setEditingSession(null);
			setNewSession({
				id: "",
				code: "",
				name: "",
				description: "",
				priority: 0,
				ethical_principles: "",
				active: true,
				is_triage: false,
				is_testing: false,
				next_session_code: "",
				triage_config: buildDefaultTriageConfig(t),
			});
		}
		setIsModalOpen(!isModalOpen);
	};

	const formSession = editingSession ?? newSession;

	const unificaPesquisa = (json: string) => {
		return json
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[\s.,;:!@#$%^&*()_+=[\]{}|\\/'"`~<>?¿¡-]/g, " ")
			.toUpperCase()
			.split(" ")
			.filter((w) => w);
	};

	const filtroBuscaPalavras = unificaPesquisa(filtroBuscaGeral);

	const handleDelete = async (id: string | number) => {
		showDialog(
			t("dlg.attention"),
			t("sessions.delete"),
			"#1451B4",
			t("dlg.yes"),
			"error",
			async () => {
				try {
					const res = await fetchApi(`sessions/${id}`, "DELETE");
					if (res.ok) await fetchSessoes();
				} catch (e) {
					console.log(e);
				}
			},
			true
		);
	};

	const handleSave = async () => {
		let method: "POST" | "PUT";
		let url: string;
		let body: Partial<Session>;

		const cleanedNextSessionCode = (editingSession ?? newSession).next_session_code?.trim() || null;

		if (editingSession) {
			method = "PUT";
			url = `sessions/${editingSession.id}`;
			body = {
				code: editingSession.code,
				name: editingSession.name,
				description: editingSession.description,
				priority: Number(editingSession.priority) || 0,
				ethical_principles: editingSession.ethical_principles,
				active: !!editingSession.active,
				is_triage: !!editingSession.is_triage,
				is_testing: !!editingSession.is_testing,
				// Permite definir próximo passo mesmo para sessões de triagem
				next_session_code: cleanedNextSessionCode,
				triage_config: editingSession.is_triage ? editingSession.triage_config : null,
			};
		} else {
			method = "POST";
			url = "sessions";
			body = {
				code: newSession.code,
				name: newSession.name,
				description: newSession.description,
				priority: Number(newSession.priority) || 0,
				ethical_principles: newSession.ethical_principles,
				active: !!newSession.active,
				is_triage: !!newSession.is_triage,
				is_testing: !!newSession.is_testing,
				// Permite definir próximo passo mesmo para sessões de triagem
				next_session_code: cleanedNextSessionCode,
				triage_config: newSession.is_triage ? newSession.triage_config : null,
			};
		}

		try {
			const res = await fetchApi(url, method, body);
			if (res.ok) {
				await fetchSessoes();
				showDialog(t("dlg.success"), t("dlg.saved"), "#1451B4", t("dlg.thanks"), "success", () => { });
			} else {
				showDialog(t("dlg.attention"), t("dlg.unableContinue"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
			}
		} catch (e) {
			console.log(e);
		}
		toggleModal();
	};

	const updateCurrentSession = (patch: Partial<Session>) => {
		if (editingSession) {
			setEditingSession((prev) => (prev ? { ...prev, ...patch } : prev));
		} else {
			setNewSession((prev) => ({ ...prev, ...patch }));
		}
	};

	const handleInputChange = (e: any) => {
		const { name, value, type, checked } = e.target;
		const parsedValue = type === "checkbox" ? checked : value;
		const patch: Partial<Session> = { [name]: parsedValue } as Partial<Session>;
		if (name === "is_triage" && parsedValue) {
			patch.triage_config = normalizeTriageConfig(t, formSession.triage_config);
		}
		updateCurrentSession(patch);
	};

	const handleTriageLevelChange = (levelKey: string, field: keyof TriageLevel, rawValue: string) => {
		const target = editingSession ?? newSession;
		const config = normalizeTriageConfig(t, target.triage_config);
		const updatedLevels = config.levels.map((level) =>
			level.key === levelKey
				? {
					...level,
					[field]:
						field === "min_score"
							? Number.isNaN(Number(rawValue))
								? 0
								: Number(rawValue)
							: rawValue,
				}
				: level
		);
		updateCurrentSession({ triage_config: { levels: updatedLevels } });
	};

	return (
		<DefaultLayout>
			<div className="p-4 sm:p-6">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:justify-between">
					<h1 className="text-xl text-[#1451B4] pt-2 font-bold leading-tight md:flex-shrink-0">{t("sessions.title")}</h1>

					<div className="flex w-full flex-col sm:flex-row gap-2 md:w-auto md:flex-nowrap">
						{/* Campo de busca */}
						<div className="relative w-full md:w-80">
							<input
								type="text"
								value={filtroBuscaGeral}
								onChange={(e) => setFiltroBuscaGeral(e.target.value)}
								placeholder={t("sessions.search.placeholder")}
								className="w-full rounded-md border border-gray-300 p-2 pr-9"
							/>
							{filtroBuscaGeral && (
								<button
									aria-label={t("sessions.search.clear")}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									onClick={() => setFiltroBuscaGeral("")}
								>
									{getIcone("HiXMark")}
								</button>
							)}
						</div>

						{/* Botão adicionar */}
						<button
							className="br-button primary mr-3 w-full sm:w-auto justify-center"
							onClick={() => toggleModal()}
						>
							{t("common.add")} {t("sessions.one")}
						</button>
					</div>
				</div>

				<div className="br-card">
					<div className="card-content overflow-x-auto -mx-4 sm:mx-0">
						<table className="min-w-full divide-y divide-gray-300 bg-white">
							<thead>
								<tr>
									<th className="py-2 px-4 border-b text-left">{t("sessions.code")}</th>
									<th className="py-2 px-4 border-b text-left">{t("sessions.one")}</th>
									<th className="py-2 px-4 border-b text-left">{t("sessions.priority")}</th>
									<th className="py-2 px-4 border-b">{t("sessions.updated")}</th>
									<th className="py-2 px-4 border-b text-center">{t("sessions.actions")}</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-gray-200 bg-white">
								{sessoes.map((s, idx) => {
									const textoObjeto = JSON.stringify(s)
										.normalize("NFD")
										.replace(/[\u0300-\u036f]/g, "")
										.toUpperCase();

									if (!filtroBuscaPalavras.length || filtroBuscaPalavras.every((w) => textoObjeto.includes(w))) {
										return (
											<tr key={idx}>
												<td className="py-2 px-4">
													{s.code}
												</td>
												<td className="py-2 px-4">
													{s.name}<br></br>
													<div className="font-semibold  rounded-sm bg-[#165BCA] text-center w-full px-2 py-1 text-xs font-medium text-white">
														{s.description}
													</div>
												</td>
												<td className="py-2 px-4 font-bold">
													{s.priority}
												</td>
												<td className="py-1 px-4 text-center text-sm whitespace-nowrap truncate">
													{s.date_updated &&
														new Date(s.date_updated).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})}
												</td>
												<td className="py-1 px-4">
													<div className="flex items-center justify-center gap-2">
														<button
															className="br-button circle"
															onClick={() => toggleModal(s)}
															title={t("common.edit")}
														>
															<i className="fas fa-edit"></i>
														</button>
														<button
															className="br-button circle"
															onClick={() => handleDelete(s.id)}
															title={t("common.delete")}
														>
															<i className="fas fa-trash"></i>
														</button>
													</div>
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

				{isModalOpen && (
					<div
						style={{ zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
						className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[820px] max-h-[80vh] flex flex-col max-w-[95vw]">
							<div className="flex-shrink-0 mb-4">
								<h2 className="text-xl font-bold">
									{editingSession ? `${t("common.edit")}` : `${t("common.add")}`} {t("sessions.one")}
								</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-1 overflow-y-auto pr-2">
								<div className="md:col-span-1">
									<label className="block mb-1">
										Code<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="code"
										value={editingSession ? editingSession.code : newSession.code}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="md:col-span-2">
									<label className="block mb-1">
										{t("sessions.name")}
										<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="name"
										value={editingSession ? editingSession.name : newSession.name}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="md:col-span-3">
									<label className="block mb-1">
										{t("sessions.description")}
										<b className="text-red"> *</b>
									</label>
									<textarea
										name="description"
										value={editingSession ? editingSession.description : newSession.description}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
										rows={3}
									/>
								</div>

								<div>
									<label className="block mb-1">
										{t("sessions.priority")}
										<b className="text-red"> *</b>
									</label>
									<input
										type="number"
										name="priority"
										value={editingSession ? editingSession.priority : newSession.priority}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="md:col-span-3">
									<label className="block mb-1">
										{t("sessions.ethics")}
										<b className="text-red"> *</b>
									</label>
									<textarea
										name="ethical_principles"
										value={editingSession ? editingSession.ethical_principles : newSession.ethical_principles}
										onChange={handleInputChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
										rows={2}
									/>
								</div>

								<div className="md:col-span-3">
									<label className="block mb-1">{t("sessions.active")}</label>
									<div className="br-checkbox">
										<input
											id="session-active"
											className="h-checkbox"
											type="checkbox"
											name="active"
											checked={editingSession ? !!editingSession.active : !!newSession.active}
											onChange={handleInputChange}
										/>
										<label htmlFor="session-active">{t("common.yes")}</label>
									</div>
								</div>

								<div className="md:col-span-3">
									<label className="block mb-1">{t("sessions.testing")}</label>
									<div className="br-checkbox">
										<input
											id="session-is-testing"
											className="h-checkbox"
											type="checkbox"
											name="is_testing"
											checked={editingSession ? !!editingSession.is_testing : !!newSession.is_testing}
											onChange={handleInputChange}
										/>
										<label htmlFor="session-is-testing">{t("common.yes")}</label>
									</div>
								</div>

								<div className="md:col-span-3">
									<label className="block mb-1">{t("sessions.triage")}</label>
									<div className="br-checkbox">
										<input
											id="session-is-triage"
											className="h-checkbox"
											type="checkbox"
											name="is_triage"
											checked={!!formSession.is_triage}
											onChange={handleInputChange}
										/>
										<label htmlFor="session-is-triage">
											{t("common.yes")}
										</label>
									</div>
								</div>

								{formSession.is_triage ? (
									<div className="md:col-span-3 space-y-4">
										<div className="rounded-md border p-4 space-y-4 bg-gray-50">
											<p className="text-sm font-semibold text-gray-700">{t("sessions.config_label")}</p>
											{(formSession.triage_config?.levels ?? []).map((level) => (
												<div key={level.key} className="grid grid-cols-1 md:grid-cols-2 gap-3">
													<div>
														<label className="block text-xs font-medium text-gray-600">
															{level.label} - {t("sessions.score_min.label")}
														</label>
														<input
															type="number"
															min={0}
															value={level.min_score}
															onChange={(e) => handleTriageLevelChange(level.key, "min_score", e.target.value)}
															className="mt-1 block w-full rounded-md border border-gray-300 p-2"
														/>
													</div>
													<div>
														<label className="block text-xs font-medium text-gray-600">
															{level.label} - {t("sessions.next_session_code.label")}
														</label>
														<input
															type="text"
															value={level.next_session_code ?? ""}
															onChange={(e) => handleTriageLevelChange(level.key, "next_session_code", e.target.value)}
															className="mt-1 block w-full rounded-md border border-gray-300 p-2"
														/>
													</div>
												</div>
											))}
										</div>

										<div className="md:col-span-3">
											<label className="block text-sm font-medium text-gray-700">{t("sessions.next_session_code.label")}</label>
											<input
												type="text"
												name="next_session_code"
												value={formSession.next_session_code ?? ""}
												onChange={handleInputChange}
												className="mt-1 block w-full rounded-md border border-gray-300 p-2"
											/>
											<p className="text-xs text-gray-500 mt-1">
												Use este campo para apontar o próximo formulário, mesmo em sessões de pré-triagem.
											</p>
										</div>
									</div>
								) : (
									<div className="md:col-span-3">
										<label className="block text-sm font-medium text-gray-700">{t("sessions.next_session_code.label")}</label>
										<input
											type="text"
											name="next_session_code"
											value={formSession.next_session_code ?? ""}
											onChange={handleInputChange}
											className="mt-1 block w-full rounded-md border border-gray-300 p-2"
										/>
									</div>
								)}
							</div>

							<div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t flex-shrink-0">
								<button
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 w-full sm:w-auto"
									onClick={() => toggleModal()}
								>
									{t("common.cancel")}
								</button>
								<button
									className="br-button primary w-full sm:w-auto justify-center"
									onClick={handleSave}
								>
									{editingSession ? t("common.save") : t("common.add")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DefaultLayout>
	);
}
