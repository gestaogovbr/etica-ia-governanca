"use client"
import { useDialog } from '@/contexts/DialogAlertContext';
import { fetchApi } from '@/service/api';
import { LanguageButton, useI18n } from "@/service/language";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

type token = {
	token: string,
	message: string,
}

const GOVBR_PUBLIC_BASE_URL = "https://eticaia.sistema.gov.br";

// ===== Component =====
const SignIn: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [adminSession, setAdminSession] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const popupInterval = useRef<ReturnType<typeof setInterval>>();
	const { lang, setLang, t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	const { showDialog } = useDialog();

	const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
	const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

	const cleanupPopupInterval = useCallback(() => {
		if (popupInterval.current) {
			clearInterval(popupInterval.current);
			popupInterval.current = undefined;
		}
	}, []);

	useEffect(() => {
		let apiOrigin = GOVBR_PUBLIC_BASE_URL;
		try {
			apiOrigin = new URL(GOVBR_PUBLIC_BASE_URL).origin;
		} catch {
			// ignore parse errors, fallback to raw value
		}

		const handleMessage = (event: MessageEvent) => {
			if (!event.data || (event.data as any).source !== "govbr-login") return;
			if (event.origin && apiOrigin && event.origin !== apiOrigin) return;

			cleanupPopupInterval();
			if (event.data.status === "success" && event.data.token) {
				localStorage.setItem("token", event.data.token as string);
				location.href = "/";
				return;
			}

			setIsLoading(false);
			const msg = (event.data as any)?.message || t("dlg.generalError");
			showDialog(t("dlg.attention"), msg, "#1451B4", t("dlg.tryAgain"), "error", () => { });
		};

		window.addEventListener("message", handleMessage);
		return () => {
			cleanupPopupInterval();
			window.removeEventListener("message", handleMessage);
		};
	}, [cleanupPopupInterval, showDialog, t]);

	const loginUser = () => {
		if (typeof window === "undefined") return;
		setIsLoading(true);

		const authorizeUrl = `${GOVBR_PUBLIC_BASE_URL}/govbr/authorize?origin=${encodeURIComponent(window.location.origin)}`;
		const popup = window.open(authorizeUrl, "govbr-login", "width=600,height=720");

		if (!popup) {
			setIsLoading(false);
			showDialog(t("dlg.attention"), t("dlg.generalError"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
			return;
		}

		popupInterval.current = setInterval(() => {
			if (popup.closed) {
				cleanupPopupInterval();
				setIsLoading(false);
			}
		}, 800);
	};

	const loginAdmin = async () => {
		try {
			setIsLoading(true);
			if (email && password) {
				const loginResponse = await fetchApi("auth/login", "POST", { email, password });
				const result: token = await loginResponse.json();
				if (!loginResponse.ok) {
					showDialog(t("dlg.attention"), t(result?.message) ?? t("dlg.cannotProceed"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
					setTimeout(() => setIsLoading(false), 1000);
				} else {
					if (result.token && result.token !== "") {
						localStorage.setItem("token", result.token);
						location.href = "/"
					} else {
						setTimeout(() => setIsLoading(false), 1000);
						showDialog(t("dlg.attention"), t("dlg.unableContinue"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
					}
				}
			} else {
				setIsLoading(false);
				showDialog(t("dlg.attention"), t("dlg.fillUserPass"), "#1451B4", t("dlg.tryAgain"), "info", () => { });
			}
		} catch (error) {
			setIsLoading(false);
			showDialog(t("dlg.attention"), t("dlg.generalError"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
		}
	};

	return (
		<div
			className="min-h-screen bg-cover bg-center px-4 sm:px-0"
			style={{
				backgroundImage: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url(/images/login/back.jpg)"
			}}
		>
			<LanguageButton lang={lang} onChange={setLang} right={true} />

			<div className="relative">
				<h2 className="mb-9 p-4 sm:p-10 font-bold text-center text-black dark:text-white text-xl sm:text-2xl">
					{t("app.title")}<br /> {t("app.acronym")}
				</h2>

				{!adminSession ? (
					<div className="bg-[#EFEFEF] w-full mx-0 my-8 md:mx-20 xl:w-1/2 rounded-[25px] max-w-3xl sm:mx-auto">
						<div className="w-full p-4 sm:p-12.5 xl:p-17.5">
							<h2 className="mb-9 text-xl font-bold text-left text-black dark:text-white sm:text-xl">
								{t("start.title")}
							</h2>
							<div className="mb-4">
								<label className="mb-2.5 block font-medium text-black dark:text-white">
									{t("start.desc")}
								</label>
							</div>
							<div className="mb-5">
								<div className="mb-5 pt-10">
									{isLoading ? (
										<div className="w-full flex justify-center items-center p-4 bg-gray-800 text-dark rounded-lg text-white">
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent mr-2" />
											{t("common.processing")}
										</div>
									) : (
										<button
											onClick={loginUser}
											className="br-sign-in large primary mt-3 mt-sm-0 ml-sm-3 w-full sm:w-auto justify-center"
											disabled={isLoading}
										>
											<span className="fas fa-user mr-2"></span>
											<span>{t("login.gov")}</span>
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="bg-[#EFEFEF] w-full mx-0 my-8 md:mx-20 xl:w-1/2 rounded-[25px] max-w-3xl sm:mx-auto">
						<div className="w-full p-4 sm:p-12.5 xl:p-17.5">
							<h2 className="mb-9 text-xl font-bold text-left text-black dark:text-white sm:text-xl">
								{t("admin.title")}
							</h2>
							<div className="relative">
								<label className="mb-2.5 block font-medium text-black dark:text-white">
									{t("admin.email.label")}
								</label>
								<input
									type="text"
									placeholder=""
									value={email}
									onChange={handleEmail}
									className="w-full rounded-lg border border-stroke bg-white h-12 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
								/>
							</div>
							{/* Campo Senha com botão de mostrar/esconder */}
							<div className="br-input input-button mb-5">
								<label className="mb-2.5 block font-medium text-black dark:text-white">
									{t("admin.pass.label")}
								</label>
								<div className="input-content">
									<input
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={handlePassword}
										className="input-button w-full rounded-lg border border-stroke bg-white h-12 pl-6 pr-12 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="br-button absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors pt-20"
										aria-label={showPassword ? t("signin.hide_password") : t("signin.show_password")}
									>
										<i
											className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} mt-2`}
											aria-hidden="true"
										></i>
									</button>
								</div>
							</div>
							<div className="mb-5 pt-5">
								<div className="mb-5">
									{isLoading ? (
										<button
											onClick={() => { }}
											style={{ padding: '10px 26px', borderRadius: '100em' }}
											className="br-button secundary mb-3"
										>
											<div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-white border-t-transparent mr-2 text-[#1451B4] font-bold" /> {t("common.processing")}
										</button>
									) : (
										<button
											onClick={loginAdmin}
											className="br-button primary mb-3 w-full sm:w-auto justify-center"
										>
											{t("admin.access")}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="fixed bottom-6 left-0 right-0 flex justify-center">
				<div className="flex items-center gap-1">
					<Image src="/images/logo/govbrlogin.png" alt={t("signin.logo_alt")} width={140} height={140} className="object-contain" />
					{/* <span className="text-md leading-tight">
						{t("gov.text1")}<br></br>{t("gov.text2")}
					</span> */}
				</div>
			</div>

			<div className="text-right text-sm fixed bottom-4 right-0 mr-1">
				<button
					className="underline"
					onClick={() => { setAdminSession(!adminSession) }}
				>
					{adminSession ? t("footer.toggle.responder") : t("footer.toggle.admin")}
				</button>
			</div>
		</div>
	);
};

export default SignIn;
