"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { useEffect, useMemo, useState } from "react";

type Project = {
	id?: number | string;
	name: string;
	responsible: string;
	description?: string;
	active?: boolean;
	date_created?: string;
	date_updated?: string;
	is_owner?: boolean;
	shared_with_me?: boolean;
	responses_count?: number;
};

type SessionScore = {
	session_id: number;
	session_code?: string | null;
	session_name?: string | null;
	score?: number | string | null;
	level?: string | null;
	meta?: Record<string, any> | null;
};

type ProjectResponse = {
	id?: number | string;
	project_id?: number | string;
	date_created?: string;
	status?: string;
	session_scores?: SessionScore[] | null;
	current_session_code?: string | null;
	date_updated?: string;
	result?: {
		summary?: ResultSummary | null;
	} | null;
};

type ProjectShareEntry = {
	id: number | string;
	social_number: string;
	date_created?: string;
};

type ResultSummary = {
	level?: number;
	levelTitle?: string;
	levelSubtitle?: string;
	score?: number;
	maxScore?: number;
	percentage?: number;
};

type ResponseAnswerDetail = {
	id: number | string;
	value: string | null;
	value_parsed?: any;
	question?: {
		code: string;
		text: string;
		session?: {
			name: string;
		};
	};
};

type ResponseDetail = {
	id: number | string;
	status?: string;
	date_created?: string;
	answers?: ResponseAnswerDetail[];
};

const PRE_TRIAGEM_LEVEL_STYLES: Record<
	string,
	{ badge: string; text: string; background: string }
> = {
	"Risco Baixo": {
		badge: "bg-green-100 text-green-800",
		text: "text-green-900",
		background: "bg-green-50",
	},
	"Risco Médio": {
		badge: "bg-yellow-100 text-yellow-800",
		text: "text-yellow-900",
		background: "bg-yellow-50",
	},
	"Risco Alto": {
		badge: "bg-orange-100 text-orange-800",
		text: "text-orange-900",
		background: "bg-orange-50",
	},
	"Risco Excessivo": {
		badge: "bg-pink-100 text-pink-800",
		text: "text-pink-900",
		background: "bg-pink-50",
	},
};

const DEFAULT_PRE_TRIAGEM_STYLE = {
	badge: "bg-gray-100 text-gray-700",
	text: "text-gray-700",
	background: "bg-gray-50",
};

const STATUS_BADGES: Record<string, { label: string; classes: string }> = {
	FINISHED: { label: "Finalizado", classes: "bg-[#188821] " },
	SUBMITTED: { label: "Em andamento", classes: "bg-[#165BCA]" },
	PENDING: { label: "Pendente", classes: "bg-[#D62D79]" },
};

const formatDateTime = (value?: string | null) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const getPreTriagemSummary = (response: ProjectResponse): SessionScore | null => {
	const sessions = response.session_scores;
	if (!Array.isArray(sessions)) return null;
	return (
		sessions.find((session) => {
			if (!session) return false;
			const code = String(session.session_code ?? "").toLowerCase();
			const name = String(session.session_name ?? "").toLowerCase();
			return code === "pretriagem" || name.includes("triagem");
		}) ?? null
	);
};

const formatPreTriagemScore = (score: SessionScore["score"]) => {
	if (typeof score === "number" && Number.isFinite(score)) {
		return score.toFixed(2);
	}
	if (typeof score === "string" && score.trim() !== "") {
		const parsed = Number(score);
		if (Number.isFinite(parsed)) return parsed.toFixed(2);
	}
	return null;
};

export default function ProjectsCrud() {
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	const { showDialog } = UseDialog();

	const [rows, setRows] = useState<Project[]>([]);
	const [loading, setLoading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editing, setEditing] = useState<Project | null>(null);
	const [responsesModalOpen, setResponsesModalOpen] = useState(false);
	const [responsesLoading, setResponsesLoading] = useState(false);
	const [responses, setResponses] = useState<ProjectResponse[]>([]);
	const [responsesProject, setResponsesProject] = useState<Project | null>(null);
	const [responseDetailModalOpen, setResponseDetailModalOpen] = useState(false);
	const [responseDetailLoading, setResponseDetailLoading] = useState(false);
	const [responseDetail, setResponseDetail] = useState<ResponseDetail | null>(null);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [shareModalProject, setShareModalProject] = useState<Project | null>(null);
	const [shareList, setShareList] = useState<ProjectShareEntry[]>([]);
	const [shareListLoading, setShareListLoading] = useState(false);
	const [shareActionLoading, setShareActionLoading] = useState(false);
	const [shareInput, setShareInput] = useState("");

	const [form, setForm] = useState<Project>({
		name: "",
		responsible: "",
		description: "",
	});

	// busca geral (usa o mesmo "pesquisaGeral" do teu layout)
	const [filter, setFilter] = useState("");
	const liberaPesquisa = (): any => {
		const el = document.getElementById("pesquisaGeral");
		if (!el) return setTimeout(liberaPesquisa, 800);
		el.style.display = "block";
		const input = el.querySelector("input") as HTMLInputElement | null;
		if (!input) return;
		let timer: number | undefined;
		input.placeholder = "Nome, responsável, descrição...";
		input.addEventListener("keyup", () => {
			if (timer) clearTimeout(timer);
			timer = window.setTimeout(() => setFilter(input.value), 400);
		});
	};

	const load = async () => {
		setLoading(true);
		try {
			const res = await fetchApi("projects", "GET");
			const json = await res.json();
			if (res.ok && Array.isArray(json)) {
				const activeOnly = json.filter((p: Project) => p?.active !== false);
				setRows(activeOnly);
			} else {
				setRows([]);
			}
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		liberaPesquisa();
	}, []);

	const toggleModal = (item?: Project) => {
		if (item) {
			setEditing(item);
			setForm({
				id: item.id,
				name: item.name,
				responsible: item.responsible,
				description: item.description ?? "",
			});
		} else {
			setEditing(null);
			setForm({ name: "", responsible: "", description: "" });
		}
		setIsModalOpen((v) => !v);
	};

	const onChange = (e: any) => {
		const { name, value } = e.target;
		setForm((p) => ({ ...p, [name]: value }));
	};

	const save = async () => {
		const body: Partial<Project> = {
			name: form.name?.trim(),
			responsible: form.responsible?.trim(),
			description: form.description ?? "",
		};

		const isEdit = !!editing?.id;
		const url = isEdit ? `projects/${editing?.id}` : "projects";
		const method = isEdit ? "PUT" : "POST";

		try {
			const res = await fetchApi(url, method, body);
			if (res.ok) {
				await load();
				showDialog(
					t("dlg.success"),
					t("dlg.saved"),
					"#1451B4",
					t("dlg.thanks"),
					"success",
					() => { }
				);
				toggleModal();
			} else {
				showDialog(
					t("dlg.attention"),
					t("dlg.unableContinue"),
					"#1451B4",
					t("dlg.tryAgain"),
					"error",
					() => { }
				);
			}
		} catch (e) {
			console.log(e);
		}
	};

	const removeItem = async (id: number | string) => {
		showDialog(
			t("dlg.attention"),
			t("dlg.projects_delete"),
			"#1451B4",
			t("dlg.yes"),
			"error",
			async () => {
				try {
					const res = await fetchApi(`projects/${id}`, "DELETE");
					if (res.ok) await load();
				} catch (e) {
					console.log(e);
				}
			},
			true
		);
	};

	const normalize = (s: string) =>
		(s || "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toUpperCase();

	const filtered = useMemo(() => {
		if (!filter) return rows;
		const tokens = normalize(filter)
			.split(/\s+/)
			.filter(Boolean);
		return rows.filter((r) => {
			const blob = normalize(JSON.stringify(r));
			return tokens.every((t) => blob.includes(t));
		});
	}, [filter, rows]);

	const openResponsesModal = async (project: Project) => {
		if (!project?.id) return;
		setResponsesProject(project);
		setResponsesModalOpen(true);
		setResponsesLoading(true);
		try {
			const res = await fetchApi(`responses?projectId=${project.id}`, "GET");
			const json = await res.json();
			if (res.ok && Array.isArray(json)) {
				setResponses(json);
			} else {
				setResponses([]);
			}
		} catch (error) {
			console.log(error);
			setResponses([]);
		} finally {
			setResponsesLoading(false);
		}
	};

	const closeResponsesModal = () => {
		setResponsesModalOpen(false);
		setResponsesProject(null);
		setResponses([]);
		closeResponseDetailModal();
	};

	const openResponseDetail = async (responseId: number | string) => {
		setResponseDetailModalOpen(true);
		setResponseDetailLoading(true);
		try {
			const res = await fetchApi(`responses/${responseId}`, "GET");
			const json = await res.json().catch(() => null);
			if (res.ok && json) {
				setResponseDetail(json);
			} else {
				setResponseDetail(null);
				showDialog(
					t("dlg.attention"),
					json?.message ?? t("dlg.responses_load_error"),
					"#E02424",
					"OK",
					"error",
					() => { }
				);
			}
		} catch (error) {
			console.log(error);
			setResponseDetail(null);
			showDialog(
				t("dlg.attention"),
				t("dlg.response_detail_load_error"),
				"#E02424",
				"OK",
				"error",
				() => { }
			);
		} finally {
			setResponseDetailLoading(false);
		}
	};

	const closeResponseDetailModal = () => {
		setResponseDetailModalOpen(false);
		setResponseDetail(null);
	};

	const loadProjectShares = async (projectId?: number | string) => {
		if (projectId == null) {
			setShareList([]);
			return;
		}

		setShareListLoading(true);
		try {
			const res = await fetchApi(`projects/${projectId}/shares`, "GET");
			const data = await res.json().catch(() => []);
			if (res.ok && Array.isArray(data)) {
				setShareList(data);
			} else {
				setShareList([]);
				showDialog(
					t("dlg.attention"),
					data?.message ?? t("dlg.shares_load_error"),
					"#E02424",
					"OK",
					"error",
					() => { }
				);
			}
		} catch (error) {
			console.log(error);
			setShareList([]);
			showDialog(
				t("dlg.attention"),
				t("dlg.share_detail_load_error"),
				"#E02424",
				"OK",
				"error",
				() => { }
			);
		} finally {
			setShareListLoading(false);
		}
	};

	const openShareModal = (project: Project) => {
		if (!project?.id) return;
		setShareModalProject(project);
		setShareModalOpen(true);
		setShareInput("");
		void loadProjectShares(project.id);
	};

	const closeShareModal = () => {
		setShareModalProject(null);
		setShareList([]);
		setShareModalOpen(false);
		setShareInput("");
		setShareActionLoading(false);
	};

	const addShare = async () => {
		if (!shareModalProject?.id) return;
		const formatted = shareInput.trim();
		if (!formatted) {
			showDialog(
				t("dlg.attention"),
				t("dlg.share_input_required"),
				"#1451B4",
				"OK",
				"error",
				() => { }
			);
			return;
		}
		try {
			setShareActionLoading(true);
			const res = await fetchApi(`projects/${shareModalProject.id}/shares`, "POST", {
				social_number: formatted,
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				showDialog(
					t("dlg.attention"),
					data?.message ?? t("dlg.share_action_error"),
					"#E02424",
					"OK",
					"error",
					() => { }
				);
				return;
			}
			setShareInput("");
			if (shareModalProject?.id) {
				await loadProjectShares(shareModalProject.id);
			}
			showDialog(
				t("dlg.success"),
				t("dlg.share_action_success"),
				"#1451B4",
				"OK",
				"success",
				() => { }
			);
		} catch (error) {
			console.log(error);
			showDialog(
				t("dlg.attention"),
				t("dlg.share_action_error"),
				"#E02424",
				"OK",
				"error",
				() => { }
			);
		} finally {
			setShareActionLoading(false);
		}
	};

	const removeShare = (shareId: number | string) => {
		if (!shareModalProject?.id) return;
		showDialog(
			t("dlg.attention"),
			t("dlg.share_remove_confirm"),
			"#1451B4",
			t("dlg.yes"),
			"error",
			async () => {
				try {
					setShareActionLoading(true);
					const res = await fetchApi(
						`projects/${shareModalProject.id}/shares/${shareId}`,
						"DELETE"
					);
					if (!res.ok) {
						const data = await res.json().catch(() => ({}));
						showDialog(
							t("dlg.attention"),
							data?.message ?? t("dlg.share_remove_error"),
							"#E02424",
							"OK",
							"error",
							() => { }
						);
						return;
					}
					await loadProjectShares(shareModalProject.id);
				} catch (error) {
					console.log(error);
				} finally {
					setShareActionLoading(false);
				}
			},
			true
		);
	};

	return (
		<DefaultLayout>
			<div className="p-4 sm:p-6">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:justify-between">
					<h1 className="text-xl text-[#1451B4] font-bold pt-1 leading-tight md:flex-shrink-0">{t("projects.title")}</h1>
					<button
						className="br-button primary w-full sm:w-auto justify-center"
						onClick={() => toggleModal()}
					>
						{t("projects.add")}
					</button>
				</div>

				<div className="br-card">
					<div className="card-content overflow-x-auto -mx-4 sm:mx-0">
						<table className="min-w-full divide-y divide-gray-300 bg-white">
							<thead>
								<tr>
									<th className="py-2 px-4 border-b text-left" style={{ fontSize: 13 }}>{t("projects.name")}</th>
									<th className="py-2 px-4 border-b text-left" style={{ fontSize: 13 }}>{t("projects.organ")}</th>
									<th className="py-2 px-4 border-b text-left" style={{ fontSize: 13 }}>{t("projects.updated_in")}</th>
									<th className="py-2 px-4 border-b text-left" style={{ fontSize: 13 }}>{t("projects.questionnaires")}</th>
									<th className="py-2 px-4 border-b text-center" style={{ fontSize: 13 }}>{t("projects.actions")}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{filtered.map((r) => (
									<tr key={r.id as any}>
										<td className="py-2 px-4">
											<div className="font-medium">{r.name}</div>
											{r.description ? (
												<div
													className="text-xs text-gray-500 max-w-[480px] truncate"
													title={r.description.substring(0, 30)}
												>
													{r.description.substring(0, 30)}
												</div>
											) : null}
											{r.shared_with_me && (
												<div className="font-semibold  rounded-sm bg-[#711F6C] text-center w-full px-2 py-1 text-xs font-medium text-white">
													{t("projects.sharedWithMe")}
												</div>
											)}
										</td>
										<td className="py-2 px-4">
											<div className="font-semibold  rounded-sm bg-[#165BCA] text-center w-full px-2 py-1 text-xs font-medium text-white">
												{r.responsible}
											</div>
										</td>
										<td className="py-2 px-4 font-xs" style={{ fontSize: 13 }}>
											{r.date_updated &&
												new Date(r.date_updated).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
										</td>
										<td className="py-2 px-4">
											<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
												{r.responses_count ?? 0} {t("projects.finished")}
												{(r.responses_count ?? 0) === 1 ? "" : "s"}
											</span>
										</td>
										<td className="py-2 px-4 text-right">
											<div className="flex items-center justify-end gap-1">
												{r.is_owner && (
													<button
														className="br-button circle"
														onClick={() => toggleModal(r)}
														title={t("common.edit")}
													>
														<i className="fas fa-edit"></i>
													</button>
												)}
												{!r.is_owner && (
													<button
														className="br-button circle"
														title={t("common.edit")}
														disabled={true}
													>
														<i className="fas fa-edit"></i>
													</button>
												)}
												{r.is_owner && (
													<button
														className="br-button circle"
														onClick={() => openShareModal(r)}
														title={t("projects.manageShares")}
													>
														<i className="fas fa-users"></i>
													</button>
												)}
												{!r.is_owner && (
													<button
														className="br-button circle"
														title={t("projects.manageShares")}
														disabled={true}
													>
														<i className="fas fa-users "></i>
													</button>
												)}
												<button
													className="br-button circle"
													onClick={() => openResponsesModal(r)}
													title={t("projects.viewResponses")}
												>
													<i className="fas fa-list"></i>
												</button>
												{r.is_owner && (
													<button
														className="br-button circle"
														onClick={() => removeItem(r.id!)}
														title={t("common.delete")}
													>
														<i className="fas fa-trash"></i>
													</button>
												)}
												{!r.is_owner && (
													<button
														className="br-button circle"
														disabled={true}
														title={t("common.delete")}
													>
														<i className="fas fa-trash "></i>
													</button>
												)}
												<a
													style={{ whiteSpace: "nowrap" }}
													className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 whitespace-nowrap"
													href={`/responses?project=${r.id}`}
												>
													{(r.responses_count ?? 0) > 0 ? t("projects.respondAgain") : t("projects.respond")}
												</a>
											</div>
										</td>
									</tr>
								))}
								{!filtered.length && (
									<tr>
										<td colSpan={5} className="py-6 text-center text-gray-500">
											{loading ? t("common.loading") : t("projects.no_records")}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{isModalOpen && (
					<div
						className="fixed inset-0 bg-black/50 flex items-center justify-center"
						style={{ zIndex: 9999 }}
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[520px] max-w-[90vw]">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
								<h1 className="text-xl font-bold mb-4 sm:col-span-2">
									{editing ? t("projects.editProject") : t("projects.addProject")}
								</h1>
								<div className="col-span-2">
									<label className="block mb-1">
										{t("projects.projectName.label")}
										<b className="text-red"> *</b>
									</label>
									<input
										name="name"
										value={form.name}
										onChange={onChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="col-span-2">
									<label className="block mb-1">
										{t("projects.projectOrgan.label")}
										<b className="text-red"> *</b>
									</label>
									<input
										name="responsible"
										value={form.responsible}
										onChange={onChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>

								<div className="col-span-2">
									<label className="block mb-1">
										{t("projects.projectDescription.label")}
									</label>
									<textarea
										name="description"
										value={form.description}
										onChange={onChange}
										rows={4}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row justify-end gap-2">
								<button
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 w-full sm:w-auto"
									onClick={() => toggleModal()}
								>
									{t("common.cancel")}
								</button>
								<button
									className="br-button primary w-full sm:w-auto justify-center"
									onClick={save}
								>
									{editing ? t("common.save") : t("common.add")}
								</button>
							</div>
						</div>
					</div>

				)}

				{responsesModalOpen && (
					<div
						className="fixed inset-0 bg-black/50 flex items-center justify-center"
						style={{ zIndex: 10000 }}
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[1080px] max-h-[85vh] flex flex-col max-w-[95vw]">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-xl font-bold">{t("projects.responsesHistory.title")}</h2>
									{responsesProject?.name && (
										<p className="text-sm text-gray-500">
											{responsesProject.name}
										</p>
									)}
								</div>
								<button
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
									onClick={closeResponsesModal}
								>
									{t("common.close")}
								</button>
							</div>

							<div className="flex-1 overflow-auto">
								<div className="overflow-x-auto -mx-4 sm:mx-0">
									<table className="min-w-full divide-y divide-gray-300 bg-white">
									<thead>
										<tr>
											<th className="py-2 px-4 border-b text-left">{t("common.createdAt")}</th>
											<th className="py-2 px-4 border-b text-left">
												{t("common.finishedAt")}
											</th>
											<th className="py-2 px-4 border-b text-left">{t("common.status")}</th>
											<th className="py-2 px-4 border-b text-left">
												{t("projects.responsesHistory.preScreening.label")}
											</th>
											<th className="py-2 px-4 border-b text-left">
												{t("projects.responsesHistory.levelReached.label")}
											</th>
											<th className="py-2 px-4 border-b text-left">
												{t("projects.responsesHistory.finalScore.label")}
											</th>
											<th className="py-2 px-4 border-b text-center">{t("common.actions")}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{responsesLoading && (
											<tr>
												<td
													colSpan={7}
													className="py-4 text-center text-gray-500"
												>
													{t("common.loading")}
												</td>
											</tr>
										)}
										{!responsesLoading && !responses.length && (
											<tr>
												<td
													colSpan={7}
													className="py-4 text-center text-gray-500"
												>
													{t("common.noResults")}
												</td>
											</tr>
										)}
										{!responsesLoading &&
											responses.map((response) => {
												const summary = getPreTriagemSummary(response);
												const style =
													summary?.level &&
														PRE_TRIAGEM_LEVEL_STYLES[summary.level]
														? PRE_TRIAGEM_LEVEL_STYLES[summary.level]
														: DEFAULT_PRE_TRIAGEM_STYLE;
												const formattedScore = summary
													? formatPreTriagemScore(summary.score)
													: null;
												const normalizedStatus = String(
													response.status || ""
												).toUpperCase();
												const statusInfo =
													STATUS_BADGES[normalizedStatus] ?? {
														label: response.status || "Indefinido",
														classes: "bg-gray-100 text-gray-700",
													};
												const finalSummary =
													(response.result?.summary as
														| ResultSummary
														| undefined) ?? undefined;
												const finalLevelLabel = finalSummary
													? finalSummary.levelTitle ||
													finalSummary.levelSubtitle ||
													"-"
													: "-";
												const finalScore =
													finalSummary &&
														typeof finalSummary.score === "number"
														? `${finalSummary.score.toFixed(2)} pts`
														: "-";
												const finalPercent =
													finalSummary &&
														typeof finalSummary.percentage === "number"
														? ` (${finalSummary.percentage.toFixed(1)}%)`
														: "";
												const isFinished =
													normalizedStatus === "FINISHED";

												return (
													<tr key={response.id as any}>
														<td className="py-2 px-4">
															{formatDateTime(response.date_created)}
														</td>
														<td className="py-2 px-4">
															{isFinished
																? formatDateTime(
																	response.date_updated
																)
																: "-"}
														</td>
														<td className="py-2 px-4">
															<div style={{textTransform: "uppercase"}} className={`font-semibold rounded-sm  text-center w-full px-2 py-1 text-xs font-medium text-white  ${statusInfo.classes}`}>
																{statusInfo.label}
															</div>
														</td>
														<td className="py-2 px-4">
															{summary ? (
																<div
																	className={`inline-flex flex-col rounded-md px-2.5 py-1 text-xs font-semibold`}
																>
																	<span>
																		{summary.level ||
																			"Pré-triagem"}
																	</span>
																	{formattedScore && (
																		<span className="text-[11px] opacity-80">
																			Score:{" "}
																			{formattedScore}
																		</span>
																	)}
																</div>
															) : (
																<span className="text-xs text-gray-500">
																	-
																</span>
															)}
														</td>
														<td className="py-2 px-4">
															<span className="text-sm text-gray-800">
																{finalLevelLabel}
															</span>
														</td>
														<td className="py-2 px-4">
															{finalSummary ? (
																<span className="text-sm font-semibold text-gray-800">
																	{finalScore}
																	{finalPercent}
																</span>
															) : (
																<span className="text-sm text-gray-500">
																	-
																</span>
															)}
														</td>
														<td className="py-2 px-4 text-center">
															{response.status === "FINISHED" ? (<div className="inline-flex items-center gap-2">
																<a
																	href={`/responses?responseId=${response.id}&result=true`}
																	className="br-button circle"
																	title={t("common.view")}
																>
																	<i className="fas fa-eye"></i>
																</a>
																<button
																	className="br-button circle"
																	onClick={() => response.id && openResponseDetail(response.id)}
																	title={t("common.view")}
																>
																	<i className="fas fa-list mr-1"></i>
																</button>
															</div>
															) : response.id ? (
																<a
																	href={`/responses?responseId=${response.id}`}
																	className="br-button circle"
																	title={t("projects.responsesHistory.continue")}
																>
																	<i className="fas fa-arrow-alt-circle-right mr-1"></i>
																</a>
															) : ""}
														</td>
													</tr>
												);
											})}
									</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				)}

				{responseDetailModalOpen && (
					<div
						className="fixed inset-0 bg-black/50 flex items-center justify-center"
						style={{ zIndex: 10002 }}
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[780px] max-h-[80vh] flex flex-col">
							<div className="flex items-center justify-between mb-4 flex-shrink-0">
								<div>
									<h2 className="text-xl font-bold">{t("projects.responsesHistory.sentResponses.label")}</h2>
									{responseDetail?.date_created && (
										<p className="text-sm text-gray-500">
											{new Date(
												responseDetail.date_created
											).toLocaleString("pt-BR", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									)}
								</div>
								<button
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
									onClick={closeResponseDetailModal}
								>
									{t("common.close")}
								</button>
							</div>

							<div className="flex-1 overflow-y-auto pr-2">
								{responseDetailLoading ? (
									<p className="text-center text-sm text-gray-500">
										{t("common.loading")}
									</p>
								) : responseDetail?.answers?.length ? (
									<ul className="space-y-3">
										{responseDetail.answers.map((answer) => {
											const sessionName =
												answer.question?.session?.name ?? t("sessions.one");
											const questionText =
												answer.question?.text ??
												answer.question?.code ??
												t("questions.one");
											const rawValue =
												answer.value_parsed ?? answer.value;
											const displayValue = Array.isArray(rawValue)
												? rawValue.join(", ")
												: rawValue ?? "-";
											return (
												<li
													key={answer.id}
													className="rounded-md border border-gray-200 p-3"
												>
													<p className="text-xs uppercase tracking-wide text-gray-500">
														{sessionName}
													</p>
													<p className="text-sm font-semibold text-gray-800">
														{questionText}
													</p>
													<p className="mt-1 text-sm text-gray-700">
														{String(displayValue)}
													</p>
												</li>
											);
										})}
									</ul>
								) : (
									<p className="text-center text-sm text-gray-500">
										{t("projects.responsesHistory.noResponsesFound")}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{shareModalOpen && (
					<div
						className="fixed inset-0 bg-black/50 flex items-center justify-center"
						style={{ zIndex: 10001 }}
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[520px]">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-xl font-bold">
										{t("projects.sharedModal.title")}
									</h2>
									{shareModalProject?.name && (
										<p className="text-sm text-gray-500">
											{shareModalProject.name}
										</p>
									)}
								</div>
								<button
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
									onClick={closeShareModal}
								>
									{t("common.close")}
								</button>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700">
									{t("projects.sharedModal.addShare.label")}
								</label>
								<div className="flex gap-2">
									<input
										value={shareInput}
										onChange={(e) => setShareInput(e.target.value)}
										className="flex-1 rounded-md border border-gray-300 p-2"
										placeholder="00000000000"
										disabled={shareActionLoading}
									/>
									<button
										className="br-button primary"
										onClick={addShare}
										disabled={shareActionLoading}
									>
										{t("common.add")}
									</button>
								</div>
							</div>

							<div className="mt-4 max-h-[260px] overflow-y-auto border rounded-md">
								{shareListLoading ? (
									<p className="p-4 text-sm text-gray-500">
										{t("common.loading")}
									</p>
								) : shareList.length ? (
									<ul className="divide-y divide-gray-200">
										{shareList.map((share) => (
											<li
												key={share.id}
												className="flex items-center justify-between p-3"
											>
												<div>
													<p className="text-sm font-semibold text-gray-800">
														{share.social_number}
													</p>
													{share.date_created && (
														<p className="text-xs text-gray-400">
															{t("common.since")}{" "}
															{new Date(
																share.date_created
															).toLocaleString("pt-BR", {
																day: "2-digit",
																month: "2-digit",
																year: "numeric",
															})}
														</p>
													)}
												</div>
												<button
													className="br-button danger"
													onClick={() => removeShare(share.id)}
													disabled={shareActionLoading}
												>
													{t("common.remove")}
												</button>
											</li>
										))}
									</ul>
								) : (
									<p className="p-4 text-sm text-gray-500">
										{t("projects.sharedModal.noActiveShares")}
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</DefaultLayout>
	);
}
