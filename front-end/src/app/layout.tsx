//Layout.tsx
"use client";
import Loader from "@/components/common/Loader";
import DialogUpload from "@/components/Dialog/Upload";
import { DialogAlertProvider } from "@/contexts/DialogAlertContext";
import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/css/jsvectormap.css";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [loading, setLoading] = useState<boolean>(true);
	const pathname = usePathname();

	useEffect(() => {
		if (!localStorage.getItem('token')) {
			if (pathname != "/auth/signin") {
				localStorage.clear()
				if(window){
					window.location.href = '/auth/signin';
				}
			} else {
				setLoading(false);
			}
		} else {

			if(pathname == "/auth/signin"){
				//refresshtoken
				if(window){
					window.location.href = "/"
				}
			}else{
				//refresshtoken
				// usuarioLogado.getIdToken(true).then(async function (idToken) {
				// 	localStorage.setItem("refreshToken", idToken)
				// })
				setLoading(false);
			}
		}

	}), [pathname]; // Adicione dispatch às dependências

	return (

		// <Provider store={store}>
		<html lang="pt-BR">
			<head>
				<link href="https://fonts.cdnfonts.com/css/rawline" rel="stylesheet" />
				<link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.2/css/all.min.css"
          integrity="sha256-zmfNZmXoNWBMemUOo1XUGFfc0ihGGLYdgtJS3KCr/l0="
          crossOrigin="anonymous" 
        />
      </head>
			<body>
				<DialogUpload></DialogUpload>
				<DialogAlertProvider>
					<div className="dark:bg-boxdark-2 dark:text-bodydark">
						{loading ? <Loader /> : children}
					</div>
				</DialogAlertProvider>
			</body>
		</html>
		// </Provider>
	);
}
