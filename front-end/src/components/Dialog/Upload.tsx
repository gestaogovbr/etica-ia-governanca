
"use client"
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getApps } from "firebase/app";
import { create } from "zustand"

export type DialogUploadProps = {
    caminhoUpload: string,
    descricaoArquivo: string,
    completo?: string | null,
}

export type DialogUploadStore = {
    urlRetorno: string | null,
    isOpen: boolean,
    uploadOptions: DialogUploadProps,
    openDialogUpload: (uploadOptions: DialogUploadProps) => void,
    setIsClose: () => void,
    setUrlDownload: (url: string | null) => void,
}

export const useDialogUpload = create<DialogUploadStore>((set) => ({
	uploadOptions: {
		caminhoUpload: "",
		descricaoArquivo: "",
		completo: "*/*",
	},
	urlRetorno: null,
	isOpen: false,
	setUrlDownload: (url: string |  null) => {
		set({ urlRetorno: url })
	},
	setIsClose: () => {
		set({ isOpen: false })
	},
	openDialogUpload: (uploadOptions: DialogUploadProps) => {
		set({ isOpen: true, uploadOptions })
	}
}))

interface TipoAnexo {
    label: string,
    value: string
}

const DialogUpload = () => {
	const { isOpen, setIsClose, uploadOptions, setUrlDownload } = useDialogUpload();
	const [progress, setProgress] = useState(0); // Estado para armazenar o progresso do upload

	const changeUpload = (event: any) => {
		setProgress(10);
		const storage = getStorage(getApps()[0]);
		const files = event.target.files;
		if (!files.length) return;

		const uploadFile = (file: File): Promise<string> => {
			return new Promise((resolve, reject) => {
				const storageRef = ref(storage, `${uploadOptions.caminhoUpload}/${new Date().getTime()}${file.name}`);
				const uploadTask = uploadBytesResumable(storageRef, file);

				uploadTask.on(
					"state_changed",
					(snapshot) => {
						const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
						setProgress(progress); // Atualiza o estado do progresso
						console.log('Upload is ' + progress + '% done');
					},
					(error) => {
						console.error(error);
						reject(error);
					},
					() => {
						getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
							resolve(downloadURL);
						}).catch((error) => reject(error));
					}
				);
			});
		};

		const handleUpload = async () => {
			try {
				const urls = await Promise.all(Array.from(files).map((file: unknown) => uploadFile(file as File)));

				setProgress(0);
				setIsClose();
				setUrlDownload(files.length === 1 ? urls[0] : urls.join(","));

			} catch (error) {
				console.error(error);
			}
		};

		handleUpload();
	};

	return isOpen && (
		<div style={{ zIndex: 999999999999999, position: "fixed", width: "100vw", height: "100vh", backgroundColor: "#000", opacity: 0.5 }}>
			<Transition.Root show={true} as={Fragment}>
				<Dialog as="div" style={{ zIndex: 9999999999999999999 }} className="relative z-10" onClose={setIsClose}>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0  transition-opacity" />
					</Transition.Child>

					<div className="fixed inset-0 z-10 w-screen overflow-y-auto">
						<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
							<Transition.Child
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
								enterTo="opacity-100 translate-y-0 sm:scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 translate-y-0 sm:scale-100"
								leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
							>
								<Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#EFEFEF] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
									<Dialog.Title as="h3" className="text-base text-center py-2 font-semibold leading-6 text-dark">
                                        Anexar arquivo
									</Dialog.Title>
									{progress > 0 && progress < 100 ? (
										<div style={{ height: "234px", display: "flex", alignItems: "center", alignContent: "center", justifyItems: "center", justifyContent: "center" }} className="text-center py-2">
											<div>Carregando Anexo {progress.toFixed(2)}%</div>
										</div>
									) : (<div>
										<div
											id="FileUpload"
											onChange={changeUpload}

											className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded border border-dashed border-primary bg-gray px-4 py-4 dark:bg-meta-4 sm:py-7.5"
										>
											<input
												type="file"
												accept={uploadOptions.completo ?? "*/*"}                                                    className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
											/>

											<div className="flex flex-col items-center justify-center space-y-3">
												<span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
													<svg
														width="16"
														height="16"
														viewBox="0 0 16 16"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
													>
														<path
															fillRule="evenodd"
															clipRule="evenodd"
															d="M1.99967 9.33337C2.36786 9.33337 2.66634 9.63185 2.66634 10V12.6667C2.66634 12.8435 2.73658 13.0131 2.8616 13.1381C2.98663 13.2631 3.1562 13.3334 3.33301 13.3334H12.6663C12.8431 13.3334 13.0127 13.2631 13.1377 13.1381C13.2628 13.0131 13.333 12.8435 13.333 12.6667V10C13.333 9.63185 13.6315 9.33337 13.9997 9.33337C14.3679 9.33337 14.6663 9.63185 14.6663 10V12.6667C14.6663 13.1971 14.4556 13.7058 14.0806 14.0809C13.7055 14.456 13.1968 14.6667 12.6663 14.6667H3.33301C2.80257 14.6667 2.29387 14.456 1.91879 14.0809C1.54372 13.7058 1.33301 13.1971 1.33301 12.6667V10C1.33301 9.63185 1.63148 9.33337 1.99967 9.33337Z"
															fill={localStorage.getItem("cor_padrao") ?? "#222"}
														/>
														<path
															fillRule="evenodd"
															clipRule="evenodd"
															d="M7.5286 1.52864C7.78894 1.26829 8.21106 1.26829 8.4714 1.52864L11.8047 4.86197C12.0651 5.12232 12.0651 5.54443 11.8047 5.80478C11.5444 6.06513 11.1223 6.06513 10.8619 5.80478L8 2.94285L5.13807 5.80478C4.87772 6.06513 4.45561 6.06513 4.19526 5.80478C3.93491 5.54443 3.93491 5.12232 4.19526 4.86197L7.5286 1.52864Z"
															fill={localStorage.getItem("cor_padrao") ?? "#222"}
														/>
														<path
															fillRule="evenodd"
															clipRule="evenodd"
															d="M7.99967 1.33337C8.36786 1.33337 8.66634 1.63185 8.66634 2.00004V10C8.66634 10.3682 8.36786 10.6667 7.99967 10.6667C7.63148 10.6667 7.33301 10.3682 7.33301 10V2.00004C7.33301 1.63185 7.63148 1.33337 7.99967 1.33337Z"
															fill={localStorage.getItem("cor_padrao") ?? "#222"}
														/>
													</svg>
												</span>
												<p>
													<span className="text-primary">Clique para carregar</span> ou
                                                    arraste e solte
												</p>
												<p className="mt-1.5">{uploadOptions.descricaoArquivo}</p>
											</div>
										</div>
										<div className="mt-5 sm:mt-6">
											<button
												type="button"
												style={{ backgroundColor: "#113B62" }}
												className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-bold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
												onClick={setIsClose}
											>
                                                Cancelar
											</button>
										</div>
									</div>)}

								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition.Root>
		</div>
	);
}

export default DialogUpload;
