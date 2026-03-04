"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { useEffect, useMemo, useState } from "react";

type ProjectInfo = {
	id?: number | string;
	name?: string;
	responsible?: string;
};

type ResultSummary = {
	level?: number;
	levelTitle?: string;
	levelSubtitle?: string;
	score?: number;
	percentage?: number;
};

type ResponseRecord = {
	id: number;
	date_created?: string;
	date_updated?: string;
	project?: ProjectInfo | null;
	result?: {
		summary?: ResultSummary | null;
	} | null;
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

const formatScore = (value?: number | null) => {
	if (typeof value !== "number" || Number.isNaN(value)) return "-";
	return `${value.toFixed(2)} pts`;
};

export default function ProjectsReceivedPage() {
	const [responses, setResponses] = useState<ResponseRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [levelFilter, setLevelFilter] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const res = await fetchApi("responses?status=FINISHED", "GET");
				if (!res.ok) {
					throw new Error(t("projects_received.load_error"));
				}
				const data = await res.json();
				setResponses(Array.isArray(data) ? data : []);
				setError(null);
			} catch (err: any) {
				console.error(err);
				setError(err?.message ?? t("common.loadingError"));
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	const levelOptions = useMemo(() => {
		const set = new Set<string>();
		responses.forEach((response) => {
			const levelTitle = response.result?.summary?.levelTitle;
			if (levelTitle) set.add(levelTitle);
		});
		return Array.from(set);
	}, [responses]);

	const filteredResponses = useMemo(() => {
		return responses.filter((response) => {
			const projectName = response.project?.name?.toLowerCase() ?? "";
			const responsible = response.project?.responsible?.toLowerCase() ?? "";
			const term = searchTerm.toLowerCase();
			if (term && !projectName.includes(term) && !responsible.includes(term)) {
				return false;
			}

			const levelTitle = response.result?.summary?.levelTitle ?? "";
			if (levelFilter && levelTitle !== levelFilter) {
				return false;
			}

			const dateValue = response.date_updated ?? response.date_created;
			if (startDate) {
				const start = new Date(startDate);
				const current = dateValue ? new Date(dateValue) : null;
				if (!current || current < start) return false;
			}
			if (endDate) {
				const end = new Date(`${endDate}T23:59:59`);
				const current = dateValue ? new Date(dateValue) : null;
				if (!current || current > end) return false;
			}

			return true;
		});
	}, [responses, searchTerm, levelFilter, startDate, endDate]);

	return (
		<DefaultLayout>
			<div className="space-y-6 p-4 sm:p-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-xl text-[#1451B4] font-bold">{t("projects_received.title")}</h1>
				</div>

				<div className="br-card">
					<div className="card-content">
						<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
							<div>
								<label className="text-xs font-semibold text-gray-600">{t("projects_received.search.label")}</label>
								<input
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0F3B62] focus:outline-none"
									placeholder={t("projects_received.search_placeholder.label")}
								/>
							</div>
							<div>
								<label className="text-xs font-semibold text-gray-600">{t("projects_received.level.label")}</label>
								<select
									value={levelFilter}
									onChange={(event) => setLevelFilter(event.target.value)}
									className="br-select mt-1 "
								>
									<option value="">{t("common.all")}</option>
									{levelOptions.map((level) => (
										<option key={level} value={level}>
											{level}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-xs font-semibold text-gray-600">{t("projects_received.startDate.label")}</label>
								<input
									type="date"
									value={startDate}
									onChange={(event) => setStartDate(event.target.value)}
									className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0F3B62] focus:outline-none"
								/>
							</div>
							<div>
								<label className="text-xs font-semibold text-gray-600">{t("projects_received.endDate.label")}</label>
								<input
									type="date"
									value={endDate}
									onChange={(event) => setEndDate(event.target.value)}
									className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#0F3B62] focus:outline-none"
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="br-card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-500">
								{filteredResponses.length} {t("common.result")}{filteredResponses.length === 1 ? "" : "s"} {t("common.found")}{filteredResponses.length === 1 ? "" : "s"}
							</p>
						</div>

						<div className="mt-4 overflow-x-auto -mx-4 sm:mx-0">
							<table className="min-w-full divide-y divide-gray-200 text-sm">
								<thead>
									<tr className="text-left text-xs uppercase tracking-wider text-gray-500">
										<th className="py-2">{t("common.date")}</th>
										<th className="py-2">{t("projects_received.project.label")}</th>
										<th className="py-2">{t("projects_received.organ.label")}</th>
										<th className="py-2">{t("projects_received.level.label")}</th>
										<th className="py-2">{t("projects_received.score.label")}</th>
										<th className="py-2 text-center">{t("common.actions")}</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{!filteredResponses.length && !loading ? (
										<tr>
											<td colSpan={6} className="py-6 text-center text-gray-500">
												{t("common.noResults")}
											</td>
										</tr>
									) : (
										filteredResponses.map((response) => {
											const summary = response.result?.summary;
											return (
												<tr key={response.id}>
													<td className="py-1 px-4 text-center text-sm whitespace-nowrap truncate">
														{formatDateTime(response.date_updated ?? response.date_created)}</td>
													<td className="py-2">{response.project?.name ?? "-"}</td>
													<td className="py-2">{response.project?.responsible ?? "-"}</td>
													<td className="py-2">
														<div className="flex flex-col">
															<span className="font-semibold text-gray-800">{summary?.levelTitle ?? "-"}</span>
															{summary?.levelSubtitle && (
																<span className="text-xs text-gray-500">{summary.levelSubtitle}</span>
															)}
														</div>
													</td>
													<td className="py-2">{formatScore(summary?.score)}</td>
													<td className="py-2 text-center">
														<a
															href={`/responses?responseId=${response.id}&result=true`}
															className="br-button circle"
															title={t("common.view")}
														>
															<i className="fas fa-eye"></i>
														</a>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</DefaultLayout>
	);
}
