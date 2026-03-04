"use client"
import { useI18n } from '@/service/language';
import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React, { Fragment } from 'react';

interface DialogProps {
	title: string;
	content: string;
	buttonColor: string; // Exemplo: 'bg-blue-500 hover:bg-blue-700'
	buttonText: string;
	icon: string;
	otherAction: () => void,
	onClose: () => void;
	cancelar?: boolean
}

const DialogExport: React.FC<DialogProps> = ({ title, content, buttonColor, buttonText, icon, otherAction, onClose, cancelar }) => {
	if (!otherAction) {
		otherAction = () => { }
	}
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });
	return (
		<div style={{ zIndex: 9999999, position: "fixed", width: "100vw", height: "100vh", backgroundColor: "#000", opacity: 0.5 }}>
			<Transition.Root show={true} as={Fragment}>
				<Dialog as="div" style={{ zIndex: 999999999 }} className="relative z-10" onClose={onClose}>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
								<Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
									<div>

										{icon === "success" && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" /></div>}
										{icon === "info" && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"><ExclamationCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" /></div>}
										{icon === "error" && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red"><ExclamationTriangleIcon className="h-6 w-6 text-white" aria-hidden="true" /></div>}

										<div className="mt-3 text-center sm:mt-5">
											<Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
												{title}
											</Dialog.Title>
											<div className="mt-2">
												<p className="text-sm text-gray-500">
													{content}
												</p>
											</div>
										</div>
									</div>
									<div className={`mt-5 sm:mt-6 flex gap-3 ${cancelar ? "justify-between" : "justify-center"}`}>

										<button
											type="button"
											className="br-button primary flex-1"
											onClick={() => { onClose(); otherAction(); }}
										>
											{buttonText}
										</button>

										{cancelar && (
											<button
												type="button"
												className="br-button secondary flex-1"
												onClick={() => onClose()}
											>
												{t("common.cancel")}
											</button>
										)}

									</div>

								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition.Root>
		</div>
	);
};

export default DialogExport;
