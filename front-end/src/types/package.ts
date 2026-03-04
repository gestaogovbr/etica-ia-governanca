export type Package = {
	name: string;
	price: number;
	invoiceDate: string;
	status: "Paid" | "Unpaid" | "Pending" | string;
};
