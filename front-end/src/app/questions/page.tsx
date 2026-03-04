"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { IconNames } from "@/types/menu";
import { useEffect, useMemo, useState } from "react";
import * as icones from "react-icons/hi2";

type Session = {
	id: number | string;
	code: string;
	name: string;
};

type Question = {
	id?: number | string;
	session?: Session;
	session_id: number | string;
	text: string;
	type: "text" | "textarea" | "radio" | "checkbox" | "multiple_choice";
	code: string;
	weights: number;
	version?: number;
	options?: any;
	is_critical: boolean;
	active: boolean;
	date_created?: string;
	date_updated?: string;
	conditional_field?: string;
	conditional_value?: string;
	actors?: string[]; // << novo campo
	order?: number;
};

type ActorOption = {
	id: number;
	name: string;
	active: boolean;
};

type QuestionVersion = Question & {
	questionId?: number | string;
};

type OptionDraft = {
	text?: string;
	value?: string;
	score?: string | number;
	points?: string | number;
	points_per_selection?: string | number;
	trigger?: string;
	trigger_if_selected?: string;
	best_practice_description?: string;
	recommendation_if_chosen_and_suboptimal?: string;
	reason_if_negative?: string;
	reason_if_selected?: string;
	recommendation_if_selected?: string;
};

const KNOWN_OPTION_FIELDS: (keyof OptionDraft)[] = [
	"text",
	"value",
	"score",
	"points",
	"points_per_selection",
	"trigger",
	"trigger_if_selected",
	"best_practice_description",
	"recommendation_if_chosen_and_suboptimal",
	"reason_if_negative",
	"reason_if_selected",
	"recommendation_if_selected",
];

const NUMERIC_OPTION_FIELDS = new Set(["score", "points", "points_per_selection"]);

const toArrayOptions = (raw: any): any[] => {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};

const toDraftList = (raw: any): OptionDraft[] => {
	return toArrayOptions(raw).map((opt: any) => ({
		text: opt?.text ?? opt?.label ?? "",
		value: opt?.value ?? "",
		score: opt?.score ?? opt?.score_positive ?? opt?.score_negative ?? "",
		points: opt?.points ?? "",
		points_per_selection: opt?.points_per_selection ?? "",
		trigger: opt?.trigger ?? "",
		trigger_if_selected: opt?.trigger_if_selected ?? "",
		best_practice_description: opt?.best_practice_description ?? "",
		recommendation_if_chosen_and_suboptimal: opt?.recommendation_if_chosen_and_suboptimal ?? "",
		reason_if_negative: opt?.reason_if_negative ?? "",
		reason_if_selected: opt?.reason_if_selected ?? "",
		recommendation_if_selected: opt?.recommendation_if_selected ?? "",
	}));
};

const normalizeDraft = (draft: OptionDraft): Record<string, any> => {
	const result: Record<string, any> = {};
	const setIfValid = (key: keyof OptionDraft, value: any) => {
		if (value === null || typeof value === "undefined") return;
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) return;
			if (NUMERIC_OPTION_FIELDS.has(key)) {
				const parsed = Number(trimmed);
				result[key] = Number.isFinite(parsed) ? parsed : trimmed;
				return;
			}
			result[key] = trimmed;
			return;
		}
		if (NUMERIC_OPTION_FIELDS.has(key)) {
			const parsed = Number(value);
			result[key] = Number.isFinite(parsed) ? parsed : value;
			return;
		}
		result[key] = value;
	};

	KNOWN_OPTION_FIELDS.forEach((field) => setIfValid(field, draft[field]));
	return result;
};

export default function ListaQuestoes() {
	const { showDialog } = UseDialog();
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	const [questions, setQuestions] = useState<Question[]>([]);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [actorOptions, setActorOptions] = useState<ActorOption[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
	const [isConditional, setIsConditional] = useState(false);
	const [editing, setEditing] = useState<Question | null>(null);
	const [versions, setVersions] = useState<QuestionVersion[]>([]);
	const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
	const [versionsLoading, setVersionsLoading] = useState(false);
	const [versionsFor, setVersionsFor] = useState<Question | null>(null);

	// filtros
	const [filter, setFilter] = useState(""); // busca geral
	const [filterSessionId, setFilterSessionId] = useState<string>(""); // select de sessão

	const makeEmptyForm = (): Question => ({
		session_id: "" as any,
		text: "",
		type: "text",
		code: "",
		weights: 1,
		order: 0,
		options: [],
		is_critical: false,
		active: true,
		conditional_value: "",
		conditional_field: "",
		actors: [],
	});

	const [form, setForm] = useState<Question>(makeEmptyForm());
	const [optionsList, setOptionsList] = useState<OptionDraft[]>([]);
	const [optionsStr, setOptionsStr] = useState<string>("[]");
	const [optionsError, setOptionsError] = useState<string | null>(null);
	const [showJsonOptions, setShowJsonOptions] = useState<boolean>(false);
	const [isOptionModalOpen, setIsOptionModalOpen] = useState<boolean>(false);
	const [optionEditingIndex, setOptionEditingIndex] = useState<number | null>(null);
	const [optionDraft, setOptionDraft] = useState<OptionDraft>({
		value: "",
		text: "",
		score: "",
		points: "",
		points_per_selection: "",
		trigger: "",
		trigger_if_selected: "",
		best_practice_description: "",
		recommendation_if_chosen_and_suboptimal: "",
		reason_if_negative: "",
		reason_if_selected: "",
		recommendation_if_selected: "",
	});

	function getIcone(iconName: IconNames) {
		const IconComponent = (icones as any)[iconName];
		if (!IconComponent) return null;
		return <IconComponent size={16} />;
	}

	const types = (type: string) => {
		const typesString: { [key: string]: string } = {
			text: "questions.text",
			textarea: "questions.textarea",
			radio: "questions.radio",
			checkbox: "questions.checkbox",
		};
		return typesString[type];
	};

	const loadSessions = async () => {
		try {
			const res = await fetchApi("sessions", "GET");
			const json = await res.json();
			if (res.ok) setSessions(json);
		} catch (e) {
			console.log(e);
		}
	};

	const loadQuestions = async () => {
		try {
			const res = await fetchApi("questions", "GET");
			const json = await res.json();
			if (res.ok) setQuestions(json);
		} catch (e) {
			console.log(e);
		}
	};

	const loadActors = async () => {
		try {
			const res = await fetchApi("actors?active=true", "GET");
			const json = await res.json();
			if (res.ok && Array.isArray(json)) setActorOptions(json);
		} catch (e) {
			console.log(e);
		}
	};

	useEffect(() => {
		loadSessions();
		loadQuestions();
		loadActors();
	}, []);

	const openVersionsModal = async (q: Question) => {
		if (!q?.id) return;
		setVersionsFor(q);
		setIsVersionsModalOpen(true);
		setVersions([]);
		setVersionsLoading(true);
		try {
			const res = await fetchApi(`questions/${q.id}/versions`, "GET");
			const json = await res.json();
			if (res.ok && Array.isArray(json)) {
				setVersions(json);
			} else {
				showDialog(
					t("dlg.attention"),
					t(json?.message && Array.isArray(json.message) ? json.message[0] : json?.message) || "Erro ao carregar versões",
					"#1451B4",
					t("dlg.ok") || "OK",
					"error",
					() => { }
				);
			}
		} catch (err) {
			console.log(err);
		} finally {
			setVersionsLoading(false);
		}
	};

	const closeVersionsModal = () => {
		setIsVersionsModalOpen(false);
		setVersions([]);
		setVersionsFor(null);
	};

	const openVersionAsReadOnly = (v: QuestionVersion) => {
		closeVersionsModal();
		const sessionId = (v as any)?.session_id ?? v?.session?.id;
		const mapped: Question = {
			id: v.questionId ?? v.id,
			session: v.session,
			session_id: sessionId,
			text: v.text,
			type: v.type as any,
			code: v.code,
			weights: v.weights,
			order: Number(v.order ?? 0),
			options: v.options,
			is_critical: !!v.is_critical,
			active: !!v.active,
			version: v.version,
			conditional_value: v.conditional_value,
			conditional_field: v.conditional_field,
			actors: Array.isArray(v.actors) ? v.actors : [],
			date_created: v.date_created,
			date_updated: v.date_updated,
		};
		openModal(mapped, { readOnly: true });
	};

	const openModal = (q?: Question, opts?: { readOnly?: boolean }) => {
		const readOnly = !!opts?.readOnly;
		setIsReadOnlyModal(readOnly);
		if (q) {
			setEditing(q);
			if (q.conditional_field && q.conditional_value) {
				setIsConditional(true);
			} else {
				setIsConditional(false);
			}
			setForm({
				session_id: q.session?.id ?? q.session_id,
				text: q.text,
				type: q.type,
				code: q.code,
				weights: q.weights,
				order: Number(q.order ?? 0),
				options: q.options,
				is_critical: !!q.is_critical,
				active: !!q.active,
				id: q.id,
				version: q.version,
				conditional_value: q.conditional_value,
				conditional_field: q.conditional_field,
				actors: Array.isArray(q.actors) ? q.actors : [],
			});
			const parsedOptions = toArrayOptions(q.options);
			setOptionsList(toDraftList(parsedOptions));
			setOptionsStr(parsedOptions.length ? JSON.stringify(parsedOptions, null, 2) : "[]");
			setOptionsError(null);
			setShowJsonOptions(false);
			setIsOptionModalOpen(false);
			setOptionEditingIndex(null);
		} else {
			setEditing(null);
			setIsConditional(false);
			setForm(makeEmptyForm());
			setOptionsStr("[]");
			setOptionsList([]);
			setOptionsError(null);
			setShowJsonOptions(false);
			setIsOptionModalOpen(false);
			setOptionEditingIndex(null);
		}
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsReadOnlyModal(false);
		setEditing(null);
		setIsConditional(false);
		setForm(makeEmptyForm());
		setOptionsStr("[]");
		setOptionsList([]);
		setOptionsError(null);
		setShowJsonOptions(false);
		setIsOptionModalOpen(false);
		setOptionEditingIndex(null);
		setIsModalOpen(false);
	};

	const onChange = (e: any) => {
		if (isReadOnlyModal) return;
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
		}));
	};

	const syncOptionsStrFromList = (list: OptionDraft[]) => {
		const normalized = list.map(normalizeDraft).filter((opt) => Object.keys(opt).length > 0);
		const nextStr = JSON.stringify(normalized, null, 2);
		setOptionsStr(nextStr);
		setOptionsError(null);
	};

	const onChangeOptions = (value: string) => {
		if (isReadOnlyModal) return;
		setOptionsStr(value);
		if (!value.trim()) {
			setOptionsList([]);
			setOptionsError(null);
			return;
		}
		try {
			const parsed = JSON.parse(value);
			if (!Array.isArray(parsed)) {
				setOptionsError("O JSON deve ser um array de opções.");
				return;
			}
			setOptionsList(toDraftList(parsed));
			setOptionsError(null);
		} catch (err: any) {
			setOptionsError(err?.message || "JSON inválido");
		}
	};

	const removeOptionRow = (index: number) => {
		if (isReadOnlyModal) return;
		setOptionsList((prev) => {
			const next = prev.filter((_, i) => i !== index);
			syncOptionsStrFromList(next);
			return next;
		});
	};

	const openOptionModal = (index: number | null = null) => {
		if (isReadOnlyModal) return;
		if (index !== null && optionsList[index]) {
			setOptionDraft({ ...optionsList[index] });
			setOptionEditingIndex(index);
		} else {
			setOptionDraft({
				value: "",
				text: "",
				score: "",
				points: "",
				points_per_selection: "",
				trigger: "",
				trigger_if_selected: "",
				best_practice_description: "",
				recommendation_if_chosen_and_suboptimal: "",
				reason_if_negative: "",
				reason_if_selected: "",
				recommendation_if_selected: "",
			});
			setOptionEditingIndex(null);
		}
		setIsOptionModalOpen(true);
	};

	const closeOptionModal = () => {
		setIsOptionModalOpen(false);
	};

	const saveOptionDraft = () => {
		if (isReadOnlyModal) return;
		const normalized = normalizeDraft(optionDraft);
		if (!normalized.value || !normalized.text) {
			showDialog(
				t("dlg.attention"),
				"Preencha ao menos 'value' e 'text'.",
				"#1451B4",
				t("dlg.ok") || "OK",
				"error",
				() => { }
			);
			return;
		}
		setOptionsList((prev) => {
			const next = [...prev];
			if (optionEditingIndex !== null && optionEditingIndex >= 0 && optionEditingIndex < prev.length) {
				next[optionEditingIndex] = normalized;
			} else {
				next.push(normalized);
			}
			syncOptionsStrFromList(next);
			return next;
		});
		setIsOptionModalOpen(false);
	};

	const toggleActor = (label: string, checked: boolean) => {
		if (isReadOnlyModal) return;
		setForm((prev) => {
			const current = new Set(prev.actors ?? []);
			if (checked) current.add(label);
			else current.delete(label);
			return { ...prev, actors: Array.from(current) };
		});
	};

	const parseOptions = (): any[] | null => {
		if (optionsError) {
			showDialog(
				t("dlg.attention"),
				optionsError,
				"#1451B4",
				t("dlg.ok") || "OK",
				"error",
				() => { }
			);
			return null;
		}
		if (!optionsStr || !optionsStr.trim()) return [];
		try {
			const parsed = JSON.parse(optionsStr);
			if (!Array.isArray(parsed)) throw new Error("Options must be an array");
			return parsed;
		} catch (err: any) {
			showDialog(
				t("dlg.attention"),
				(t("questions.invalidOptionsJSON") as string) || `${err.message}`,
				"#1451B4",
				t("dlg.ok") || "OK",
				"error",
				() => { }
			);
			return null;
		}
	};

	const save = async (withVersioning = false) => {
		if (isReadOnlyModal) return;
		const parsed = parseOptions();
		if (parsed === null) return;

		const body: Partial<Question> = {
			session_id: form.session_id,
			text: form.text,
			type: form.type,
			code: form.code,
			weights: Number(form.weights) || 0,
			order: Number(form.order) || 0,
			options: parsed,
			is_critical: !!form.is_critical,
			conditional_value: form.conditional_value,
			conditional_field: form.conditional_field,
			active: !!form.active,
			actors: form.actors ?? [], // << envia no nó "actor"
		};

		const isEdit = !!editing?.id;
		const isVersioning = withVersioning && isEdit;
		const url = isVersioning
			? `questions/${editing?.id}/version`
			: isEdit
				? `questions/${editing?.id}`
				: "questions";
		const method = isEdit ? "PUT" : "POST";

		try {
			const res = await fetchApi(url, method, body);
			if (res.ok) {
				await loadQuestions();
				showDialog(t("dlg.success"), t("dlg.saved"), "#1451B4", t("dlg.thanks"), "success", () => { });
				closeModal();
			} else {
				const json = await res.json();
				showDialog(
					t("dlg.attention"),
					t(json.message && Array.isArray(json.message) ? json.message[0] : json.message),
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

	const onChangeConditional = () => {
		if (isReadOnlyModal) return;
		setIsConditional(!isConditional)
	}

	const removeQ = async (id: string | number) => {
		showDialog(
			t("dlg.attention"),
			t("questions.delete"),
			"#1451B4",
			t("dlg.yes"),
			"error",
			async () => {
				try {
					const res = await fetchApi(`questions/${id}`, "DELETE");
					if (res.ok) await loadQuestions();
				} catch (e) {
					console.log(e);
				}
			},
			true
		);
	};

	const normaliza = (s: string) =>
		s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

	// filtro combinado: busca geral + sessão
	const actorChoices = useMemo(() => {
		const map = new Map<string, ActorOption>();
		actorOptions.forEach((actor) => {
			if (actor?.name) map.set(actor.name, actor);
		});
		(form.actors ?? []).forEach((name) => {
			if (name && !map.has(name)) {
				map.set(name, { id: -1, name, active: true });
			}
		});
		return Array.from(map.values()).sort((a, b) =>
			a.name.localeCompare(b.name, "pt-BR")
		);
	}, [actorOptions, form.actors]);

	const filtered = useMemo(() => {
		const safeNumber = (value: number | string | undefined) => {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : 0;
		};

		const byText = (qs: Question[]) => {
			if (!filter) return qs;
			const tokens = normaliza(filter)?.split(/\s+/).filter(Boolean);
			return qs.filter((q) => {
				const blob = normaliza(
					JSON.stringify({
						...q,
						session_code: q.session?.code,
						session_name: q.session?.name,
					})
				);
				return tokens?.every((t) => blob?.includes(t));
			});
		};

		const bySession = (qs: Question[]) => {
			if (!filterSessionId) return qs;
			const target = String(filterSessionId);
			return qs.filter((q) => {
				const id1 = q.session?.id != null ? String(q.session.id) : "";
				const id2 = q.session_id != null ? String(q.session_id) : "";
				return id1 === target || id2 === target;
			});
		};

		return bySession(byText(questions))
			.slice()
			.sort((a, b) => {
				const orderDiff = safeNumber(a.order) - safeNumber(b.order);
				if (orderDiff !== 0) return orderDiff;
				return safeNumber(a.id as number | string | undefined) - safeNumber(b.id as number | string | undefined);
			});
	}, [filter, filterSessionId, questions]);

	return (
		<DefaultLayout>
			<div className="p-4 sm:p-6">
				{/* Título + filtros + adicionar */}

				<div className="mb-4 flex flex-col gap-3 md:flex-row md:justify-between">
					<h1 className="text-xl text-[#1451B4] pt-2 font-bold leading-tight md:flex-shrink-0">{t("questions.title")}</h1>
					{/* Busca geral */}
					<div className="br-input w-full md:w-80">
						<input
							id="search-input"
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder={t("common.search")}
						/>
						{filter && (
							<button
								className="br-button circle small"
								type="button"
								aria-label="Limpar busca"
								onClick={() => setFilter("")}
							>
								<i className="fas fa-times" aria-hidden="true"></i>
							</button>
						)}
					</div>

					{/* Select de Sessão */}
					<div className="br-select w-full md:w-72">
						<select
							value={filterSessionId}
							onChange={(e) => setFilterSessionId(e.target.value)}
							aria-label="Filtrar por sessão"
						>
							<option value="">{t("sessions.all") ?? "Todas as sessões"}</option>
							{sessions.map((s) => (
								<option key={s.id} value={String(s.id)}>
									{s.name}
								</option>
							))}
						</select>
						{/* {filterSessionId && (
								<button
									aria-label="Limpar filtro de sessão"
									className="br-button circle small"
									onClick={() => setFilterSessionId("")}
									style={{ right: '3rem' }}
								>
									<i className="fas fa-times" aria-hidden="true"></i>
								</button>
							)} */}
					</div>

					{/* Adicionar */}
					<button
						className="br-button primary w-full sm:w-auto justify-center"
						onClick={() => openModal()}
					>
						{t("common.add")} {t("questions.one")}
					</button>
				</div>

				<div className="br-card">
					<div className="card-content overflow-x-auto -mx-4 sm:mx-0">
						<table className="br-table min-w-full divide-y divide-gray-300 bg-white">
							<thead className="table-header">
								<tr>
									<th className="py-1 px-4 border-b text-left">{t("questions.one")}</th>
									<th className="py-1 px-4 border-b text-left"></th>
									<th className="py-1 px-4 border-b text-left">{t("questions.weight")}</th>
									<th className="py-1 px-4 border-b text-left">{t("questions.criticy")}</th>
									<th className="py-1 px-4 border-b">{t("questions.version")}</th>
									<th className="py-1 px-4 border-b">{t("questions.update")}</th>
									<th className="py-1 px-4 border-b text-center">{t("questions.actions")}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 bg-white">
								{filtered.map((q, i) => (
									<tr key={i}>
										<td className="py-1 px-4 max-w-[380px] truncate" title={q.text}>
											{q.text}<br></br><b style={{ fontSize: 10 }}>{q.code}</b>
										</td>
										<td className="py-1 px-4">
											<div className="font-semibold  rounded-sm bg-[#165BCA] text-center w-full px-2 mb-1 py-1 text-xs font-medium text-white">
												{t("sessions.one")}{" "}
												{q.session?.code
													? `${q.session?.name}`
													: sessions.find((s) => s.id === q.session_id)?.name || q.session_id}
											</div>
											<div className="font-semibold  rounded-sm bg-[#188821] text-center w-full px-2 py-1 text-xs font-medium text-white">
												{t(types(q.type))}
											</div>
										</td>
										<td className="py-1 px-4 font-bold">{q.weights}</td>
										<td className="py-1 px-4">
											{q.is_critical ? (
												<div className="font-semibold  rounded-sm bg-[#188821] text-center w-full px-2 py-1 text-xs font-medium text-white">
													{t("common.yes")}
												</div>
											) : (
												<div className="font-semibold  rounded-sm bg-[#D62D79] text-center w-full px-2 py-1 text-xs font-medium text-white">
													{t("common.no")}
												</div>
											)}
										</td>
										<td className="py-1 px-4 text-center">{q.version}</td>
										<td className="py-1 px-4 text-center text-sm whitespace-nowrap truncate">
											{q.date_updated &&
												new Date(q.date_updated).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
										</td>
										<td className="py-1 px-4">
											<div className="flex items-center">
												<button
													className="br-button circle"
													onClick={() => openModal(q)}
													title={t("common.edit")}
												>
													<i className="fas fa-edit"></i>
												</button>
												<button
													className="br-button circle"
													onClick={() => openVersionsModal(q)}
													title={t("questions.version") ?? "Versões"}
												>
													<i className="fas fa-list"></i>
												</button>
												<button
													className="br-button circle"
													onClick={() => removeQ(q.id!)}
													title={t("common.delete")}
												>
													<i className="fas fa-trash"></i>
												</button>
											</div>
										</td>
									</tr>
								))}
								{filtered.length === 0 && (
									<tr>
										<td colSpan={7} className="py-6 text-center text-sm text-gray-500">
											{t("common.noResults")}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{isModalOpen && (
					<div
						style={{ zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
						className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
					>
						<div className="bg-white p-6 rounded-md shadow-lg w-[980px] max-h-[80vh] flex flex-col max-w-[95vw]">
							<div className="flex-shrink-0 mb-4">
								<h2 className="text-xl font-bold">
									{isReadOnlyModal
										? `${t("common.view") ?? "Visualizar"} ${t("questions.one")}`
										: editing
											? `${t("common.edit")} ${t("questions.one")}`
											: `${t("common.add")} ${t("questions.one")}`}
									{editing?.version ? ` (v${editing.version})` : ""}
								</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-1 overflow-y-auto pr-2">
								<div className="md:col-span-1">
									<label className="block mb-1">
										{t("sessions.one")}<b className="text-red"> *</b>
									</label>
									<select
										name="session_id"
										value={form.session_id}
										onChange={onChange}
										className="br-select"
										disabled={isReadOnlyModal}
									>
										<option value="">Selecione...</option>
										{sessions.map((s) => (
											<option key={s.id} value={s.id as any}>
												{s.name}
											</option>
										))}
									</select>
								</div>

								<div className="col-span-1">
									<label className="block mb-1">
										{t("sessions.code")}<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="code"
										value={form.code}
										onChange={onChange}
										className="br-input"
										disabled={isReadOnlyModal}
									/>
								</div>

								<div>
									<label className="block mb-1">
										{t("questions.type")}<b className="text-red"> *</b>
									</label>
									<select
										name="type"
										value={form.type}
										onChange={onChange}
										className="br-select"
										disabled={isReadOnlyModal}
									>
										<option value="text">{t("questions.text")} (text)</option>
										<option value="textarea">{t("questions.textarea")} (textarea)</option>
										<option value="radio">{t("questions.radio")} (radio)</option>
										<option value="checkbox">{t("questions.checkbox")} (checkbox)</option>
									</select>
								</div>

								<div>
									<label className="block mb-1">
										{t("questions.weight")}<b className="text-red"> *</b>
									</label>
									<input
										type="number"
										step="0.01"
										name="weights"
										value={form.weights}
										onChange={onChange}
										className="br-input"
										disabled={isReadOnlyModal}
									/>
								</div>

								<div>
									<label className="block mb-1">
										{t("questions.order") ?? "Ordem"}
									</label>
									<input
										type="number"
										name="order"
										min={0}
										value={form.order ?? 0}
										onChange={onChange}
										className="br-input"
										disabled={isReadOnlyModal}
									/>
								</div>

								<div className="md:col-span-2">
									<label className="block mb-1">
										{t("questions.one")}<b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="text"
										value={form.text}
										onChange={onChange}
										className="br-input"
										disabled={isReadOnlyModal}
									/>
								</div>

								{/* ATORES */}
								<div className="md:col-span-3">
									<label className="block mb-1 font-semibold">{t("questions.actors_title_label")}</label>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3 border rounded-md">
										{actorChoices.length ? (
											actorChoices.map((actor) => {
												const id = `actor-${actor.name}`;
												const checked = (form.actors ?? []).includes(actor.name);
												return (
													<div className="br-checkbox" style={{ marginTop: 0 }}>
														<input
															className="h-checkbox "
															id={id}
															type="checkbox"
															checked={checked}
															onChange={(e) => toggleActor(actor.name, e.target.checked)}
															disabled={isReadOnlyModal}
														/>
														<label htmlFor={id} className="text-sm" key={actor.name}>{actor.name}</label>
													</div>
												);
											})
										) : (
											<span className="text-sm text-gray-500">{t("common.noResults")}</span>
										)}
									</div>
								</div>

								<div className="col-span-1">
									<label className="block mb-1">{t("questions.criticy")}</label>
									<div className="br-checkbox">
										<input className="h-checkbox" id="is_critical" type="checkbox" name="is_critical" checked={!!form.is_critical} onChange={onChange} disabled={isReadOnlyModal} />
										<label htmlFor="is_critical">{t("common.yes")}</label>
									</div>
								</div>

								<div className="col-span-1">
									<label className="block mb-1">{t("questions.active")}</label>
									<div className="br-checkbox">
										<input className="h-checkbox" id="active" type="checkbox" name="active" checked={!!form.active} onChange={onChange} disabled={isReadOnlyModal} />
										<label htmlFor="active">{t("common.yes")}</label>
									</div>
								</div>

								<div className="col-span-1">
									<label className="block mb-1">{t("questions.conditional")}</label>
									<div className="br-checkbox">
										<input className="h-checkbox" id="conditional" type="checkbox" name="conditional" checked={isConditional} onChange={onChangeConditional} disabled={isReadOnlyModal} />
										<label htmlFor="conditional">{t("common.yes")}</label>
									</div>
								</div>

								{isConditional && <div className="col-span-1">
									<label className="block mb-1">
										{t("questions.conditional_field")} <b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="conditional_field"
										value={form.conditional_field}
										onChange={onChange}
										className="br-input"
										disabled={isReadOnlyModal}
									/>
								</div>}

								{isConditional && <div className="col-span-1">
									<label className="block mb-1">
										{t("questions.conditional_value")} <b className="text-red"> *</b>
									</label>
									<input
										type="text"
										name="conditional_value"
										value={form.conditional_value}
										onChange={onChange}
										className="br-input"
										disabled={isReadOnlyModal}
									/>
								</div>}

								<div className="md:col-span-3">
									<div className="flex items-center justify-between mb-1">
										<div>
											<label className="block mb-0.5 font-semibold">{t("questions.options")}</label>
											<small className="opacity-70">[{`{ value, text, score|points, trigger }`}]</small>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												className="br-button secondary"
												onClick={() => setShowJsonOptions((v) => !v)}
											>
												{showJsonOptions
													? t("questions.options_json.hide")
													: t("questions.options_json.show")}
											</button>
											<button
												type="button"
												className="br-button "
												onClick={() => openOptionModal(null)}
												disabled={isReadOnlyModal}
											>
												+ {t("questions.options.new")}
											</button>
										</div>
									</div>
									{optionsError && (
										<div className="text-red-600 text-xs mb-2">{optionsError}</div>
									)}
									<div className="border border-gray-200 rounded-md overflow-auto max-h-80 bg-white">
										<table className="br-table w-full text-sm">
											<thead>
												<tr>
													<th className="px-3 py-2 text-left">{t("questions.options.table.text")}</th>
													<th className="px-3 py-2 text-left">{t("questions.options.table.value")}</th>
													<th className="px-3 py-2 text-left">{t("questions.options.table.points")}</th>
													<th className="px-3 py-2 text-left">{t("questions.options.table.trigger")}</th>
													<th className="px-3 py-2 text-left">{t("questions.options.table.actions")}</th>
												</tr>
											</thead>
											<tbody>
												{optionsList.map((opt, idx) => (
													<tr key={idx}>
														<td className="px-3 py-2">
															<div className="font-semibold truncate max-w-[280px]" title={opt.text}>
																{opt.text || "-"}
															</div>
														</td>
														<td className="px-3 py-2">{opt.value || "-"}</td>
														<td className="px-3 py-2">
															<div className="flex flex-col text-xs gap-1">
																{opt.score !== undefined && opt.score !== "" && <span>score: {opt.score}</span>}
																{opt.points !== undefined && opt.points !== "" && <span>points: {opt.points}</span>}
																{opt.points_per_selection !== undefined && opt.points_per_selection !== "" && <span>pps: {opt.points_per_selection}</span>}
																{!opt.score && !opt.points && !opt.points_per_selection && <span>-</span>}
															</div>
														</td>
														<td className="px-3 py-2 text-xs">
															{opt.trigger || opt.trigger_if_selected || "-"}
														</td>
														<td className="px-3 py-2">
															<div className="flex gap-2">
																<button
																	type="button"
																	className="br-button circle small"
																	title="Editar"
																	onClick={() => openOptionModal(idx)}
																	disabled={isReadOnlyModal}
																>
																	<i className="fas fa-edit"></i>
																</button>
																<button
																	type="button"
																	className="br-button circle small"
																	title="Remover"
																	onClick={() => removeOptionRow(idx)}
																	disabled={isReadOnlyModal}
																>
																	<i className="fas fa-trash"></i>
																</button>
															</div>
														</td>
													</tr>
												))}
												{optionsList.length === 0 && (
													<tr>
														<td className="px-3 py-4 text-center text-sm text-gray-500" colSpan={5}>
															{t("common.noResults")}
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
									{showJsonOptions && (
										<div className="mt-2">
											<textarea
												name="options"
												value={optionsStr}
												onChange={(e) => onChangeOptions(e.target.value)}
												className="br-textarea"
												rows={8}
												placeholder='[{"value":"sim","text":"Sim","score":1}]'
												readOnly={isReadOnlyModal}
												disabled={isReadOnlyModal}
											/>
											<p className="text-xs text-gray-500 mt-1">
												O envio usa este campo de JSON. Editar aqui também atualiza a tabela.
											</p>
										</div>
									)}
								</div>

							</div>

							<div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0">
								<button
									className="br-button secondary w-full sm:w-auto justify-center"
									onClick={() => closeModal()}
								>
									{isReadOnlyModal ? (t("common.close") ?? "Fechar") : (t("common.cancel") ?? "Cancelar")}
								</button>
								{!isReadOnlyModal && editing && (
									<button
										className="br-button primary w-full sm:w-auto justify-center"
										onClick={() => save(true)}
									>
										{t("common.save_version")}
									</button>
								)}
								{!isReadOnlyModal && (
									<button
										className="br-button primary"
										onClick={() => save()}
									>
										{editing ? t("common.save") : t("common.add")}
									</button>
								)}
							</div>
						</div>
					</div>
				)}

				{isVersionsModalOpen && (
					<div
						style={{ zIndex: 9998, backgroundColor: "rgba(0, 0, 0, 0.45)" }}
						className="fixed inset-0 flex items-center justify-center"
					>
						<div className="bg-white rounded-lg shadow-xl w-[760px] max-h-[80vh] overflow-y-auto p-5  flex flex-col gap-3">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-lg font-semibold">
										{t("questions.version") ?? "Versões"} - {versionsFor?.text || t("questions.one")}
									</h3>
									<p className="text-xs text-gray-500">
										{t("questions.version_history") ?? "Histórico de versões salvas"}
									</p>
								</div>
								<button className="br-button circle" onClick={closeVersionsModal} style={{ width: "70px" }}>
									<i className="fas fa-times"></i>
								</button>
							</div>

							<div className="border border-gray-100 rounded-md overflow-hidden">
								<table className="br-table w-full text-sm">
									<thead>
										<tr>
											<th className="px-3 py-2 text-left w-24">Versão</th>
											<th className="px-3 py-2 text-left">{t("questions.update")}</th>
											<th className="px-3 py-2 text-left">{t("sessions.one")}</th>
											<th className="px-3 py-2 text-left">{t("questions.one")}</th>
											<th className="px-3 py-2 text-left text-center w-24">{t("questions.actions")}</th>
										</tr>
									</thead>
									<tbody>
										{versionsLoading && (
											<tr>
												<td colSpan={5} className="px-3 py-4 text-center text-gray-500">
													{t("common.loading") ?? "Carregando..."}
												</td>
											</tr>
										)}
										{!versionsLoading && versions.map((v, idx) => (
											<tr key={`${v.id}-${idx}`}>
												<td className="px-3 py-2 font-semibold">v{v.version}</td>
												<td className="px-3 py-2 text-sm whitespace-nowrap">
													{v.date_updated &&
														new Date(v.date_updated).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})}
												</td>
												<td className="px-3 py-2 text-sm">
													{v.session?.name || sessions.find((s) => s.id === (v as any).session_id)?.name || (v as any).session_id || "-"}
												</td>
												<td className="px-3 py-2 text-sm max-w-[320px] truncate" title={v.text}>
													{v.text}
												</td>
												<td className="px-3 py-2 text-center">
													<button
														className="br-button circle"
														onClick={() => openVersionAsReadOnly(v)}
														title={t("common.view") ?? "Visualizar"}
													>
														<i className="fas fa-eye"></i>
													</button>
												</td>
											</tr>
										))}
										{!versionsLoading && versions.length === 0 && (
											<tr>
												<td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
													{t("common.noResults")}
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{isOptionModalOpen && (
					<div
						style={{ zIndex: 10000, backgroundColor: "rgba(0, 0, 0, 0.35)" }}
						className="fixed inset-0 flex items-center justify-center"
					>
						<div className="bg-white rounded-lg shadow-xl w-[720px] max-h-[80vh] overflow-y-auto p-4 border border-gray-200">
							<div className="flex items-start justify-between mb-3">
								<div>
									<h3 className="text-lg font-semibold">
										{optionEditingIndex !== null ? t("questions.options.edit") : t("questions.options.new")}
									</h3>
									<p className="text-xs text-gray-500">{t("questions.options.helper")}</p>
								</div>
								<button className="br-button circle small" onClick={closeOptionModal}>
									<i className="fas fa-times"></i>
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium mb-1">{t("questions.options.value.label")}</label>
									<input
										className="br-input w-full"
										value={optionDraft.value ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, value: e.target.value }))}
										placeholder="value"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">{t("questions.options.text.label")}</label>
									<input
										className="br-input w-full"
										value={optionDraft.text ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, text: e.target.value }))}
										placeholder="text"
									/>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="block text-sm font-medium mb-1">{t("questions.options.score.label")}</label>
										<input
											className="br-input w-full"
											value={optionDraft.score ?? ""}
											onChange={(e) => setOptionDraft((prev) => ({ ...prev, score: e.target.value }))}
											placeholder="score"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">{t("questions.options.points.label")}</label>
										<input
											className="br-input w-full"
											value={optionDraft.points ?? ""}
											onChange={(e) => setOptionDraft((prev) => ({ ...prev, points: e.target.value }))}
											placeholder="points"
										/>
									</div>
									<div className="md:col-span-2">
										<label className="block text-sm font-medium mb-1">{t("questions.options.points_per_selection.label")}</label>
										<input
											className="br-input w-full"
											value={optionDraft.points_per_selection ?? ""}
											onChange={(e) => setOptionDraft((prev) => ({ ...prev, points_per_selection: e.target.value }))}
											placeholder="points_per_selection"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">{t("questions.options.trigger.label")}</label>
									<input
										className="br-input w-full"
										value={optionDraft.trigger ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, trigger: e.target.value }))}
										placeholder="trigger"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">{t("questions.options.trigger_if_selected.label")}</label>
									<input
										className="br-input w-full"
										value={optionDraft.trigger_if_selected ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, trigger_if_selected: e.target.value }))}
										placeholder="trigger_if_selected"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-1">{t("questions.options.best_practice_description.label")}</label>
									<textarea
										className="br-textarea"
										rows={3}
										value={optionDraft.best_practice_description ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, best_practice_description: e.target.value }))}
										placeholder="best_practice_description"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-1">{t("questions.options.recommendation_if_chosen_and_suboptimal.label")}</label>
									<textarea
										className="br-textarea"
										rows={3}
										value={optionDraft.recommendation_if_chosen_and_suboptimal ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, recommendation_if_chosen_and_suboptimal: e.target.value }))}
										placeholder="recommendation_if_chosen_and_suboptimal"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">{t("questions.options.reason_if_negative.label")}</label>
									<textarea
										className="br-textarea"
										rows={2}
										value={optionDraft.reason_if_negative ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, reason_if_negative: e.target.value }))}
										placeholder="reason_if_negative"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">{t("questions.options.reason_if_selected.label")}</label>
									<textarea
										className="br-textarea"
										rows={2}
										value={optionDraft.reason_if_selected ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, reason_if_selected: e.target.value }))}
										placeholder="reason_if_selected"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium mb-1">{t("questions.options.recommendation_if_selected.label")}</label>
									<textarea
										className="br-textarea"
										rows={2}
										value={optionDraft.recommendation_if_selected ?? ""}
										onChange={(e) => setOptionDraft((prev) => ({ ...prev, recommendation_if_selected: e.target.value }))}
										placeholder="recommendation_if_selected"
									/>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
								<button className="br-button secondary w-full sm:w-auto justify-center" type="button" onClick={closeOptionModal}>
									{t("common.cancel")}
								</button>
								<button className="br-button primary w-full sm:w-auto justify-center" type="button" onClick={saveOptionDraft}>
									{optionEditingIndex !== null ? t("common.save") : t("common.add")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DefaultLayout>
	);
}
