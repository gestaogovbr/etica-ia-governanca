"use client";
import { useEffect, useMemo, useState } from "react";
import pt from "./languages/pt";
import en from "./languages/en";
import es from "./languages/es";
import fr from "./languages/fr";

export const STORAGE_KEY = "lang";

export const LANGS = [
	{ code: "pt", name: "Português (BR)", flag: "/images/flags/br.png" },
	{ code: "en", name: "English", flag: "/images/flags/us.png" },
	{ code: "es", name: "Español", flag: "/images/flags/es.png" },
	{ code: "fr", name: "Français", flag: "/images/flags/fr.png" },
] as const;
export type LangCode = typeof LANGS[number]["code"];

export const TEXTS: Record<LangCode, Record<string, string>> = {
	pt,
	en,
	es,
	fr,
};

// ---- utils puros (podem ser usados fora de React) ----
export const getT = (lang: LangCode) => (key: string) => TEXTS[lang][key] ?? key;

const fromNavigator = (): LangCode => {
	if (typeof navigator === "undefined") return "pt";
	const n = navigator.language?.toLowerCase() ?? "pt";
	if (n.startsWith("pt")) return "pt";
	if (n.startsWith("en")) return "en";
	if (n.startsWith("es")) return "es";
	if (n.startsWith("fr")) return "fr";
	return "pt";
};

export const getInitialLang = (): LangCode => {
	if (typeof window === "undefined") return "pt";
	const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
	return saved && TEXTS[saved] ? saved : fromNavigator();
};

export const persistLang = (lang: LangCode) => {
	if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, lang);
	if (typeof document !== "undefined") document.documentElement.lang = lang;
};

// ---- Hook de uso geral ----
export function useI18n(opts?: { titleKeys?: [string, string] }) {
	const [lang, setLang] = useState<LangCode>(getInitialLang());
	const t = useMemo(() => getT(lang), [lang]);
	const currentFlag = useMemo(
		() => LANGS.find(l => l.code === lang)?.flag ?? LANGS[0].flag,
		[lang]
	);

	useEffect(() => {
		persistLang(lang);
		if (opts?.titleKeys && typeof document !== "undefined") {
			const [a, b] = opts.titleKeys;
			document.title = `${t(a)} | ${t(b)}`;
		}
	}, [lang, opts?.titleKeys, t]);

	return { lang, setLang, t, currentFlag };
}

// ---- Botão/Dropdown de idioma reutilizável ----
export function LanguageButton({
	lang,
	onChange,
	className = "fixed top-0 right-0 z-50 p-3",
	right = false
}: {
	lang: LangCode;
	onChange: (code: LangCode) => void;
	className?: string;
	right?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const flag = useMemo(
		() => LANGS.find(l => l.code === lang)?.flag ?? LANGS[0].flag,
		[lang]
	);

	return (
		<div className={className}>
			<div className="flex gap-2 items-center">
				<span className="text-black font-semibold">{lang.toLocaleUpperCase()}</span>
				<img src={flag} onClick={() => setOpen(v => !v)} alt="lang" width={36} height={26} style={{cursor: "pointer" , borderRadius: "4px" }}  className=""/>
			</div>
			{open && (
				<div className={`absolute mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden ${right ? "right-0" : "left-0"}`}>
					{LANGS.map((l) => (
						<button
							key={l.code}
							onClick={() => { onChange(l.code); setOpen(false); }}
							className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 text-left"
						>
							<img src={l.flag} alt={l.name} width={22} height={16} style={{ borderRadius: 4 }} />
							<span className="text-sm">{l.name}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
