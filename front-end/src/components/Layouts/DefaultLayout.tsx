"use client";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useDialog } from '@/contexts/DialogAlertContext'
import { fetchApi } from '@/service/api'
import { useI18n } from "@/service/language";
import 'react-toastify/dist/ReactToastify.css';
export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { showDialog } = useDialog();
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	const [loading, setIsLoading] = useState(false);
	const [user, setUser] = useState<any | null>(null) ;

	const checkUser = async () => {
		try {
			setIsLoading(true);
			const isAutenticated = await fetchApi("auth/login", "GET");
			const result:any = await isAutenticated.json();
			if (!isAutenticated.ok) {
				showDialog(t("dlg.attention"), t(result?.message) ?? t("dlg.cannotProceed"), "#1451B4", t("dlg.tryAgain"), "error", () => {
					localStorage.clear()
					location.reload()
				 });
				setTimeout(() => setIsLoading(false), 1000);
			}else{
				setUser(result)
				setTimeout(() => setIsLoading(false), 1000);
			}
		}
		catch (error) {
			setIsLoading(false);
			showDialog(t("dlg.attention"), t("dlg.generalError"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
		}
	};

	useEffect(()=>{
		checkUser()
	}, [])

	return loading ? (
		<Loader />
	) : (
		<>
			{/* <!-- ===== Page Wrapper Start ===== --> */}
			<div className="flex h-screen overflow-hidden" style={{ fontFamily: '"rawline", helvetica, arial, sans-serif' }}>
				{/* <!-- ===== Sidebar Start ===== --> */}
				<Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} menu={user?.menu ?? []} />
				{/* <!-- ===== Sidebar End ===== --> */}

				{/* <!-- ===== Content Area Start ===== --> */}
				<div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
					{/* <!-- ===== Header Start ===== --> */}
					<Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
					{/* <!-- ===== Header End ===== --> */}

					{/* <!-- ===== Main Content Start ===== --> */}
					<main>
						<div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10" style={{ paddingTop: 10 }}>
							{children}
						</div>
					</main>
					{/* <!-- ===== Main Content End ===== --> */}
				</div>
				{/* <!-- ===== Content Area End ===== --> */}
			</div>
			{/* <!-- ===== Page Wrapper End ===== --> */}
		</>
	);
}
