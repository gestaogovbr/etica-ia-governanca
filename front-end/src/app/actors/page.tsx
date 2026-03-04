"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Actor = {
	id?: number;
	name: string;
	active: boolean;
	date_created?: string;
	date_updated?: string;
};

const initialForm: Actor = {
	name: "",
	active: true,
};

export default function ActorsPage() {
	const { showDialog } = UseDialog();
	const { t } = useI18n();

	const [actors, setActors] = useState<Actor[]>([]);
	const [loading, setLoading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editing, setEditing] = useState<Actor | null>(null);
	const [form, setForm] = useState<Actor>(initialForm);
	const [filter, setFilter] = useState("");

	const loadActors = async () => {
		setLoading(true);
		try {
			const res = await fetchApi("actors", "GET");
			const data = await res.json().catch(() => []);
			if (res.ok && Array.isArray(data)) {
				setActors(data);
			} else {
				setActors([]);
			}
		} catch (error) {
			console.log(error);
			showDialog(t("dlg.attention"), t("dlg.actor_load_error"), "#1451B4", t("dlg.ok"), "error", () => { });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadActors();
	}, []);

	const filtered = useMemo(() => {
		if (!filter) return actors;
		const needle = filter.toLowerCase();
		return actors.filter((actor) => actor.name.toLowerCase().includes(needle));
	}, [actors, filter]);

	const toggleModal = (actor?: Actor) => {
		if (actor) {
			setEditing(actor);
			setForm({ name: actor.name, active: actor.active });
		} else {
			setEditing(null);
			setForm(initialForm);
		}
		setIsModalOpen((prev) => !prev);
	};

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const save = async () => {
		if (!form.name.trim()) {
			showDialog(t("dlg.attention"), t("dlg.fill_actor_name"), "#1451B4", t("dlg.ok"), "error", () => { });
			return;
		}

		const payload = { name: form.name.trim(), active: form.active };
		const isEdit = !!editing?.id;
		const url = isEdit ? `actors/${editing?.id}` : "actors";
		const method = isEdit ? "PUT" : "POST";

		try {
			const res = await fetchApi(url, method, payload);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showDialog(t("dlg.attention"), data?.message ?? t("dlg.actor_save_error"), "#E02424", t("dlg.ok"), "error", () => { });
				return;
			}
			await loadActors();
			showDialog(t("dlg.success"), t("dlg.saved"), "#1451B4", t("dlg.thanks"), "success", () => { });
			toggleModal();
		} catch (error) {
			console.log(error);
		}
	};

	const toggleActive = async (actor: Actor) => {
		if (!actor.id) return;
		try {
			const res = await fetchApi(`actors/${actor.id}`, "PUT", {
				name: actor.name,
				active: !actor.active,
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showDialog(t("dlg.attention"), data?.message ?? t("dlg.actor_update_error"), "#E02424", t("dlg.ok"), "error", () => { });
				return;
			}
			await loadActors();
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<DefaultLayout>
			<div className="p-4 sm:p-6 pt-0">
				<div className="flex w-full flex-col gap-3 md:flex-row md:items-center pt-0" >
					<h1 className="text-xl text-[#1451B4] font-bold leading-tight pt-6 md:pt-10">
						{t("actors.title")}
					</h1>
					<div className="md:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
						<input
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder={t("common.search")}
							className="w-full sm:w-64 rounded-md border border-gray-300 p-2"
						/>
						<button
							className="br-button primary w-full sm:w-auto justify-center"
							onClick={() => toggleModal()}
						>
							{t("common.add")}
						</button>
					</div>
				</div>

				<div className="br-card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-500">
								{filtered.length} {t("common.result")}{filtered.length === 1 ? "" : "s"} {t("common.found")}{filtered.length === 1 ? "" : "s"}
							</p>
						</div>

						<div className="mt-4 overflow-x-auto -mx-4 sm:mx-0">
							<table className="min-w-full divide-y divide-gray-300 bg-white">
								<thead>
									<tr>
										<th className="py-2 px-4 border-b text-left">{t("actors.name")}</th>
										<th className="py-2 px-4 border-b text-left">{t("actors.status")}</th>
										<th className="py-2 px-4 border-b text-left">{t("actors.updated_in")}</th>
										<th className="py-2 px-4 border-b text-center">{t("actors.actions")}</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{loading && (
										<tr>
											<td colSpan={4} className="py-4 text-center text-gray-500">
												{t("common.loading")}
											</td>
										</tr>
									)}
									{!loading && !filtered.length && (
										<tr>
											<td colSpan={4} className="py-4 text-center text-gray-500">
												{t("actors.no_records")}
											</td>
										</tr>
									)}
									{!loading &&
										filtered.map((actor) => (
											<tr key={actor.id ?? actor.name}>
												<td className="py-2 px-4 font-medium text-gray-800">{actor.name}</td>
												<td className="py-2 px-4">
													{actor.active ? (
														<div className="font-semibold  rounded-sm bg-[#188821] text-center w-full px-2 py-1 text-xs font-medium text-white">
															{t("actors.active")}
														</div>
													) : (
														<div className="font-semibold  rounded-sm bg-[#D62D79] text-center w-full px-2 py-1 text-xs font-medium text-white">
															{t("actors.inactive")}
														</div>
													)}
												</td>
												<td className="py-2 px-4 text-sm text-gray-500">
													{actor.date_updated
														? new Date(actor.date_updated).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})
														: "-"}
												</td>
												<td className="py-2 px-4 text-right space-x-2">
													<button
														className="br-button circle mr-2"
														onClick={() => toggleModal(actor)}
														title={t("common.edit")}
													>
														<i className="fas fa-edit"></i>
													</button>
													<button
														className={`br-button circle mr-2`}
														onClick={() => toggleActive(actor)}
														title={actor.active ? t("actors.inactivate") : t("actors.activate")}
													>
														{/* {actor.active ? t("actors.inactivate") : t("actors.activate")} */}
														<i className={`fas fa-${actor.active ? "user-times" : "user-check"}`}></i>
													</button>
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{isModalOpen && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 9999 }}>
						<div className="bg-white p-6 rounded-md shadow-lg w-[460px] max-w-[92vw]">
							<h2 className="text-xl font-bold mb-4">{editing ? t("actors.edit") : t("actors.add")}</h2>
							<div className="space-y-4">
								<div>
									<label className="block mb-1 text-sm font-medium text-gray-700">{t("actors.name")}</label>
									<input
										name="name"
										value={form.name}
										onChange={onChange}
										className="mt-1 block w-full rounded-md border border-gray-300 p-2"
									/>
								</div>
								<div className="br-checkbox">
									<input
										id="actor_edit_active"
										type="checkbox"
										name="active"
										checked={form.active}
										onChange={onChange}
									/>
									<label htmlFor="actor_edit_active">{t("actors.active")}</label>
								</div>
							</div>
							<div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
								<button
									className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 w-full sm:w-auto"
									onClick={() => toggleModal()}
								>
									{t("actors.cancel")}
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
			</div>
		</DefaultLayout>
	);
}
