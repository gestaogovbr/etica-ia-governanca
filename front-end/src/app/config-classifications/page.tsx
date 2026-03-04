"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { useEffect, useState } from "react";

type ClassificationLevel = {
	id: number;
	level_key: string;
	display_order: number;
	title: string;
	subtitle: string;
	description: string;
	advice: string;
	max_score?: number | null;
	max_percentage?: number | null;
	isNew?: boolean;
	critical_trigger_threshold?: number | null;
};

const formatNumber = (value?: number | null) => {
	if (value === null || typeof value === "undefined") return "";
	if (typeof value === "number") return value.toString();
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed.toString() : "";
};

export default function ConfigClassificationsPage() {
	const { showDialog } = UseDialog();
	const [levels, setLevels] = useState<ClassificationLevel[]>([]);
	const [originalLevels, setOriginalLevels] = useState<ClassificationLevel[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<number | null>(null);
	const [expandedIds, setExpandedIds] = useState<number[]>([]);
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const res = await fetchApi("classification-levels", "GET");
				if (!res.ok) throw new Error(t("dlg.classification_load_error"));
				const data = await res.json().catch(() => []);
				const levelsData = Array.isArray(data) ? data : [];
				setLevels(levelsData);
				setOriginalLevels(JSON.parse(JSON.stringify(levelsData))); // Backup
				setLoadError(null);
			} catch (error) {
				console.error(error);
				setLoadError(t("dlg.classification_load_error"));
				showDialog(
					t("dlg.attention"),
					t("dlg.classification_load_error"),
					"#1451B4",
					"OK",
					"error",
					() => { }
				);
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, [showDialog, t]);

	const handleChange = (id: number, field: keyof ClassificationLevel, value: string) => {
		setLevels((prev) =>
			prev.map((level) => {
				if (level.id !== id) return level;
				if (field === "display_order") return { ...level, display_order: Number(value) || 0 };
				if (
					field === "max_score" ||
					field === "max_percentage" ||
					field === "critical_trigger_threshold"
				) {
					return { ...level, [field]: value === "" ? null : Number(value) };
				}
				return { ...level, [field]: value };
			})
		);
	};

	const handleCancel = (levelId: number) => {
		const level = levels.find((l) => l.id === levelId);

		// Se for um nível novo (isNew), remover da lista
		if (level?.isNew) {
			setLevels((prev) => prev.filter((l) => l.id !== levelId));
			setExpandedIds((prev) => prev.filter((id) => id !== levelId));
			return;
		}

		// Se for um nível existente, restaurar valores originais
		const originalLevel = originalLevels.find((l) => l.id === levelId);
		if (originalLevel) {
			setLevels((prev) =>
				prev.map((l) => (l.id === levelId ? { ...originalLevel } : l))
			);
		}

		// Fechar o card
		setExpandedIds((prev) => prev.filter((id) => id !== levelId));
	};

	const handleSave = async (level: ClassificationLevel) => {
		try {
			setSavingId(level.id);
			if (!level.level_key.trim())
				throw new Error(t("dlg.classification_key_required"));

			const payload = {
				level_key: level.level_key,
				display_order: level.display_order,
				title: level.title,
				subtitle: level.subtitle,
				description: level.description,
				advice: level.advice,
				max_score: level.max_score,
				max_percentage: level.max_percentage,
				critical_trigger_threshold: level.critical_trigger_threshold,
			};

			const endpoint = level.isNew ? "classification-levels" : `classification-levels/${level.id}`;
			const method = level.isNew ? "POST" : "PUT";
			const res = await fetchApi(endpoint, method, payload);

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data?.message ?? "Erro ao salvar");
			}

			if (level.isNew) {
				const created = await res.json().catch(() => null);
				if (created?.id) {
					const savedLevel = { ...created, isNew: false };
					setLevels((prev) =>
						prev.map((item) => (item.id === level.id ? savedLevel : item))
					);
					// Adicionar ao backup
					setOriginalLevels((prev) => [...prev, savedLevel]);
				}
			} else {
				// Atualizar o backup com os valores salvos
				const savedLevel = { ...level, isNew: false };
				setOriginalLevels((prev) =>
					prev.map((item) => (item.id === level.id ? savedLevel : item))
				);
				showDialog(
					t("dlg.successTitle"),
					t("dlg.classification_updated"),
					"#1451B4",
					"OK",
					"success",
					() => { }
				);
			}

			// Fechar o card após salvar com sucesso
			setExpandedIds((prev) => prev.filter((id) => id !== level.id));

		} catch (error: any) {
			console.error(error);
			showDialog(
				t("dlg.attention"),
				error?.message ?? t("dlg.classification_save_error"),
				"#1451B4",
				"OK",
				"error",
				() => { }
			);
		} finally {
			setSavingId(null);
		}
	};

	const handleAddLevel = () => {
		const tempId = Date.now() * -1;
		setLevels((prev) => [
			...prev,
			{
				id: tempId,
				level_key: "",
				display_order: (prev.at(-1)?.display_order ?? prev.length) + 1,
				title: "",
				subtitle: "",
				description: "",
				advice: "",
				max_score: null,
				max_percentage: null,
				critical_trigger_threshold: null,
				isNew: true,
			},
		]);
		setExpandedIds((prev) => [...prev, tempId]);
	};

	const toggleExpanded = (id: number) => {
		setExpandedIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	return (
		<DefaultLayout>
			<div className="space-y-6 p-4 sm:p-6">
				<div className="flex flex-wrap justify-between gap-3">

					<h1 className="text-xl text-[#1451B4] font-bold pt-2">
						{t("classifications.title")}
					</h1>
					<button
						onClick={handleAddLevel}
						className="br-button primary mr-3 w-full sm:w-auto justify-center"
					>
						{t("classifications.addLevel")}
					</button>
				</div>

				{loading ? (
					<div className="rounded-3xl bg-white p-6 text-center shadow">{t("common.loading")}</div>
				) : levels.length === 0 ? (
					<div className="br-card">
						<div className="card-content text-center">
							<p className="text-sm text-gray-500">
								{t("classifications.noLevelsYet")}
							</p>
							{loadError && <p className="mt-2 text-xs text-pink-500">{loadError}</p>}
							<button
								onClick={handleAddLevel}
								className="br-button primary mt-4"
								title={t("classifications.addFirstLevel")}
							>
								{t("classifications.addFirstLevel")}
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{levels.map((level) => {
							const isExpanded = expandedIds.includes(level.id);
							return (
								<div key={level.id} className="br-card ">
									<div
										className="card-content  p-5 "
									>
										{/* Header: key + título em destaque */}
										<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
											<div className="flex-1 grid gap-3 md:grid-cols-2">
												<div>
													<label className="text-xs font-semibold text-gray-500">
														{t("classifications.identifier.label")} (level_key)
													</label>
													<input
														value={level.level_key}
														onChange={(event) =>
															handleChange(level.id, "level_key", event.target.value)
														}
														className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-[#1451B4]"
													/>
												</div>
												<div>
													<label className="text-xs font-semibold text-gray-500">
														{t("classifications.title.label")}
													</label>
													<input
														value={level.title}
														onChange={(event) =>
															handleChange(level.id, "title", event.target.value)
														}
														className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold"
													/>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
													{t("classifications.order.label")} {level.display_order}
												</span>
												<button
													type="button"
													onClick={() => toggleExpanded(level.id)}
													className="br-button secondary"
												>
													{isExpanded ? t("classifications.hideDetails") : t("classifications.showDetails")}
												</button>
											</div>
										</div>

										{/* Conteúdo colapsável */}
										{isExpanded && (
											<div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
												<div className="grid gap-3 md:grid-cols-3">
													<div>
														<label className="text-xs font-semibold text-gray-500">
															{t("classifications.display_order.label")}
														</label>
														<input
															type="number"
															value={level.display_order}
															onChange={(event) =>
																handleChange(
																	level.id,
																	"display_order",
																	event.target.value
																)
															}
															className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														/>
													</div>
													<div className="md:col-span-2">
														<label className="text-xs font-semibold text-gray-500">
															{t("classifications.subtitle.label")}
														</label>
														<input
															value={level.subtitle}
															onChange={(event) =>
																handleChange(
																	level.id,
																	"subtitle",
																	event.target.value
																)
															}
															className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														/>
													</div>
												</div>

												<div>
													<label className="text-xs font-semibold text-gray-500">
														{t("classifications.description.label")}
													</label>
													<textarea
														value={level.description}
														onChange={(event) =>
															handleChange(
																level.id,
																"description",
																event.target.value
															)
														}
														className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														rows={2}
													/>
												</div>

												<div>
													<label className="text-xs font-semibold text-gray-500">
														{t("classifications.guidance.label")}
													</label>
													<textarea
														value={level.advice}
														onChange={(event) =>
															handleChange(level.id, "advice", event.target.value)
														}
														className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														rows={2}
													/>
												</div>

												<div className="grid gap-3 md:grid-cols-3">
													<div>
														<label className="text-xs font-semibold text-gray-500">
															{t("classifications.max_score.label")}	(score)
														</label>
														<input
															type="number"
															value={formatNumber(level.max_score)}
															onChange={(event) =>
																handleChange(
																	level.id,
																	"max_score",
																	event.target.value
																)
															}
															className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														/>
													</div>
													<div>
														<label className="text-xs font-semibold text-gray-500">
															{t("classifications.max_percentage.label")} (%)
														</label>
														<input
															type="number"
															value={formatNumber(level.max_percentage)}
															onChange={(event) =>
																handleChange(
																	level.id,
																	"max_percentage",
																	event.target.value
																)
															}
															className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														/>
													</div>
													<div>
														<label className="text-xs font-semibold text-gray-500">
															{t("classifications.critical_trigger_threshold.label")}
														</label>
														<input
															type="number"
															value={formatNumber(
																level.critical_trigger_threshold
															)}
															onChange={(event) =>
																handleChange(
																	level.id,
																	"critical_trigger_threshold",
																	event.target.value
																)
															}
															className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
														/>
														<p className="mt-1 text-[11px] text-gray-400">
															{t("classifications.critical_trigger_threshold.help")}
														</p>
													</div>
												</div>

												<div className="mt-2 text-right">
													<button
														onClick={() => handleCancel(level.id)}
														disabled={savingId === level.id}
														className="br-button secondary mr-3"
														type="button"
													>
														{t("common.cancel")}
													</button>
													<button
														onClick={() => handleSave(level)}
														disabled={savingId === level.id}
														className="br-button primary mr-3"
													>
														{savingId === level.id ? t("common.saving") : t("common.save")}
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</DefaultLayout>
	);
}
