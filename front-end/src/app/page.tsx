"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

type StatusBreakdown = {
	status: string | null;
	count: number;
};

type SessionAverage = {
	session_id: number;
	session_name: string | null;
	average_score: number | null;
	responses: number;
};

type AnswerLeader = {
	question_id: number;
	question_text: string;
	value: string | null;
	count: number;
};

type DashboardData = {
	overview: {
		totalProjects: number;
		totalResponses: number;
		finishedResponses: number;
	};
	statusBreakdown: StatusBreakdown[];
	sessionAverages: SessionAverage[];
	answerLeaders: AnswerLeader[];
};

const formatNumber = (value: number) =>
	new Intl.NumberFormat("pt-BR").format(Number(value) || 0);

function SummaryCard({
	label,
	value,
	subtitle,
}: {
	label: string;
	value: number | string;
	subtitle?: string;
}) {
	return (
		<div className="br-card">
			<div className="card-content">
				<p className="text-sm text-gray-500">{label}</p>
				<p className="mt-2 text-3xl font-semibold text-[#0F3B62]">{value}</p>
				{subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
			</div>
		</div>
	);
}

export default function Home() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [mounted, setMounted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	const ReactApexChart = useMemo(
		() =>
			dynamic(() => import("react-apexcharts"), {
				ssr: false,
				loading: () => (
					<div className="text-sm text-gray-400">{t("home.loading_chart")}</div>
				),
			}),
		[t],
	);
	const STATUS_LABELS: Record<string, string> = {
		FINISHED: t("home.status.finished"),
		SUBMITTED: t("home.status.submitted"),
		PENDING: t("home.status.pending"),
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (typeof document !== "undefined") {
			document.title = t("home.document_title");
		}
	}, [t]);

	useEffect(() => {
		const loadDashboard = async () => {
			try {
				setLoading(true);
				const res = await fetchApi("dashboard", "GET");
				if (!res.ok) {
					throw new Error(t("home.dlg_error_loading_indicators"));
				}
				const json = await res.json();
				setData(json);
				setError(null);
			} catch (err: any) {
				console.error(err);
				setError(err?.message ?? t("home.err_unexpected_loading_dashboard"));
			} finally {
				setLoading(false);
			}
		};
		void loadDashboard();
	}, []);

	const totalStatus = useMemo(() => {
		if (!data?.statusBreakdown?.length) return 0;
		return data.statusBreakdown.reduce(
			(sum, item) => sum + (item?.count || 0),
			0,
		);
	}, [data?.statusBreakdown]);

	const orderedSessions = useMemo(() => {
		if (!data?.sessionAverages?.length) return [];
		return [...data.sessionAverages].sort(
			(a, b) => Number(b.average_score ?? 0) - Number(a.average_score ?? 0),
		);
	}, [data?.sessionAverages]);

	const statusChart = useMemo(() => {
		if (!data?.statusBreakdown?.length || !totalStatus) {
			return { labels: [] as string[], series: [] as number[] };
		}

		const validItems = data.statusBreakdown.filter(
			(item) =>
				item &&
				item.status !== null &&
				item.status !== undefined &&
				!Number.isNaN(item.count),
		);

		const labels = validItems.map((item) => {
			const key = String(item.status);
			return STATUS_LABELS[key] ?? key ?? t("home.no_status");
		});

		const series = validItems.map((item) => Number(item.count || 0));

		return { labels, series };
	}, [data?.statusBreakdown, totalStatus]);

	const sessionChart = useMemo(() => {
		if (!orderedSessions.length) {
			return { categories: [] as string[], series: [] as number[] };
		}

		const categories = orderedSessions.map((session, idx) =>
			session.session_name && session.session_name.trim().length > 0
				? session.session_name
				: `${t("sessions.one")} ${idx + 1}`,
		);

		const series = orderedSessions.map((session) =>
			Number(Number(session.average_score ?? 0).toFixed(2)),
		);

		return { categories, series };
	}, [orderedSessions]);

	if (loading) {
		return (
			<DefaultLayout>
				<div className="flex min-h-[60vh] items-center justify-center">
					<div className="rounded-3xl bg-white px-6 py-4 text-sm text-gray-500 shadow">
						{t("home.loading_panel")}
					</div>
				</div>
			</DefaultLayout>
		);
	}

	return (
		<DefaultLayout>
			<div className="space-y-6 p-4 sm:p-6">
				<h1 className="text-xl text-[#1451B4] font-bold">
					{t("home.document_title")}
				</h1>

				{error && (
					<div className="rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm text-pink-700">
						{error}
					</div>
				)}

				{data && (
					<>
						<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
							<SummaryCard
								label={t("home.total_registered_projects")}
								value={formatNumber(data.overview.totalProjects)}
							/>
							<SummaryCard
								label={t("home.started_assessments")}
								value={formatNumber(data.overview.totalResponses)}
							/>
							<SummaryCard
								label={t("home.finished_assessments")}
								value={formatNumber(data.overview.finishedResponses)}
							/>
						</div>

						<div className="grid gap-6 lg:grid-cols-2">
							{/* Donut status */}
							<div className="br-card">
								<div className="card-header">
									<h2 className="text-lg font-semibold text-gray-900">
										{t("home.chart_status_distribution_title")}
									</h2>
									<p className="text-sm text-gray-500">
										{t("home.chart_status_distribution_desc")}
									</p>
								</div>
								<div className="card-content">
									{mounted &&
										statusChart.series.length &&
										statusChart.labels.length ? (
											<ReactApexChart
												type="pie"
												height={320}
												width="100%"
												series={statusChart.series}
												options={{
													chart: {
														id: "status-chart",
														toolbar: { show: false },
														animations: { enabled: true },
													},
													labels: statusChart.labels,
													dataLabels: { enabled: true },
													legend: { position: "bottom" },
													colors: ["#0C326F", "#711F6C", "#0F3B62", "#9CA3AF"],
													noData: {
														text: t("home.no_data"),
													},
												}}
											/>
										) : (
											<p className="text-sm text-gray-500">
												{t("home.chart_status_distribution_no_data")}
											</p>
										)}
								</div>
							</div>

							{/* Bar sessions */}
							<div className="br-card">
								<div className="card-header">
									<h2 className="text-lg font-semibold text-gray-900">
										{t("home.chart_session_averages_title")}
									</h2>
									<p className="text-sm text-gray-500">
										{t("home.chart_session_averages_desc")}
									</p>
								</div>
								<div className="card-content">
									{mounted &&
										sessionChart.series.length &&
										sessionChart.categories.length ? (
											<ReactApexChart
												type="bar"
												height={320}
												width="100%"
												series={[
													{
														name: t("home.session_average_series"),
														data: sessionChart.series,
													},
												]}
												options={{
													chart: {
														id: "session-chart",
														toolbar: { show: false },
														animations: { enabled: true },
													},
													plotOptions: {
														bar: {
															borderRadius: 6,
															horizontal: true,
															dataLabels: {
																position: "top",
															},
														},
													},
													dataLabels: {
														enabled: true,
														textAnchor: "start",
														offsetX: 14,
														style: {
															colors: ["#111827"],
															fontWeight: 700,
														},
														formatter: (val) => {
															const num = Array.isArray(val)
																? Number(val[0])
																: Number(val);
															if (Number.isNaN(num)) return "";
															return `${num.toFixed(2)} pts`;
														},
													},
													xaxis: {
														categories: sessionChart.categories,
														labels: {
															style: { colors: "#6B7280" },
														},
													},
													yaxis: {
														labels: { style: { colors: "#374151" } },
													},
													colors: ["#0C326F"],
													grid: { strokeDashArray: 4 },
													noData: {
														text: t("home.no_data"),
													},
												}}
											/>
										) : (
											<p className="text-sm text-gray-500">
												{t("home.chart_session_averages_no_data")}
											</p>
										)}
								</div>
							</div>
						</div>

						<div className="br-card">
							{/* <div className="card-header">
									<h2 className="text-lg font-semibold text-gray-900">
											Respostas mais frequentes por questão
									</h2>
									<p className="text-sm text-gray-500">
											Identifique padrões nas escolhas dos avaliadores.
									</p>
							</div> */}
							<div className="card-content">
								<div className="overflow-x-auto">
									<div className="br-table" data-search="data-search">
										<div className="table-header">
											<div className="top-bar">
												<div className="table-title">{t("home.section_answer_frequency_title")}</div>
											</div>
										</div>

										<table>
											<caption>{t("home.section_answer_frequency_title")}</caption>
											<thead>
												<tr>
													<th scope="col" style={{ width: "50%" }}>
														{t("questions.one")}
													</th>
													<th scope="col" style={{ width: "30%" }}>
														{t("home.section_answer_frequency_most_sent")}
													</th>
													<th
														scope="col"
														style={{ width: "20%" }}
														className="text-right"
													>
														{t("home.section_answer_frequency_occurrences")}
													</th>
												</tr>
											</thead>
											<tbody>
												{data.answerLeaders.length ? (
													data.answerLeaders.map((leader) => (
														<tr key={leader.question_id}>
															<td
																data-th={t("questions.one")}
																className="word-wrap"
															>
																{leader.question_text}
															</td>
															<td
																data-th={t("home.section_answer_frequency_most_sent")}
																className="word-wrap"
															>
																{leader.value || "—"}
															</td>
															<td
																data-th={t("home.section_answer_frequency_occurrences")}
																className="text-right"
															>
																<strong>{formatNumber(leader.count)}</strong>
															</td>
														</tr>
													))
												) : (
													<tr>
														<td colSpan={3} className="text-center">
															{t("home.section_answer_frequency_no_data")}
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</DefaultLayout>
	);
}
