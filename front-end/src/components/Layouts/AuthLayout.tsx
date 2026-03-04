"use client";
import React, { useState, ReactNode } from "react";

export default function DefaultLayout({
	children,
}: {
  children: React.ReactNode;
}) {
	return (
		<>
			{/* <!-- ===== Page Wrapper Start ===== --> */}
			<div className="flex h-screen overflow-hidden">
				{/* <!-- ===== Content Area Start ===== --> */}
				<div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
					{/* <!-- ===== Main Content Start ===== --> */}
					<main>
						<div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
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
