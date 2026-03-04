"use client"
import dynamic from 'next/dynamic'
import { ApexOptions } from "apexcharts";
import React, { useState } from "react";
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
//import ReactApexChart from "react-apexcharts";

const Dash5:React.FC<any> = ({ dados }) => {

	const arrayKeys:string[] = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

	const options: ApexOptions = {
		legend: {
			show: false,
			position: "top",
			horizontalAlign: "left",
		},
		colors: [localStorage.getItem("cor_padrao") ?? "#222"],
		chart: {
			fontFamily: "Satoshi, sans-serif",
			height: 335,
			type: "area",
			dropShadow: {
				enabled: true,
				color: "#623CEA14",
				top: 10,
				blur: 4,
				left: 0,
				opacity: 0.1,
			},

			toolbar: {
				show: false,
			},
		},
		responsive: [
			{
				breakpoint: 1024,
				options: {
					chart: {
						height: 300,
					},
				},
			},
			{
				breakpoint: 1366,
				options: {
					chart: {
						height: 350,
					},
				},
			},
		],
		stroke: {
			width: [2, 2],
			curve: "straight",
		},
		// labels: {
		//   show: false,
		//   position: "top",
		// },
		grid: {
			xaxis: {
				lines: {
					show: true,
				},
			},
			yaxis: {
				lines: {
					show: true,
				},
			},
		},
		dataLabels: {
			enabled: false,
		},
		markers: {
			size: 4,
			colors: "#fff",
			strokeColors: [localStorage.getItem("cor_padrao") ?? "#222"],
			strokeWidth: 3,
			strokeOpacity: 0.9,
			strokeDashArray: 0,
			fillOpacity: 1,
			discrete: [],
			hover: {
				size: undefined,
				sizeOffset: 5,
			},
		},
		xaxis: {
			type: "category",
			categories: arrayKeys,
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
		},
		yaxis: {
			title: {
				style: {
					fontSize: "0px",
				},
			},
		},
	};

	const state = {
		series: [
			{
				name: "Total",
				data: dados,
			},
		],
	}

	// const handleReset = () => {
	//   setState((prevState) => ({
	//     ...prevState,
	//   }));
	// };
	// handleReset;

	return (
		<div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-7">
			<div className="mb-4 justify-between gap-4 sm:flex">
				<div>
					<h4 className="text-sm font-semibold text-black dark:text-white">
            Licenças Ativas por Mês
					</h4>
				</div>
			</div>

			<div>
				<div id="chartOne" className="-ml-5">
					<ReactApexChart
						options={options}
						series={state.series}
						type="area"
						height={350}
						width={"100%"}
					/>
				</div>
			</div>
		</div>
	);
};

export default Dash5;
