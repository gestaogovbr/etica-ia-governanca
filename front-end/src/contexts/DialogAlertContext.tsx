//DialogAlertContext.tsx
"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';
import Dialog from '@/components/Dialog/Alert'

interface DialogProps {
  title: string;
  content: string;
  buttonColor: string; // Exemplo: 'bg-blue-500 hover:bg-blue-700'
  buttonText: string;
  icon: string;
  otherAction: () => void,
  cancelar?:boolean
}

interface DialogContextType {
  showDialog: (title: string, content: string, buttonColor: string, buttonText: string, icon:string, otherAction:()=>void, cancelar?:boolean) => void;
  hideDialog: () => void;
}

interface DialogProviderProps {
  children: ReactNode;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
	const context = useContext(DialogContext);
	if (context === undefined) {
		throw new Error('useDialog must be used within a DialogProvider');
	}
	return context;
};

export const UseDialog = () => {
	const context = useContext(DialogContext);
	if (context === undefined) {
		throw new Error('useDialog must be used within a DialogProvider');
	}
	return context;
};

export const DialogAlertProvider: React.FC<DialogProviderProps> = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [dialogProps, setDialogProps] = useState<DialogProps>({
		title: '',
		content: '',
		buttonColor: '',
		buttonText: '',
		icon: '',
		otherAction: ()=>{},
		cancelar: false
	});

	const showDialog = (title: string, content: string, buttonColor: string, buttonText: string, icon:string, otherAction:()=>void, cancelar?:boolean) => {
		setDialogProps({ title, content, buttonColor, buttonText, icon, otherAction, cancelar });
		setIsOpen(true);
	};

	const hideDialog = () => setIsOpen(false);

	return (
		<DialogContext.Provider value={{ showDialog, hideDialog }}>
			{isOpen && <Dialog {...dialogProps} onClose={hideDialog} />}
			{children}
		</DialogContext.Provider>
	);
};
