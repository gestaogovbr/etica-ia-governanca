"use client"
import dynamic from 'next/dynamic'
import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardItemComplex {
	label: string;
	valor: {
		[key: string]: number;
	};
}

interface Dash6Props {
  dados: DashboardItemComplex;
}

const ChartAcessos:React.FC<Dash6Props> = ({ dados }) => {
	const arrayKeys:string[] = []
	const arrayValue:number[] = []

	Object.keys(dados.valor ?? {}).forEach(key=>{
		arrayKeys.push(key.replace("2023","23").replace("2024", "24"))
		arrayValue.push(dados.valor[key])
	})

	const options: ApexOptions = {
		colors: [localStorage.getItem("cor_padrao") ?? "#222"],
		chart: {
			fontFamily: "Satoshi, sans-serif",
			type: "bar",
			height: 335,
			width: "90%",
			stacked: true,
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: false,
			},
		},

		responsive: [
			{
				breakpoint: 1536,
				options: {
					plotOptions: {
						bar: {
							borderRadius: 0,
							columnWidth: "25%",
						},
					},
				},
			},
		],
		plotOptions: {
			bar: {
				horizontal: false,
				borderRadius: 0,
				columnWidth: "25%",
				borderRadiusApplication: "end",
				borderRadiusWhenStacked: "last",
			},
		},
		dataLabels: {
			enabled: false,
		},

		xaxis: {
			categories: arrayKeys,
		},
		legend: {
			position: "top",
			horizontalAlign: "left",
			fontFamily: "Satoshi",
			fontWeight: 500,
			fontSize: "14px",

			markers: {
				radius: 99,
			},
		},
		fill: {
			opacity: 1,
		},
	};

	const state = {
		series: [
			{
				name: dados.label,
				data: arrayValue,
			},
		],
	}

	return (
		<div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-5">
			<div className="mb-4 justify-between gap-4 sm:flex">
				<div>
					<h4 className="text-sm font-semibold text-black dark:text-white">
						{dados.label}
					</h4>
				</div>
			</div>

			<div>
				<div id="chartTwo" className="-mb-9 -ml-5">
					<ReactApexChart
						options={options}
						series={state.series}
						type="bar"
						height={350}
						width={"100%"}
					/>
				</div>
			</div>
		</div>
	);
};

export default ChartAcessos;
