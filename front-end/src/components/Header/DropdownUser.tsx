import { useDialog } from '@/contexts/DialogAlertContext';
import { fetchApi } from "@/service/api";
import { LanguageButton, useI18n } from "@/service/language";
import React, { useEffect, useRef, useState } from "react";

const DropdownUser: React.FC<{ user: any }> = ({ user }) => {
	const changePassword = async () => {
		const pass = prompt(t("header.typePassword"));
		if (pass) {
			const trocaSenha = await fetchApi("admin/" + user.id, "PUT", { password: pass });
			if (trocaSenha.ok) {
				showDialog(t("dlg.success"), t("header.passChanged"), "#1451B4", t("dlg.thanks"), "success", () => { });
			}else{
				showDialog(t("dlg.attention"), t("dlg.unableContinue"), "#1451B4", t("dlg.tryAgain"), "error", () => { });
			}
		}
	};

	const [dropdownOpen, setDropdownOpen] = useState(false);
	const trigger = useRef<HTMLAnchorElement>(null);
	const dropdown = useRef<HTMLDivElement>(null);
	const { showDialog } = useDialog();
	const { lang, setLang, t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	const changeLanguage = (lang: any) => {
		setLang(lang);
		location.reload();
	}

	const endSession = () => {
		localStorage.clear();
		window.location.href = "/auth/signin";
	};

	useEffect(() => {
		const clickHandler = ({ target }: MouseEvent) => {
			if (!dropdown.current) return;
			if (!dropdownOpen || dropdown.current.contains(target as Node) || trigger.current?.contains(target as Node)) return;
			setDropdownOpen(false);
		};
		document.addEventListener("click", clickHandler);
		return () => document.removeEventListener("click", clickHandler);
	});

	useEffect(() => {
		const keyHandler = ({ keyCode }: KeyboardEvent) => {
			if (!dropdownOpen || keyCode !== 27) return;
			setDropdownOpen(false);
		};
		document.addEventListener("keydown", keyHandler);
		return () => document.removeEventListener("keydown", keyHandler);
	});

	return (
		<div className="relative flex items-center gap-2 sm:gap-3">
			<LanguageButton lang={lang} onChange={changeLanguage} className="shrink-0" />

			<div className="h-6 w-px bg-gray-200" aria-hidden />

			<div className="header-login">
				<div className="header-sign-in">
					<button
						onClick={() => setDropdownOpen(!dropdownOpen)}
						className="header-login gap-2 px-2 py-1 rounded-full hover:bg-gray-50"
					>
						<span className="fas fa-user-circle text-gray-500 text-2xl sm:text-3xl"></span>
						<span className="hidden text-right sm:block">
							<span className="block text-sm font-medium text-black dark:text-white truncate max-w-[140px]">
								{t("header.greeting")} <strong>{user?.name?.split(' ')[0]}</strong>
							</span>
						</span>
						<span className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'} ml-1 text-gray-500 text-xs sm:text-sm`}></span>
					</button>
				</div>
			</div>
			{/* Dropdown Start */}
			<div
				ref={dropdown}
				onFocus={() => setDropdownOpen(true)}
				onBlur={() => setDropdownOpen(false)}
				className={`absolute right-0 top-full mt-2 flex w-56 flex-col rounded-md border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark z-50 ${dropdownOpen ? "block" : "hidden"
				}`}
			>

				<button
					onClick={changePassword}
					className="flex items-center gap-3 px-4 py-3 text-sm font-medium duration-300 ease-in-out hover:bg-gray-50 hover:text-primary lg:text-base text-left"
				>
					<i className="fas fa-key h-6 w-6" aria-hidden="true"></i>
					{t("header.changePassword")}
				</button>
				<button
					onClick={endSession}
					className="flex items-center gap-3 px-4 py-3 text-sm font-medium duration-300 ease-in-out hover:bg-gray-50 hover:text-primary lg:text-base text-left"
				>
					<i className="fas fa-sign-out-alt h-6 w-6" aria-hidden="true"></i>
					{t("header.endSession")}
				</button>
			</div>

		</div>
	);
};

export default DropdownUser;
