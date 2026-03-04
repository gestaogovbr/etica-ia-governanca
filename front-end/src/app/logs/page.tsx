"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { useEffect, useMemo, useState } from "react";

type LogRow = {
	id: number;
	user_id: number | null;
	user_email: string | null;
	ip: string | null;
	action: string;
	module: string;
	record_id: string | null;
	route: string | null;
	method: string | null;
	status: string;
	detail: any;
	user_agent: string | null;
	date_created: string;
};

export default function LogsPage() {
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	const { showDialog } = UseDialog();

	const [rows, setRows] = useState<LogRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [limit, setLimit] = useState(100);

	// filtros
	const [fUser, setFUser] = useState("");      // email ou id
	const [fRoute, setFRoute] = useState("");
	const [fAction, setFAction] = useState("");
	const [fModule, setFModule] = useState("");
	const [fFrom, setFFrom] = useState<string>("");
	const [fTo, setFTo] = useState<string>("");

	const [openDetail, setOpenDetail] = useState<LogRow | null>(null);

	const buildQuery = () => {
		const p = new URLSearchParams();
		if (limit) p.set("limit", String(limit));
		if (fUser) p.set("user", fUser);
		if (fRoute) p.set("route", fRoute);
		if (fAction) p.set("action", fAction);
		if (fModule) p.set("module", fModule);
		if (fFrom) p.set("from", new Date(fFrom).toISOString());
		if (fTo) p.set("to", new Date(fTo).toISOString());
		return p.toString();
	};

	const load = async () => {
		setLoading(true);
		try {
			const qs = buildQuery();
			const res = await fetchApi(`logs?${qs}`, "GET");
			const json = await res.json();
			if (res.ok) setRows(json);
			else showDialog(t("dlg.attention"), t("dlg.unableContinue"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const actions = useMemo(
		() => [
			{ value: "", label: t("common.all") },
			{ value: "login", label: t("logs.action.login") },
			{ value: "create", label: t("logs.action.create") },
			{ value: "update", label: t("logs.action.update") },
			{ value: "delete", label: t("logs.action.delete") },
			{ value: "logout", label: t("logs.action.logout") },
			{ value: "other", label: t("logs.action.other") },
		],
		[t]
	);

	const modules = useMemo(
		() => [
			{ value: "", label: t("common.all") },
			{ value: "admin", label: t("logs.module.admin") },
			{ value: "session", label: t("logs.module.session") },
			{ value: "question", label: t("logs.module.question") },
			{ value: "auth", label: t("logs.module.auth") },
			{ value: "unknown", label: t("logs.module.unknown") },
		],
		[t]
	);

	const reset = () => {
		setFUser("");
		setFRoute("");
		setFAction("");
		setFModule("");
		setFFrom("");
		setFTo("");
		setLimit(100);
	};

	return (
		<DefaultLayout>
			<div className="p-4 sm:p-6">
				<div className="mb-4 flex flex-col gap-3 md:flex-row  md:justify-between">
					<h1 className="text-xl text-[#1451B4] pt-2 font-bold leading-tight md:flex-shrink-0">{t("logs.title")}</h1>
					<div className="flex w-full gap-2 md:w-auto md:flex-nowrap">
						<button
							onClick={reset}
							className="br-button secondary mr-3 w-full sm:w-auto justify-center"
						>
							{t("logs.clear")}
						</button>
						<button
							onClick={load}
							className="br-button primary mr-3 w-full sm:w-auto justify-center"
						>
							{loading ? t("logs.loading") : t("logs.loading")}
						</button>
					</div>
				</div>

				{/* Filtros */}
				<div className="br-card">
					<div className="card-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
						<div className="sm:col-span-2">
							<label className="block mb-1">{t("logs.user")}</label>
							<input
								value={fUser}
								onChange={(e) => setFUser(e.target.value)}
								className="br-input"
								placeholder={t("logs.user.placeholder")}
							/>
						</div>
						<div className="sm:col-span-2">
							<label className="block mb-1">{t("logs.route")}</label>
							<input
								value={fRoute}
								onChange={(e) => setFRoute(e.target.value)}
								className="br-input"
								placeholder={t("logs.route.placeholder")}
							/>
						</div>
						<div>
							<label className="block mb-1">{t("logs.action")}</label>
							<select
								value={fAction}
								onChange={(e) => setFAction(e.target.value)}
								className="br-select"
							>
								{actions.map((action) => (
									<option key={action.value} value={action.value}>
										{action.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block mb-1">{t("logs.module")}</label>
							<select
								value={fModule}
								onChange={(e) => setFModule(e.target.value)}
								className="br-select"
							>
								{modules.map((module) => (
									<option key={module.value} value={module.value}>
										{module.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block mb-1">{t("logs.of")}</label>
							<input
								type="datetime-local"
								value={fFrom}
								onChange={(e) => setFFrom(e.target.value)}
								className="br-input"
							/>
						</div>
						<div>
							<label className="block mb-1">{t("logs.until")}</label>
							<input
								type="datetime-local"
								value={fTo}
								onChange={(e) => setFTo(e.target.value)}
								className="br-input"
							/>
						</div>

						<div>
							<label className="block mb-1">{t("logs.limit")}</label>
							<input
								type="number"
								value={limit}
								onChange={(e) => setLimit(Number(e.target.value))}
								className="br-input"
								min={1}
								max={500}
							/>
						</div>
					</div>
				</div>

				{/* Tabela */}
				<div className="br-card">
					<div className="card-content overflow-x-auto -mx-4 sm:mx-0">
						<table className="min-w-full divide-y divide-gray-300 bg-white">
							<thead>
								<tr>
									<th className="py-2 px-4 border-b text-left">{t("logs.date")} / {t("logs.status")}</th>
									<th className="py-2 px-4 border-b text-left">{t("logs.user")} / {t("logs.action")}</th>
									<th className="py-2 px-4 border-b text-left">{t("logs.module")} / {t("logs.method")}</th>
									<th className="py-2 px-4 border-b text-left">{t("logs.route")} / {t("logs.ip")}</th>
									<th className="py-2 px-4 border-b text-center">{t("logs.details")}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{rows.map((r) => (
									<tr key={r.id}>
										<td className="py-2 px-4 text-sm">
											<div className="font-medium text-gray-800">
												{new Date(r.date_created).toLocaleString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
													second: "2-digit",
												})}
											</div>
											<div className={`font-semibold rounded-sm ${r.status=="ERROR" ? "bg-[#D62D79]" : "bg-[#188821]"	} text-center w-full px-2 py-1 text-xs font-medium text-white`}>
												{r.status}
											</div>
										</td>
										<td className="py-2 px-4 text-sm">
											<div className="font-medium text-gray-800 truncate">
												{r.user_email ?? "-"} {r.user_id ? `(#${r.user_id})` : ""}
											</div>
											<div className="font-semibold rounded-sm bg-[#165BCA] text-center w-full px-2 py-1 text-xs font-medium text-white">
												{r.action}
											</div>
										</td>
										<td className="py-2 px-4 text-sm">
											<div className="font-medium text-gray-800">{r.module}</div>
											<div className="font-semibold rounded-sm bg-[#711F6C] text-center w-full px-2 py-1 text-xs font-medium text-white">
												{r.method ?? "-"}
											</div>
										</td>
										<td className="py-2 px-4 text-sm">
											<div className="max-w-[280px] truncate" title={r.route ?? ""}>
												{r.route ?? "-"}
											</div>
											<div className="font-semibold rounded-sm bg-[#48CBEA] text-center w-full px-2 py-1 text-xs font-medium text-white">
												{r.ip ?? "-"}
											</div>
										</td>
										<td className="py-2 px-4 text-center">
											<button
												className="br-button circle"
												onClick={() => setOpenDetail(r)}
												title={t("common.view")}
											>
												<i className="fas fa-eye"></i>
											</button>
										</td>
									</tr>
								))}
								{!rows.length && (
									<tr>
										<td colSpan={5} className="py-6 text-center text-gray-500">
											{loading ? t("logs.loading") : t("logs.noRecords")}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Modal detalhe */}
				{openDetail && (
					<div
						className="fixed inset-0 bg-black/50 flex items-center justify-center"
						style={{ zIndex: 9999 }}
					>
						<div className="bg-white rounded-md shadow-lg w-[900px] max-h-[80vh] overflow-hidden">
							<div className="p-4 border-b flex items-center justify-between">
								<h3 className="font-semibold">
									{t("logs.detail_title")} #{openDetail.id}
								</h3>
								<button className="text-gray-600 hover:text-black" onClick={() => setOpenDetail(null)}>
									✕
								</button>
							</div>
							<div className="p-4 grid grid-cols-2 gap-3 border-b">
								<div><b>{t("logs.date")}:</b> {new Date(openDetail.date_created).toLocaleString("pt-BR")}</div>
								<div><b>{t("logs.user")}:</b> {openDetail.user_email ?? "-"} {openDetail.user_id ? `(#${openDetail.user_id})` : ""}</div>
								<div><b>IP:</b> {openDetail.ip ?? "-"}</div>
								<div><b>{t("logs.user_agent")}:</b> <span className="break-all">{openDetail.user_agent ?? "-"}</span></div>
								<div><b>{t("logs.action")}:</b> {openDetail.action}</div>
								<div><b>{t("logs.module")}:</b> {openDetail.module}</div>
								<div><b>{t("logs.route")}:</b> <span className="break-all">{openDetail.route ?? "-"}</span></div>
								<div><b>{t("logs.method")}:</b> {openDetail.method ?? "-"}</div>
								<div><b>Status:</b> {openDetail.status}</div>
								<div><b>ID:</b> {openDetail.record_id ?? "-"}</div>
							</div>
							<div className="p-4 overflow-auto max-h-[50vh]">
								<pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto whitespace-pre-wrap break-words">
									{JSON.stringify(openDetail.detail, null, 2)}
								</pre>
							</div>
							<div className="p-3 border-t text-right">
								<button className="rounded bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm" onClick={() => setOpenDetail(null)}>
									{t("common.close")}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DefaultLayout>
	);
}
