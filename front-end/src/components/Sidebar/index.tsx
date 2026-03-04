"use client";

import { useI18n } from "@/service/language";
import { ItemMenu } from "@/types/menu";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface SidebarProps {
	sidebarOpen: boolean;
	setSidebarOpen: (arg: boolean) => void;
	menu?: ItemMenu[]; // pode chegar depois
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, menu }: SidebarProps) => {
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	const sidebar = useRef<HTMLDivElement | null>(null);
	const pathname = usePathname();

	// segura localmente e re-renderiza quando chegar
	const [list, setList] = useState<ItemMenu[]>([]);
	useEffect(() => {
		setList(Array.isArray(menu) ? menu : []);
	}, [menu]);

	// ordena fora do render e com fallback de order
	const sorted = useMemo(
		() => [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
		[list]
	);

	const items = useMemo(
		() =>
			sorted.filter(
				(item) => item.order !== 99 || (item.order === 99 && pathname === `/${item.path}`)
			),
		[sorted, pathname]
	);

	return (
		<aside
			ref={sidebar}
			style={{ zIndex: 99 }}
			className={`absolute left-0 top-0 flex h-screen w-72.5 shadow flex-col overflow-y-hidden bg-white duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
		>
			{/* HEADER */}
			<div className="flex items-center justify-center gap-2 pt-2">
				<Image width={100} height={52} src="/images/logo/govbr.png" alt="Logo" priority />
				<span className="leading-tight text-xs text-gray-700">
					{t("gov.text1")}<br />{t("gov.text2")}
				</span>
			</div>

			<div className="br-menu no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear mt-8 ">
				<nav className="menu-body" role="tree">
					{/* Skeleton enquanto não chegou */}
					{!items.length && (
						<>
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={`sk-${i}`}>
									<div className="h-9 animate-pulse rounded-md bg-gray-100" />
								</div>
							))}
						</>
					)}

					{items.map((item) => {
						const active = pathname === `/${item.path}`;
						return (
							<Link
								href={`/${item.path ?? ""}`}
								className={`menu-item divider	${active ? "active" : ""}`}
								onClick={() => setSidebarOpen(false)}
								role="treeitem"
							>
								<span className="icon inline-flex min-w-[24px] justify-center">
									<i className={item.icon} aria-hidden="true"></i>
								</span>
								<span className="truncate">{t(item.name)}</span>
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
};

export default Sidebar;
