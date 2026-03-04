"use client";
import dynamic from 'next/dynamic';
import { ApexOptions } from "apexcharts";
import React, { useState, useEffect } from 'react';
import { fetchApi } from "@/service/api";

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const Home: React.FC = () => {
	const [dashboard, setDashboard] = useState<any>(null);

	useEffect(() => {
		async function buscaDashBoard() {
			try {
				const campaignId = "tjUuTVcIojEU1WIvDeEq";
				const dataDash = await fetchApi("reports/" + campaignId + "?dashboard=true", "GET");
				if (dataDash.ok) {
					const resultado = await dataDash.json();
					setDashboard(resultado);
				}
			} catch (error) {
				console.log(error);
			}
		}
		buscaDashBoard();
	}, []);

	if (!dashboard) return <div></div>;

	// Stats
	const stats = [
		{ label: "Total UFs Respondentes", valor: dashboard.totalRespondents },
		{ label: "UFs Que Começaram", valor: dashboard.totalResponses },
		{ label: "UFs Que Finalizaram", valor: dashboard.totalResponseFinished ?? 0 }
	];

	// Gráfico: cada dimensão com totalResponseExpected e totalResponses
	const dimensions = Object.entries(dashboard.totalForDimension).sort((a, b) => Number(a[0]) - Number(b[0]));
	const categories = dimensions.map(([_, d]: any) => d.name.split(" - ")[0] + " - "+ d.totalQuestions +" Perguntas");
	const expectedData = dimensions.map(([_, d]: any) => d.totalResponseExpected);
	const responsesData = dimensions.map(([_, d]: any) => d.totalResponses);

	const chartOptions: ApexOptions = {
		chart: { type: "bar", height: 350, toolbar: { show: false } },
		plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
		dataLabels: { enabled: false },
		stroke: { show: true, width: 2, colors: ["transparent"] },
		xaxis: { categories },
		yaxis: { title: { text: "Quantidade" } },
		fill: { opacity: 1 },
		tooltip: { y: { formatter: (val: number) => val.toString() } },
		colors: [localStorage.getItem("cor_padrao") ?? "#0F3B62", "#9EE441"]
	};

	const chartSeries = [
		{ name: "Total Esperado", data: expectedData },
		{ name: "Total Respondido", data: responsesData }
	];

	// Tabela de Estados (ordem alfabética)
	const states = Object.entries(dashboard.totalForStates).sort((a, b) => {
		return a[0].localeCompare(b[0]);
	});

	// Tabela de Questões (ordenada pelo nome)
	const questions = Object.values(dashboard.totalForQuestion).sort((a: any, b: any) =>
		a.name.localeCompare(b.name)
	);

	return (
		<div className="p-4">
			{/* Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 mb-8">
				{stats.map(stat => (
					<div key={stat.label} className="bg-white border border-stroke p-4 rounded shadow">
						<div className="text-sm text-gray-500  text-uppercase" style={{textTransform: "uppercase"}} >{stat.label}</div>
						<div className="text-3xl font-bold">{stat.valor}</div>
					</div>
				))}
			</div>

			{/* Gráfico das Dimensões */}
			<div className="bg-white border border-stroke p-4 rounded shadow mb-8">
				<h4 className="text-lg font-bold mb-4">Análise por Dimensão</h4>
				<ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={350} />
			</div>

			{/* Tabela de Estados */}
			<div className="bg-white border border-stroke p-4 rounded shadow mb-8">
				<h4 className="text-lg font-bold mb-4">Análise por Estados</h4>
				<table className="min-w-full divide-y divide-gray-200">
					<thead>
						<tr>
							<th className="px-4 py-2 text-center">Estado</th>
							<th className="px-4 py-2 text-center">Respostas Enviadas</th>
							<th className="px-4 py-2 text-center">Total Esperado</th>
							<th className="px-4 py-2 text-center">Percentual</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{states.map(([estado, data]: any) => {
							// Converte "1,85%" para número
							const percentNumber = parseFloat(data.percent.replace(',', '.'));
							let barColor = "bg-red";
							if (percentNumber > 80) barColor = "bg-green-500";
							else if (percentNumber > 40) barColor = "bg-yellow-500";
							return (
								<tr key={estado}>
									<td className="px-4 py-2 text-center font-bold">{estado}</td>
									<td className="px-4 py-2 text-center">{data.totalResponses}</td>
									<td className="px-4 py-2 text-center">{data.totalExpected}</td>
									<td className="px-4 py-2 text-center">
										<div className="w-full bg-gray-200 rounded">
											<div className={`${barColor} text-xs leading-none py-1 text-center text-white font-bold rounded`} style={{ width: data.percent }}>
												{data.percent}
											</div>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Tabela de Questões */}
			<div className="bg-white border border-stroke p-4 rounded shadow mb-8">
				<h4 className="text-lg font-bold mb-4">Análise por Questões</h4>
				<table className="min-w-full divide-y divide-gray-200">
					<thead>
						<tr>
							<th className="px-4 py-2 text-left">Questão</th>
							<th className="px-4 py-2 text-left">Respostas</th>
							<th className="px-4 py-2 text-left">Total Esperado</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{questions.map((q: any, idx: number) => (
							<tr key={idx}>
								<td className="px-4 py-2">{q.name}</td>
								<td className="px-4 py-2">{q.totalResponses}</td>
								<td className="px-4 py-2">{q.totalExpected}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Home;
