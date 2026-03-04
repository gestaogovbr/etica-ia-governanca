
"use client";

import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { UseDialog } from "@/contexts/DialogAlertContext";
import { fetchApi } from "@/service/api";
import { useI18n } from "@/service/language";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
	value: string;
	text: string;
	points?: number;
	score?: number;
	best_practice_description?: string;
	trigger?: string;
	trigger_if_selected?: string;
};

type Session = {
	id: number;
	code: string;
	name: string;
	description?: string;
	ethical_principles?: string | null;
	priority?: number;
	is_triage?: boolean;
	is_testing?: boolean;
	next_session_code?: string | null;
	triage_config?: {
		levels: Array<{
			key: string;
			label: string;
			min_score: number;
			next_session_code?: string | null;
		}>;
	} | null;
};

type Question = {
	id: number;
	code: string;
	text: string;
	type: string;
	session?: Session;
	options?: Option[] | string | null;
	is_critical?: boolean;
	weights?: number;
	order?: number;
	actors?: string[];
	conditional_field?: string | null;
	conditional_value?: string | null;
};

type Project = {
	id: number;
	name: string;
	responsible: string;
};

type AnswerMap = Record<string, string | string[] | null | undefined>;

type SessionEvaluation = {
	sessionId: number;
	sessionCode: string;
	sessionName: string;
	level: string;
	levelKey?: string;
	score: number;
	advice?: string;
	questionnaireVersion?: string | null;
	nextSessionCode?: string | null;
	meta?: Record<string, any>;
};

type SubmissionPayload = {
	projectId: number;
	answers: { question_id: number; value: any }[];
};

const RISK_LEVEL_STYLES: Record<
	string,
	{ badge: string; border: string; text: string; background: string; legend: string }
> = {
	"Risco Baixo": {
		badge: "bg-green-100 text-green-800",
		border: "border-green-200",
		text: "text-green-900",
		background: "bg-green-50",
		legend: "responses.RISK_LEVEL_STYLES.low",
	},
	"Risco Médio": {
		badge: "bg-blue-100 text-blue-800",
		border: "border-blue-200",
		text: "text-blue-900",
		background: "bg-blue-50",
		legend: "responses.RISK_LEVEL_STYLES.medium",
	},
	"Risco Alto": {
		badge: "bg-orange-100 text-orange-800",
		border: "border-orange-200",
		text: "text-orange-900",
		background: "bg-orange-50",
		legend: "responses.RISK_LEVEL_STYLES.high",
	},
	"Risco Excessivo": {
		badge: "bg-pink-100 text-pink-800",
		border: "border-pink-200",
		text: "text-pink-900",
		background: "bg-pink-50",
		legend: "responses.RISK_LEVEL_STYLES.excessive",
	},
};

const TRIAGE_LEVEL_DEFS = [
	{ key: "low", label: "Baixo" },
	{ key: "medium", label: "Médio" },
	{ key: "advanced", label: "Avançado" },
	{ key: "excessive", label: "Excessivo" },
];

const parseOptions = (options: Question["options"]): Option[] => {
	if (!options) return [];
	if (Array.isArray(options)) return options as Option[];
	if (typeof options === "string") {
		try {
			const parsed = JSON.parse(options);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};

const hasValue = (value: unknown) => {
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "string") return value.trim().length > 0;
	return value !== null && typeof value !== "undefined";
};

const roundScore = (value: number) => Number(Number(value || 0).toFixed(2));

const getOptionValue = (option?: Option) => {
	if (!option) return 0;
	if (typeof option.points !== "undefined") return Number(option.points) || 0;
	if (typeof option.score !== "undefined") return Number(option.score) || 0;
	return 0;
};

const getOptionPositiveValue = (option?: Option) => {
	const actual = getOptionValue(option);
	return actual > 0 ? actual : 0;
};

const getOptionPoints = (option?: Option) => {
	return getOptionValue(option);
};

const isHighRiskTrigger = (option?: Option) => {
	if (!option) return false;
	return (
		option.trigger === "ALTA_EXCESSIVA" ||
		option.trigger === "ALTO_RISCO" ||
		option.trigger_if_selected === "ALTO_RISCO" ||
		option.trigger_if_selected === "ALTO_RISCO_EXCESSIVO"
	);
};

const isExcessiveTrigger = (option?: Option) => {
	if (!option) return false;
	return option.trigger === "EXCESSIVO" || option.trigger_if_selected === "EXCESSIVO";
};

const valueIncludes = (value: string | string[] | null | undefined, target: string) => {
	if (!value) return false;
	if (Array.isArray(value)) {
		return value.map((item) => String(item)).includes(target);
	}
	return String(value) === target;
};

const DEFAULT_TRIAGE_THRESHOLDS: Record<string, number> = {
	low: 0,
	medium: 12,
	advanced: 25,
	excessive: 40,
};

const TRIAGE_ADVICE: Record<string, string> = {
	low: "Classificação de Baixo Risco. Prossiga para o próximo formulário simplificado.",
	medium: "Classificação de Médio Risco. Revise controles e prossiga para o formulário intermediário.",
	advanced: "Classificação de Risco Avançado. Prossiga para o questionário completo.",
	excessive: "Classificação de Risco Excessivo. Interrompa e reavalie a iniciativa com instâncias especializadas.",
};

const getSessionTriageLevels = (session: Session) => {
	const configLevels = session.triage_config?.levels ?? [];
	const map = new Map(configLevels.map((level) => [level.key, level]));
	return TRIAGE_LEVEL_DEFS.map((def) => {
		const custom = map.get(def.key);
		return {
			key: def.key,
			label: custom?.label || def.label,
			min_score:
				typeof custom?.min_score === "number"
					? Number(custom.min_score)
					: DEFAULT_TRIAGE_THRESHOLDS[def.key] ?? 0,
			next_session_code: custom?.next_session_code ?? null,
		};
	});
};

const evaluateTriageSession = (session: Session, questions: Question[], answers: AnswerMap): SessionEvaluation | null => {
	if (!session.is_triage) return null;
	if (!questions.length) return null;

	let totalPoints = 0;
	let hasExcessiveTrigger = false;
	let highRiskTriggerCount = 0;

	questions.forEach((question) => {
		const type = (question.type || "").toLowerCase();
		if (type === "text" || type === "textarea") return;

		const answerValue = answers[question.code];
		if (!hasValue(answerValue)) return;

		const weight = Number(question.weights ?? 1) || 1;
		const options = parseOptions(question.options);

		if ((type === "radio" || type === "multiple_choice") && typeof answerValue === "string") {
			const selected = options.find((opt) => String(opt.value) === String(answerValue));
			if (!selected) return;
			totalPoints += getOptionPoints(selected) * weight;
			if (isHighRiskTrigger(selected)) highRiskTriggerCount++;
			if (isExcessiveTrigger(selected)) hasExcessiveTrigger = true;
			return;
		}

		if (type === "checkbox" && Array.isArray(answerValue)) {
			let checkboxSum = 0;
			let checkboxHighRisk = false;
			answerValue.forEach((selectedValue) => {
				const selected = options.find((opt) => String(opt.value) === String(selectedValue));
				if (!selected) return;
				checkboxSum += getOptionPoints(selected);
				if (
					isHighRiskTrigger(selected) ||
					selected.trigger_if_selected === "ALTO_RISCO" ||
					selected.trigger_if_selected === "ALTO_RISCO_EXCESSIVO"
				) {
					checkboxHighRisk = true;
				}
				if (isExcessiveTrigger(selected) || selected.trigger_if_selected === "EXCESSIVO") {
					hasExcessiveTrigger = true;
				}
			});
			totalPoints += checkboxSum * weight;
			if (checkboxHighRisk) highRiskTriggerCount++;
		}
	});

	const roundedScore = roundScore(totalPoints);
	const isDadosSensiveis = valueIncludes(answers["PT_Q8_DADOS_SENSIVEIS"], "sim_sensiveis");
	const isImpactoDireitosAlto = valueIncludes(answers["PT_Q11_IMPACTO_DIREITOS"], "alto_direitos");
	const condicaoDadosSensiveisAltoImpacto = isDadosSensiveis && isImpactoDireitosAlto;

	let forcedLevelKey: string | null = null;
	if (hasExcessiveTrigger) forcedLevelKey = "excessive";
	else if (condicaoDadosSensiveisAltoImpacto || highRiskTriggerCount >= 2) forcedLevelKey = "advanced";
	else if (highRiskTriggerCount >= 1) forcedLevelKey = "medium";

	const levels = getSessionTriageLevels(session);
	let matchedLevel =
		(forcedLevelKey && levels.find((level) => level.key === forcedLevelKey)) || null;

	if (!matchedLevel) {
		matchedLevel = levels.reduce((acc, level) => {
			if (roundedScore >= level.min_score) return level;
			return acc;
		}, levels[0]);
	}
	if (!matchedLevel) matchedLevel = levels[levels.length - 1] ?? null;

	const levelKey = matchedLevel?.key ?? "low";
	const levelLabel = matchedLevel?.label ?? "Baixo";
	const riskLabel = levelLabel.startsWith("Risco") ? levelLabel : `Risco ${levelLabel}`;
	const advice = TRIAGE_ADVICE[levelKey] ?? "";
	const questionnaireVersion =
		levelKey === "low"
			? "Simplificada"
			: levelKey === "medium"
				? "Padrão"
				: levelKey === "advanced"
					? "Completa"
					: null;

	return {
		sessionId: Number(session.id),
		sessionCode: session.code,
		sessionName: session.name,
		level: riskLabel,
		levelKey,
		score: roundedScore,
		advice,
		questionnaireVersion,
		nextSessionCode: matchedLevel?.next_session_code ?? null,
		meta: {
			totalPoints: roundedScore,
			highRiskTriggerCount,
			condicaoDadosSensiveisAltoImpacto,
			hasExcessiveTrigger,
			level_key: levelKey,
		},
	};
};

const determineNextSessionCode = (session: Session, evaluation?: SessionEvaluation | null) => {
	if (session.is_triage) {
		return evaluation?.nextSessionCode ?? session.next_session_code ?? null;
	}
	return session.next_session_code ?? null;
};

const mapSessionEvaluationsToPayload = (evaluations: SessionEvaluation[]) => {
	return evaluations.map((evaluation) => ({
		session_id: evaluation.sessionId,
		score: evaluation.score,
		level: evaluation.level,
		meta: {
			...(evaluation.meta ?? {}),
			advice: evaluation.advice,
			questionnaireVersion: evaluation.questionnaireVersion,
			level_key: evaluation.levelKey,
		},
	}));
};

type SectionPerformanceSummary = {
	sessionId: number;
	sessionCode: string;
	sessionName: string;
	score: number;
	maxScore: number;
	percentage: number;
	ethicalPrinciples?: string | null;
};

type FinalClassificationResult = {
	projectName?: string;
	level: number;
	levelId?: number;
	levelKey?: string;
	levelTitle: string;
	levelSubtitle: string;
	description: string;
	advice: string;
	score: number;
	maxScore: number;
	percentage: number;
	recommendations: string[];
	factors: string[];
	learningPaths: string[];
	sectionPerformance: SectionPerformanceSummary[];
};

type QuestionInsight = {
	sessionName: string;
	questionText: string;
	score: number;
	maxScore: number;
};

type ClassificationLevelConfig = {
	id: number;
	level_key: string;
	display_order: number;
	title: string;
	subtitle: string;
	description: string;
	advice: string;
	max_score?: number | null;
	max_percentage?: number | null;
	critical_trigger_threshold?: number | null;
};

const DEFAULT_CLASSIFICATION_LEVELS: ClassificationLevelConfig[] = [
	{
		id: 1,
		level_key: "LEVEL_1",
		display_order: 1,
		title: "Nível 1",
		subtitle: "Reavalie os Fundamentos",
		description:
			"Pontuação crítica que exige revisão completa.",
		advice: "Reforce a base antes de avançar.",
		max_score: -20,
		max_percentage: null,
		critical_trigger_threshold: 3,
	},
	{
		id: 2,
		level_key: "LEVEL_2",
		display_order: 2,
		title: "Nível 2",
		subtitle: "Correções Estruturais",
		description: "Percentual abaixo do ideal indica ajustes estruturais.",
		advice: "Implemente planos focados em governança e mitigação.",
		max_score: null,
		max_percentage: 30,
		critical_trigger_threshold: 1,
	},
	{
		id: 3,
		level_key: "LEVEL_3",
		display_order: 3,
		title: "Nível 3",
		subtitle: "Intermediário",
		description:
			"Há aderência consistente, porém com oportunidades.",
		advice: "Mantenha a disciplina e fortaleça o monitoramento.",
		max_score: null,
		max_percentage: 60,
		critical_trigger_threshold: null,
	},
	{
		id: 4,
		level_key: "LEVEL_4",
		display_order: 4,
		title: "Nível 4",
		subtitle: "Aprimoramentos",
		description:
			"Governança avançada com espaço para excelência.",
		advice: "Escalone auditorias, revisões independentes e métricas.",
		max_score: null,
		max_percentage: 90,
		critical_trigger_threshold: null,
	},
	{
		id: 5,
		level_key: "LEVEL_5",
		display_order: 5,
		title: "Nível 5",
		subtitle: "Aderente",
		description: "Alto grau de maturidade ética.",
		advice: "Divulgue aprendizados e mantenha revisões.",
		max_score: null,
		max_percentage: null,
		critical_trigger_threshold: null,
	},
];

const clampPercentage = (value: number) => {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, value));
};

// Conta gatilhos críticos: somente questões marcadas como is_critical e opções de pontuação negativa selecionadas
const countCriticalTriggers = (question: Question, answerValue: AnswerMap[string]) => {
	if (!question?.is_critical) return 0;
	const type = (question.type || "").toLowerCase();
	const options = parseOptions(question.options);
	if (!options.length || !hasValue(answerValue)) return 0;

	if (type === "checkbox" && Array.isArray(answerValue)) {
		return answerValue.reduce((acc, currentValue) => {
			const option = options.find((opt) => String(opt.value) === String(currentValue));
			return acc + (getOptionValue(option) < 0 ? 1 : 0);
		}, 0);
	}

	if ((type === "radio" || type === "multiple_choice") && typeof answerValue === "string") {
		const option = options.find((opt) => String(opt.value) === String(answerValue));
		return getOptionValue(option) < 0 ? 1 : 0;
	}

	return 0;
};

const computeQuestionMaxScore = (question: Question) => {
	const type = (question.type || "").toLowerCase();
	const weight = Number(question.weights ?? 1) || 1;
	const options = parseOptions(question.options);

	if (!options.length) return 0;

	if (type === "checkbox") {
		const sum = options.reduce((acc, option) => acc + getOptionPositiveValue(option), 0);
		return sum * weight;
	}

	const max = options.reduce((acc, option) => {
		const pts = getOptionPositiveValue(option);
		return pts > acc ? pts : acc;
	}, 0);
	return max * weight;
};

const computeQuestionScore = (question: Question, answerValue: AnswerMap[string]) => {
	const type = (question.type || "").toLowerCase();
	const weight = Number(question.weights ?? 1) || 1;
	const options = parseOptions(question.options);

	if (!options.length) return 0;
	if (!hasValue(answerValue)) return 0;

	if (type === "checkbox" && Array.isArray(answerValue)) {
		const sum = answerValue.reduce((acc, currentValue) => {
			const option = options.find((opt) => String(opt.value) === String(currentValue));
			return acc + getOptionValue(option);
		}, 0);
		return sum * weight;
	}

	if ((type === "radio" || type === "multiple_choice") && typeof answerValue === "string") {
		const option = options.find((opt) => String(opt.value) === String(answerValue));
		return getOptionValue(option) * weight;
	}

	return 0;
};

const buildFinalClassification = (
	answerMap: AnswerMap,
	sessions: Session[],
	questions: Question[],
	levelsConfig: ClassificationLevelConfig[],
	projectName?: string | null
): FinalClassificationResult | null => {
	if (!sessions.length || !questions.length) return null;

	const sessionById = new Map<number, Session>();
	sessions.forEach((session) => {
		if (session?.id) sessionById.set(session.id, session);
	});
	if (!sessionById.size) return null;

	let criticalNegativeTriggersCount = 0;
	const sectionAccumulator = new Map<
		number,
		{
			session: Session;
			score: number;
			maxScore: number;
		}
	>();
	const questionInsights: QuestionInsight[] = [];

	questions.forEach((question) => {
		const sessionId = question.session?.id ?? "";
		if (!sessionId) return;
		const session = sessionById.get(sessionId);
		if (!session) return;

		if (!sectionAccumulator.has(sessionId)) {
			sectionAccumulator.set(sessionId, {
				session,
				score: 0,
				maxScore: 0,
			});
		}

		const questionMaxScore = computeQuestionMaxScore(question);
		const questionScore = computeQuestionScore(question, answerMap[question.code]);
		criticalNegativeTriggersCount += countCriticalTriggers(question, answerMap[question.code]);
		const sectionData = sectionAccumulator.get(sessionId)!;
		sectionData.maxScore += questionMaxScore;
		sectionData.score += questionScore;

		if (questionMaxScore > 0) {
			questionInsights.push({
				sessionName: session.name,
				questionText: question.text,
				score: questionScore,
				maxScore: questionMaxScore,
			});
		}
	});

	if (!sectionAccumulator.size) return null;

	const sectionPerformance: SectionPerformanceSummary[] = Array.from(sectionAccumulator.values())
		.map(({ session, score, maxScore }) => ({
			sessionId: session.id,
			sessionCode: session.code,
			sessionName: session.name,
			score: roundScore(score),
			maxScore: roundScore(maxScore),
			percentage: maxScore > 0 ? roundScore(clampPercentage((score / maxScore) * 100)) : 0,
			ethicalPrinciples: session.ethical_principles,
			priority: session.priority ?? 0,
		}))
		.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
		.map(({ priority, ...rest }) => rest);

	const totalScore = roundScore(sectionPerformance.reduce((sum, section) => sum + section.score, 0));
	const totalMaxScore = roundScore(sectionPerformance.reduce((sum, section) => sum + section.maxScore, 0));
	const percentage = totalMaxScore > 0 ? roundScore(clampPercentage((totalScore / totalMaxScore) * 100)) : 0;
	const normalizeThreshold = (value?: number | string | null): number | null => {
		if (value === null || typeof value === "undefined") return null;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	};

	// Define o nível selecionado considerando primeiro os gatilhos críticos configurados
	const orderedLevels = (levelsConfig.length ? levelsConfig : DEFAULT_CLASSIFICATION_LEVELS)
		.map((level) => ({
			...level,
			max_score: normalizeThreshold(level.max_score ?? null),
			max_percentage: normalizeThreshold(level.max_percentage ?? null),
		}))
		.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

	let selectedLevel = orderedLevels[orderedLevels.length - 1];
	const criticalMatch = orderedLevels.find(
		(level) =>
			typeof level.critical_trigger_threshold === "number" &&
			criticalNegativeTriggersCount >= level.critical_trigger_threshold
	);

	if (criticalMatch) {
		selectedLevel = criticalMatch;
	} else {
		for (const level of orderedLevels) {
			if (typeof level.max_score === "number" && totalScore < level.max_score) {
				selectedLevel = level;
				break;
			}
			if (typeof level.max_percentage === "number" && percentage < level.max_percentage) {
				selectedLevel = level;
				break;
			}
		}
	}

	const levelOrder = selectedLevel?.display_order ?? orderedLevels.length;

	const recommendations = sectionPerformance
		.filter((section) => section.percentage < 70)
		.slice(0, 4)
		.map(
			(section) =>
				`Eleve os controles em "${section.sessionName}" — desempenho atual de ${section.percentage.toFixed(1)}%`
		);

	const factors = questionInsights
		.filter((item) => item.maxScore > 0)
		.map((item) => ({
			...item,
			ratio: item.maxScore > 0 ? item.score / item.maxScore : 0,
		}))
		.sort((a, b) => a.ratio - b.ratio)
		.slice(0, 5)
		.map((item) => `${item.sessionName}: ${item.questionText}`);

	const learningPathsRaw = sectionPerformance
		.filter((section) => section.ethicalPrinciples)
		.flatMap((section) => {
			const fragments = String(section.ethicalPrinciples ?? "")
				.split(/[\n;]+/)
				.map((fragment) => fragment.trim())
				.filter(Boolean);
			return fragments.map((fragment) => `${section.sessionName}: ${fragment}`);
		});
	const learningPaths = Array.from(new Set(learningPathsRaw)).slice(0, 5);

	return {
		projectName: projectName ?? undefined,
		level: levelOrder,
		levelId: selectedLevel?.id,
		levelKey: selectedLevel?.level_key,
		levelTitle: selectedLevel?.title ?? "Nível",
		levelSubtitle: selectedLevel?.subtitle ?? "",
		description: selectedLevel?.description ?? "",
		advice: selectedLevel?.advice ?? "",
		score: totalScore,
		maxScore: totalMaxScore,
		percentage,
		recommendations: recommendations.length
			? recommendations
			: ["Nenhuma recomendação crítica foi identificada. Mantenha o monitoramento contínuo."],
		factors: factors.length
			? factors
			: ["Não foram encontrados fatores críticos específicos. Revise o questionário para confirmar os pontos fortes."],
		learningPaths: learningPaths.length
			? learningPaths
			: ["Utilize as referências internas de ética em IA para consolidar os aprendizados obtidos nesta avaliação."],
		sectionPerformance,
	};
};

export default function ResponsesFormPage() {
	const { showDialog } = UseDialog();
	const searchParams = useSearchParams();

	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [answers, setAnswers] = useState<AnswerMap>({});
	const [sessions, setSessions] = useState<Session[]>([]);
	const [isFinalStep, setIsFinalStep] = useState(false);
	const initialProjectParam = searchParams?.get("project") ?? searchParams?.get("projectId") ?? "";
	const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectParam);
	const [selectedTriageCode, setSelectedTriageCode] = useState<string>("");
	const [currentSessionCode, setCurrentSessionCode] = useState<string>("");
	const [completedSessions, setCompletedSessions] = useState<string[]>([]);
	const [responseId, setResponseId] = useState<number | null>(null);
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
	const [pendingEvaluation, setPendingEvaluation] = useState<SessionEvaluation | null>(null);
	const [pendingSubmission, setPendingSubmission] = useState<{ payload: SubmissionPayload; session: Session } | null>(null);
	const [finalResult, setFinalResult] = useState<FinalClassificationResult | null>(null);
	const [resultViewOnly, setResultViewOnly] = useState(false);
	const [classificationLevels, setClassificationLevels] = useState<ClassificationLevelConfig[]>([]);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isTest, setIsTest] = useState(false);
	const topRef = useRef<HTMLDivElement | null>(null);
	const { t } = useI18n({ titleKeys: ["app.acronym", "app.title"] });

	useEffect(() => {
		const projectIdFromUrl =
			searchParams?.get("project") ??
			searchParams?.get("projectId") ??
			"";
		const responseIdFromUrl = searchParams?.get("responseId") ?? "";
		const resultFlag = searchParams?.get("result") ?? "";
		if (projectIdFromUrl && projectIdFromUrl !== selectedProjectId) {
			setSelectedProjectId(projectIdFromUrl);
		}
		if (responseIdFromUrl) {
			const parsed = Number(responseIdFromUrl);
			if (!Number.isNaN(parsed)) setResponseId(parsed);
		}
		setResultViewOnly(resultFlag === "true");
	}, [searchParams]);

	useEffect(() => {
		const loadLevels = async () => {
			try {
				const res = await fetchApi("classification-levels", "GET");
				if (!res.ok) return;
				const data = await res.json().catch(() => null);
				if (Array.isArray(data)) setClassificationLevels(data);
			} catch (error) {
				console.error(error);
			}
		};
		void loadLevels();
	}, []);

	useEffect(() => {
		if (!responseId) {
			setFinalResult(null);
		}
	}, [responseId]);

	const sessionMap = useMemo(() => {
		const map = new Map<string, Session>();
		sessions.forEach((session) => {
			if (session?.code) map.set(session.code, session);
		});
		return map;
	}, [sessions]);

	const triageSessions = useMemo(
		() =>
			sessions
				.filter((session) => session.is_triage && (!session.is_testing || isAdmin))
				.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
		[sessions, isAdmin]
	);

	useEffect(() => {
		if (!currentSessionCode && sessions.length) {
			if (selectedTriageCode && sessionMap.has(selectedTriageCode)) {
				setCurrentSessionCode(selectedTriageCode);
				return;
			}

			if (triageSessions.length > 0) {
				// Mantém aguardando o usuário escolher a pré-triagem
				return;
			}

			const sorted = [...sessions].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
			if (sorted[0]?.code) setCurrentSessionCode(sorted[0].code);
		} else if (currentSessionCode && sessions.length && !sessionMap.has(currentSessionCode)) {
			const sorted = [...sessions].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
			if (sorted[0]?.code) setCurrentSessionCode(sorted[0].code);
		}
	}, [sessions, currentSessionCode, sessionMap, selectedTriageCode, triageSessions.length]);

	useEffect(() => {
		// Quando o usuário escolher explicitamente uma pré-triagem, garantimos que ela seja a primeira sessão exibida
		if (!selectedTriageCode) return;
		if (!sessionMap.has(selectedTriageCode)) return;
		// Não sobrescreve se já estamos em uma sessão que não é triagem (fluxo já avançou)
		if (currentSessionCode && !sessionMap.get(currentSessionCode)?.is_triage) return;
		if (currentSessionCode === selectedTriageCode) return;
		setCurrentSessionCode(selectedTriageCode);
	}, [selectedTriageCode, sessionMap, currentSessionCode]);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const [questionsRes, projectsRes, sessionsRes] = await Promise.all([
					fetchApi("questions", "GET"),
					fetchApi("projects", "GET"),
					fetchApi("sessions", "GET"),
				]);

				if (questionsRes.ok) {
					const data = await questionsRes.json();
					setQuestions(
						Array.isArray(data)
							? data.map((question: Question) => ({
								...question,
								options: parseOptions(question.options),
							}))
							: []
					);
				}

				if (projectsRes.ok) {
					const data = await projectsRes.json();
					setProjects(Array.isArray(data) ? data : []);
				}

				if (sessionsRes.ok) {
					const data = await sessionsRes.json();
					setSessions(Array.isArray(data) ? data : []);
				}
			} catch (error) {
				console.error(error);
				showDialog(t("dlg.attention"), t("dlg.form_load_error"), "#1451B4", "OK", "error", () => { });
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	useEffect(() => {
		// Decodifica token JWT para identificar se o usuário é admin
		if (typeof window === "undefined") return;
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			const payloadB64 = token.split(".")[1];
			if (!payloadB64) return;
			const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
			const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, "=");
			const decoded = atob(padded);
			const payload = JSON.parse(decoded);
			setIsAdmin(Boolean(payload?.admin));
		} catch (error) {
			console.warn("Falha ao decodificar token JWT para admin:", error);
		}
	}, []);

	useEffect(() => {
		if (!responseId) return;
		if (resultViewOnly) return;
		if (!sessions.length || !projects.length || !questions.length) return;
		let cancelled = false;
		const resume = async () => {
			try {
				setLoading(true);
				const res = await fetchApi(`responses/${responseId}`, "GET");
				const data = await res.json().catch(() => null);
				if (!res.ok || !data) {
					if (!cancelled)
						showDialog(t("dlg.attention"), data?.message ?? t("dlg.resume_error"), "#E02424", "OK", "error", () => { });
					if (!cancelled) setResponseId(null);
					return;
				}

				const projectId = data.project?.id;
				if (!cancelled && projectId) setSelectedProjectId(String(projectId));

				let restored: AnswerMap = {};
				if (Array.isArray(data.answers)) {
					data.answers.forEach((answer: any) => {
						const code = answer?.question?.code ?? String(answer?.question_id ?? "");
						if (code) restored[code] = answer?.value_parsed ?? answer?.value ?? null;
					});
					if (!cancelled) setAnswers(restored);
				}

				if (!cancelled && Array.isArray(data.session_history)) {
					const historySessions = data.session_history
						.filter((entry: any) => entry?.completed && entry.session_code)
						.map((entry: any) => String(entry.session_code));
					setCompletedSessions(Array.from(new Set(historySessions)));
				}

				if (data.status === "FINISHED") {
					const summary = buildFinalClassification(restored, sessions, questions, classificationLevels, data.project?.name);
					if (!cancelled) {
						if (summary) {
							setFinalResult(summary);
							setCurrentSessionCode("");
						} else {
							showDialog(t("dlg.attention"), t("dlg.final_result_error"), "#E02424", "OK", "error", () => { });
						}
					}
					return;
				}

				if (!cancelled && data.current_session_code) setCurrentSessionCode(data.current_session_code);
				if (!cancelled) setFinalResult(null);
			} catch (error) {
				console.error(error);
				if (!cancelled)
					showDialog(t("dlg.attention"), t("dlg.resume_error"), "#E02424", "OK", "error", () => { });
				if (!cancelled) setResponseId(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void resume();
		return () => {
			cancelled = true;
		};
	}, [responseId, sessions.length, projects.length, questions.length, resultViewOnly, classificationLevels]);

	useEffect(() => {
		if (!responseId) return;
		if (!resultViewOnly) return;
		let cancelled = false;
		const fetchStoredSummary = async () => {
			try {
				setLoading(true);
				const res = await fetchApi(`results/${responseId}`, "GET");
				const data = await res.json().catch(() => null);
				if (!res.ok || !data?.summary) {
					if (!cancelled) {
						showDialog(t("dlg.attention"), data?.message ?? t("dlg.final_result_not_found"), "#1451B4", "OK", "error", () => { });
						setResultViewOnly(false);
					}
					return;
				}
				if (!cancelled) {
					setFinalResult(data.summary);
					if (data.project_id) setSelectedProjectId(String(data.project_id));
				}
			} catch (error) {
				console.error(error);
				if (!cancelled) {
					showDialog(t("dlg.attention"), t("dlg.final_result_load_error"), "#E02424", "OK", "error", () => { });
					setResultViewOnly(false);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		void fetchStoredSummary();
		return () => {
			cancelled = true;
		};
	}, [responseId, resultViewOnly]);

	const currentSession = currentSessionCode ? sessionMap.get(currentSessionCode) : undefined;

	useEffect(() => {
		if (!currentSession) {
			setIsFinalStep(false);
			return;
		}
		const nextCode = determineNextSessionCode(currentSession, null);
		if (nextCode === "RESULT") setIsFinalStep(true);
		else setIsFinalStep(false);
	}, [currentSession]);

	const questionsBySession = useMemo(() => {
		const map = new Map<number, Question[]>();
		questions.forEach((question) => {
			const sessionId = question.session?.id;
			if (!sessionId) return;
			if (!map.has(sessionId)) map.set(sessionId, []);
			map.get(sessionId)!.push(question);
		});
		map.forEach((list, key) => {
			map.set(
				key,
				[...list].sort((a, b) => {
					const orderA = typeof a.order === "number" ? a.order : Number(a.id);
					const orderB = typeof b.order === "number" ? b.order : Number(b.id);
					return orderA - orderB;
				}),
			);
		});
		return map;
	}, [questions]);

	const currentQuestions = currentSession ? (questionsBySession.get(currentSession.id) ?? []) : [];

	const selectedProject = useMemo(
		() => projects.find((project) => String(project.id) === String(selectedProjectId)),
		[projects, selectedProjectId]
	);

	const handleSelectTriageSession = (code: string) => {
		setSelectedTriageCode(code);
		if (code && sessionMap.has(code)) {
			const session = sessionMap.get(code);
			setIsTest(Boolean(session?.is_testing));
			setCurrentSessionCode(code);
		} else {
			setIsTest(false);
			setCurrentSessionCode("");
		}
	};

	const answeredCount = useMemo(() => {
		return currentQuestions.reduce((sum, question) => {
			const value = answers[question.code];
			if (!hasValue(value)) return sum;
			return sum + 1;
		}, 0);
	}, [answers, currentQuestions]);

	const completionRate = currentQuestions.length ? Math.round((answeredCount / currentQuestions.length) * 100) : 0;

	const findFirstUnansweredQuestion = () => {
		for (const question of currentQuestions) {
			if (!isQuestionVisible(question)) continue;
			const value = answers[question.code];
			if (!hasValue(value)) {
				return question;
			}
		}
		return null;
	};

	const isQuestionVisible = (question: Question) => {
		if (!question.conditional_field || !question.conditional_value) return true;
		const dependency = answers[question.conditional_field];
		if (Array.isArray(dependency)) {
			return dependency.includes(question.conditional_value);
		}
		return dependency === question.conditional_value;
	};

	const handleTextChange = (question: Question, value: string) => {
		setAnswers((prev) => ({ ...prev, [question.code]: value }));
	};

	const handleRadioChange = (question: Question, value: string) => {
		setAnswers((prev) => ({ ...prev, [question.code]: value }));
	};

	const handleCheckboxChange = (question: Question, optionValue: string) => {
		setAnswers((prev) => {
			const current = Array.isArray(prev[question.code]) ? (prev[question.code] as string[]) : [];
			const exists = current.includes(optionValue);
			const updated = exists ? current.filter((item) => item !== optionValue) : [...current, optionValue];
			return { ...prev, [question.code]: updated };
		});
	};

	const resetForm = () => {
		setAnswers({});
		setPendingSubmission(null);
		setPendingEvaluation(null);
		setIsReviewModalOpen(false);
		setFinalResult(null);
		setCompletedSessions([]);
		if (sessions.length) {
			const sorted = [...sessions].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
			setCurrentSessionCode(sorted[0]?.code ?? "");
		}
	};

	const preparePayload = () => {
		return currentQuestions
			.map((question) => {
				if (!isQuestionVisible(question)) return null;
				const value = answers[question.code];
				if (!hasValue(value)) return null;
				return {
					question_id: question.id,
					value,
				};
			})
			.filter((item): item is { question_id: number; value: any } => !!item);
	};

	const buildSubmissionPayload = (): SubmissionPayload | null => {
		if (!currentSession) {
			showDialog(t("dlg.attention"), t("dlg.no_session_available"), "#1451B4", "OK", "error", () => { });
			return null;
		}
		const projectIdNumber = Number(selectedProjectId);
		if (!projectIdNumber || Number.isNaN(projectIdNumber)) {
			showDialog(t("dlg.attention"), t("dlg.select_project_to_continue"), "#1451B4", "OK", "error", () => { });
			return null;
		}

		const payloadAnswers = preparePayload();
		if (!currentQuestions.length) {
			showDialog(t("dlg.attention"), t("dlg.no_questions_configured"), "#1451B4", "OK", "error", () => { });
			return null;
		}

		if (!payloadAnswers.length) {
			showDialog(t("dlg.attention"), t("dlg.answer_at_least_one_question"), "#1451B4", "OK", "error", () => { });
			return null;
		}

		return {
			projectId: projectIdNumber,
			answers: payloadAnswers,
		};
	};

	const submitPreparedData = async (
		payload: SubmissionPayload,
		session: Session,
		evaluation?: SessionEvaluation | null
	) => {
		const sessionScoresPayload = evaluation ? mapSessionEvaluationsToPayload([evaluation]) : [];
		const nextCode = determineNextSessionCode(session, evaluation);
		const finalStep = nextCode === "RESULT";
		setIsFinalStep(finalStep);
		const requestBody: Record<string, unknown> = {
			project_id: payload.projectId,
			answers: payload.answers,
			status: finalStep ? "FINISHED" : "SUBMITTED",
			response_id: responseId ?? undefined,
		};

		if (sessionScoresPayload.length) {
			requestBody.session_scores = sessionScoresPayload;
		}
		try {
			setSubmitting(true);
			const res = await fetchApi("responses", "POST", requestBody);
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				showDialog(t("dlg.attention"), data?.message ?? t("dlg.could_not_register_answers"), "#E02424", "OK", "error", () => { });
				return;
			}
			if (typeof data?.id === "number") {
				setResponseId(data.id);
			} else if (finalStep) {
				showDialog(t("dlg.attention"), t("dlg.could_not_retrieve_final_result"), "#E02424", "OK", "error", () => { });
			}
			if (finalStep) {
				if (typeof data?.id === "number") {
					await loadFinishedResponseSummary(data.id);
				}
				return;
			}
			if (topRef.current) {
				topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
			}

			setCompletedSessions((prev) => {
				if (!session.code) return prev;
				if (prev.includes(session.code)) return prev;
				return [...prev, session.code];
			});
			setPendingSubmission(null);
			setPendingEvaluation(null);
			if (!finalStep && nextCode) {
				if (sessionMap.has(nextCode)) {
					setCurrentSessionCode(nextCode);
				} else {
					showDialog(t("dlg.attention"), `Sessão de código ${nextCode} não encontrada.`, "#1451B4", "OK", "error", () => { });
				}
			} else if (!finalStep) {
				showDialog(t("dlg.success"), t("dlg.evaluation_flow_completed"), "#1451B4", "OK", "success", () => { });
				setCurrentSessionCode("");
			} else {
				setCurrentSessionCode("");
			}
		} catch (error) {
			console.error(error);
			showDialog(t("dlg.attention"), t("dlg.error_sending_answers"), "#E02424", "OK", "error", () => { });
		} finally {
			setSubmitting(false);
		}
	};

	const evaluateCurrentSession = () => {
		if (!currentSession || !currentSession.is_triage) return null;
		return evaluateTriageSession(currentSession, currentQuestions, answers);
	};

	const persistResultSummary = async (responseIdentifier: number, summary: FinalClassificationResult) => {
		if (!responseIdentifier) return;
		try {
			await fetchApi("results", "POST", {
				response_id: responseIdentifier,
				summary,
			});
		} catch (error) {
			console.error("Erro ao salvar o resultado final:", error);
		}
	};

	const loadFinishedResponseSummary = async (id: number) => {
		if (!id || !sessions.length || !questions.length) return;
		try {
			setLoading(true);
			const res = await fetchApi(`responses/${id}`, "GET");
			const data = await res.json().catch(() => null);
			if (!res.ok || !data) {
				showDialog(t("dlg.attention"), data?.message ?? t("dlg.could_not_load_final_result"), "#E02424", "OK", "error", () => { });
				return;
			}
			const restored: AnswerMap = {};
			if (Array.isArray(data.answers)) {
				data.answers.forEach((answer: any) => {
					const code = answer?.question?.code ?? String(answer?.question_id ?? "");
					if (code) restored[code] = answer?.value_parsed ?? answer?.value ?? null;
				});
				setAnswers(restored);
			}
			const summary = buildFinalClassification(restored, sessions, questions, classificationLevels, data.project?.name);
			if (!summary) {
				showDialog(t("dlg.attention"), t("dlg.could_not_build_final_result"), "#E02424", "OK", "error", () => { });
				return;
			}
			await persistResultSummary(id, summary);
			setFinalResult(summary);
			if (data.project?.id) setSelectedProjectId(String(data.project.id));
			if (Array.isArray(data.session_history)) {
				const historySessions = data.session_history
					.filter((entry: any) => entry?.completed && entry.session_code)
					.map((entry: any) => String(entry.session_code));
				setCompletedSessions(Array.from(new Set(historySessions)));
			}
			setCurrentSessionCode("");
		} catch (error) {
			console.error(error);
			showDialog(t("dlg.attention"), t("dlg.could_not_load_final_result"), "#E02424", "OK", "error", () => { });
		} finally {
			setLoading(false);
		}
	};

	const completedSessionList = useMemo(() => {
		return completedSessions
			.map((code) => {
				const session = sessionMap.get(code);
				if (!session) return null;
				return { code, name: session.name };
			})
			.filter((item): item is { code: string; name: string } => !!item);
	}, [completedSessions, sessionMap]);

	const handleExportResult = () => {
		if (typeof window === "undefined") return;
		window.print();
	};

	if (resultViewOnly && !finalResult) {
		return (
			<DefaultLayout>
				<div className="flex justify-center py-10 px-4 sm:px-6">
					<div className="w-full max-w-3xl rounded-3xl bg-white p-6 text-center shadow-xl">
						<p className="text-sm text-gray-500">{t("dlg.loading_final_result")}</p>
					</div>
				</div>
			</DefaultLayout>
		);
	}

	if (finalResult) {
		return (
			<DefaultLayout>
				<div className="mx-auto flex max-w-5xl flex-col gap-6 py-8 px-4 sm:px-6">
					<div className="br-card">
						<div className="card-content bg-gradient-to-br from-[#1451B4] via-[#0F3B62] to-[#091F34] p-8 text-white">
							<p className="text-xs uppercase tracking-[0.3em] text-white/70">{t("responses.final_result")}</p>
							<h1 className="mt-2 text-3xl text-white/80 font-semibold">{t("responses.title_classification")}</h1>
							{finalResult.projectName && (
								<p className="text-sm text-white/70">{t("responses.project_evaluated")} {finalResult.projectName}</p>
							)}
							<p className="mt-4 text-4xl text-white/90 font-bold">
								{finalResult.levelTitle} · {finalResult.levelSubtitle}
							</p>
							<p className="mt-3 max-w-3xl text-sm text-white/80">{finalResult.description}</p>

							<div className="mt-6 grid gap-4 sm:grid-cols-3">
								<div className="rounded-md bg-white/15 p-4 shadow-inner backdrop-blur">
									<p className="text-xs uppercase tracking-[0.3em] text-white/60">{t("responses.score_reference")}</p>
									<p className="mt-2 text-2xl text-white/90 font-semibold">{finalResult.score.toFixed(2)} {t("responses.score")}</p>
									<p className="text-xs text-white/60">{t("responses.of")} {finalResult.maxScore.toFixed(2)} {t("responses.score_possible")}</p>
								</div>
								<div className="rounded-md bg-white/15 p-4 shadow-inner backdrop-blur">
									<p className="text-xs uppercase tracking-[0.3em] text-white/60">{t("responses.percentage")}</p>
									<p className="mt-2 text-2xl text-white/90 font-semibold">{finalResult.percentage.toFixed(1)}%</p>
									<p className="text-xs text-white/60">{t("responses.consolidated_performance")}</p>
								</div>
								<div className="rounded-md bg-white/15 p-4 shadow-inner backdrop-blur">
									<p className="text-xs uppercase tracking-[0.3em] text-white/60">{t("responses.recommendation")}</p>
									<p className="mt-2 text-sm text-white">{finalResult.advice}</p>
								</div>
							</div>

							<div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
								<button
									type="button"
									onClick={handleExportResult}
									className="br-button secondary w-full sm:w-auto justify-center"
								>
									{t("responses.button_export")}
								</button>
								<a
									href="/projects"
									className="br-button secondary w-full sm:w-auto justify-center"
								>
									{t("responses.button_back_projects")}
								</a>
							</div>
						</div>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<div className="br-card">
							<div className="card-content p-6">
								<h2 className="text-lg font-semibold text-gray-900">{t("responses.improvement_recommendations")}</h2>
								<ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-gray-600">
									{finalResult.recommendations.map((item, index) => (
										<li key={`rec-${index}`}>{item}</li>
									))}
								</ul>
							</div>
						</div>
						<div className="br-card">
							<div className="card-content p-6">
								<h2 className="text-lg font-semibold text-gray-900">{t("responses.key_factors_for_classification")}</h2>
								<ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-gray-600">
									{finalResult.factors.map((item, index) => (
										<li key={`factor-${index}`}>{item}</li>
									))}
								</ul>
							</div>
						</div>
					</div>

					<div className="br-card">
						<div className="card-content p-6">
							<h2 className="text-lg font-semibold text-gray-900">{t("responses.section_performance_visual.title")}</h2>
							<p className="text-sm text-gray-500">{t("responses.section_performance_visual.description")}</p>
							<div className="mt-5 space-y-4">
								{finalResult.sectionPerformance.length ? (
									finalResult.sectionPerformance.map((section) => (
										<div key={section.sessionId}>
											<div className="flex items-center justify-between text-sm font-semibold text-gray-700">
												<span>{section.sessionName}</span>
												<span>{section.percentage.toFixed(1)}%</span>
											</div>
											<div className="mt-2 h-2 rounded-full bg-gray-100">
												<div
													className="h-full rounded-full bg-gradient-to-r from-[#1451B4] to-[#0F3B62]"
													style={{ width: `${clampPercentage(section.percentage)}%` }}
												/>
											</div>
											<p className="mt-1 text-xs text-gray-500">
												{section.score.toFixed(2)} / {section.maxScore.toFixed(2)} {t("responses.score")}
											</p>
										</div>
									))
								) : (
									<p className="text-sm text-gray-500">{t("responses.section_none_evaluated")}</p>
								)}
							</div>
						</div>
					</div>

					<div className="br-card">
						<div className="card-content p-6">
							<h2 className="text-lg font-semibold text-gray-900">{t("responses.suggestion_tracks")}</h2>
							<ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-gray-600">
								{finalResult.learningPaths.map((item, index) => (
									<li key={`learning-${index}`}>{item}</li>
								))}
							</ul>
						</div>
					</div>

					<div className="br-card">
						<div className="card-content p-6">
							<h2 className="text-lg font-semibold text-gray-900">{t("responses.ethical_maturity_scale")}</h2>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								{(classificationLevels.length ? classificationLevels : DEFAULT_CLASSIFICATION_LEVELS)
									.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
									.map((level) => {
										const isActive = level.display_order === finalResult.level || level.level_key === finalResult.levelKey;
										return (
											<div
												key={`level-${level.level_key}`}
												className={`rounded-md border p-4 ${isActive ? "border-[#1451B4] bg-[#1451B4]/5" : "border-gray-200 bg-white"}`}
											>
												<p className={`text-xs font-semibold uppercase ${isActive ? "text-[#1451B4]" : "text-gray-500"}`}>
													{level.title}
												</p>
												<p className="text-lg font-semibold text-gray-900">{level.subtitle}</p>
												<p className="mt-1 text-sm text-gray-600">{level.description}</p>
											</div>
										);
									})}
							</div>
						</div>
					</div>
				</div>
			</DefaultLayout>
		);
	}

	const handleNavigateToSession = (code: string) => {
		if (!code) return;
		if (!sessionMap.has(code)) {
			showDialog(t("dlg.attention"), t("dlg.no_previous_session"), "#1451B4", "OK", "error", () => { });
			return;
		}
		setCurrentSessionCode(code);
		if (topRef.current) {
			topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	const handlePreSubmit = () => {
		const unanswered = findFirstUnansweredQuestion();
		if (unanswered) {
			showDialog(
				t("dlg.attention"),
				t("dlg.answer_all_questions"),
				"#1451B4",
				"OK",
				"error",
				() => { }
			);
			return;
		}

		if (!currentSession) {
			showDialog(t("dlg.attention"), t("dlg.no_session_available_at_moment"), "#1451B4", "OK", "error", () => { });
			return;
		}

		const payload = buildSubmissionPayload();
		if (!payload) return;

		if (currentSession.is_triage) {
			const evaluation = evaluateCurrentSession();
			if (!evaluation) {
				showDialog(t("dlg.attention"), t("dlg.could_not_calculate_triage_classification"), "#1451B4", "OK", "error", () => { });
				return;
			}
			setPendingSubmission({ payload, session: currentSession });
			setPendingEvaluation(evaluation);
			setIsReviewModalOpen(true);
			return;
		}

		void submitPreparedData(payload, currentSession);
	};

	const handleConfirmReview = () => {
		if (!pendingSubmission || !pendingEvaluation) return;
		setIsReviewModalOpen(false);
		void submitPreparedData(pendingSubmission.payload, pendingSubmission.session, pendingEvaluation);
	};

	const handleCancelReview = () => {
		setIsReviewModalOpen(false);
		setPendingSubmission(null);
		setPendingEvaluation(null);
	};

	const renderQuestionField = (question: Question) => {
		const type = (question.type || "").toLowerCase();
		const value = answers[question.code] ?? (type === "checkbox" ? [] : "");
		const options = parseOptions(question.options);

		if (type === "textarea") {
			return (
				<textarea
					className="mt-2 w-full rounded-xl border border-gray-200 bg-white/70 p-3 text-sm focus:border-[#0F3B62] focus:outline-none"
					rows={4}
					value={(value as string) ?? ""}
					onChange={(event) => handleTextChange(question, event.target.value)}
				/>
			);
		}

		if (type === "text") {
			return (
				<input
					className="mt-2 w-full rounded-xl border border-gray-200 bg-white/70 p-3 text-sm focus:border-[#0F3B62] focus:outline-none"
					value={(value as string) ?? ""}
					onChange={(event) => handleTextChange(question, event.target.value)}
				/>
			);
		}

		if (type === "radio" || type === "multiple_choice") {
			if (!options.length) {
				return <p className="mt-2 text-sm text-gray-500">{t("responses.no_options_configured")}</p>;
			}
			return (
				<div className="mt-3 space-y-2">
					{options.map((option) => {
						const optionValue = String(option.value);
						const inputId = `${question.code}-${optionValue}`; // Criar ID único
						return (
							<div key={optionValue} className="br-radio">
								<input
									id={inputId}
									type="radio"
									name={question.code}
									value={optionValue}
									checked={value === optionValue}
									onChange={() => handleRadioChange(question, optionValue)}
								/>
								<label htmlFor={inputId}>
									<div className="pb-4">
										<p className="text-sm font-medium text-gray-800 mb-0" >
											{option.text || optionValue}
										</p>
										{isTest && typeof option.points !== "undefined" && (
											<p className="text-xs text-danger-500 font-bold">
												{t("responses.impact")}: {option.points} {t("responses.score")}
											</p>
										)}
									</div>
								</label>
							</div>
						);
					})}
				</div>
			);
		}

		if (type === "checkbox") {
			const current = Array.isArray(value) ? value : [];
			if (!options.length) {
				return <p className="mt-2 text-sm text-gray-500">{t("responses.no_options_configured")}</p>;
			}
			return (
				<div className="mt-3 space-y-2">
					{options.map((option) => {
						const optionValue = String(option.value);
						const inputId = `${question.code}-${optionValue}`; // ID único
						return (
							<div key={optionValue} className="br-checkbox mb-2">
								<input
									id={inputId}
									type="checkbox"
									value={optionValue}
									checked={current.includes(optionValue)}
									onChange={() => handleCheckboxChange(question, optionValue)}
								/>
								<label htmlFor={inputId}>
									<div className="pb-4">
										<p className="text-sm font-medium text-gray-800 mb-0">
											{option.text || optionValue}
										</p>
										{isTest && typeof option.points !== "undefined" && (
											<p className="text-xs text-danger-500 font-bold">
												{t("responses.impact")}: {option.points} {t("responses.score")}
											</p>
										)}
									</div>
								</label>
							</div>
						);
					})}
				</div>
			);
		}

		return (
			<input
				className="mt-2 w-full rounded-xl border border-gray-200 bg-white/70 p-3 text-sm focus:border-[#0F3B62] focus:outline-none"
				value={(value as string) ?? ""}
				onChange={(event) => handleTextChange(question, event.target.value)}
			/>
		);
	};

	return (
		<DefaultLayout>
			<div className="flex justify-center px-4 sm:px-6">
				<div ref={topRef} className="w-full max-w-5xl space-y-6">
					<div className="br-card">
						<div className="card-content bg-gradient-to-r from-[#1451B4] to-[#0F3B62] p-6 text-white">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<h1 className="text-2xl text-white/80 font-semibold">{t("responses.form_evaluation")}</h1>
									{currentSession && (
										<p className="mt-1 text-sm text-white/80">
											{t("responses.session_current")}: <strong>{currentSession.name}</strong>
										</p>
									)}
								</div>
								<div className="text-right">
									<p className="text-sm text-white/70">{t("responses.progress")}</p>
									<p className="text-3xl text-white/80 font-semibold">{completionRate}%</p>
									<p className="text-xs text-white/70">{answeredCount} {t("responses.of")} {currentQuestions.length} {t("responses.questions_answered")}</p>
								</div>
							</div>

							<div className="mt-6 text-white/90  bg-white/20 p-4 backdrop-blur">
								<span className="text-sm font-medium text-white">
									{t("responses.select_project")}<b className="text-pink-200"> *</b>
								</span>
								<select
									className="mt-2 w-full border border-white/30 bg-white/20  text-sm text-white focus:border-white"
									value={selectedProjectId}
									onChange={(event) => setSelectedProjectId(event.target.value)}
								>
									<option value="">{t("responses.select_project_placeholder")}</option>
									{projects.map((project) => (
										<option key={project.id} value={project.id}>
											{project.name} — {project.responsible}
										</option>
									))}
								</select>

								{triageSessions.length > 0 && (
									<div className="mt-4">
										<span className="text-sm font-medium text-white">
											{t("responses.select_triage_session") ?? "Selecione a pré-triagem"}<b className="text-pink-200"> *</b>
										</span>
										<select
											className="mt-2 w-full border border-white/30 bg-white/20  text-sm text-white focus:border-white"
											value={selectedTriageCode}
											onChange={(event) => handleSelectTriageSession(event.target.value)}
										>
											<option value="">Selecione um formulário</option>
											{triageSessions.map((session) => (
												<option key={session.id} value={session.code}>
													{session.name}
												</option>
											))}
										</select>
									</div>
								)}
							</div>
						</div>
					</div>

					{completedSessionList.length > 0 && (
						<div className="br-card">
							<div className="card-content bg-white p-6">
								<p className="text-sm font-semibold text-[#0F3B62]">{t("responses.sessions_sent")}</p>
								<p className="text-xs text-gray-500">{t("responses.select_to_review")}</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{completedSessionList.map((item) => {
										const isActive = currentSessionCode === item.code;
										return (
											<button
												key={item.code}
												type="button"
												className={`br-button ${isActive
													? "primary"
													: "secondary"}`}
												onClick={() => handleNavigateToSession(item.code)}
												disabled={isActive}
											>
												{item.name}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					)}

					{loading && (
						<div className="br-card">
							<div className="card-content bg-white p-6 text-center">
								<p className="text-sm text-gray-500">{t("responses.loading_sessions_questions")}</p>
							</div>
						</div>
					)}

					{!loading && !currentSession && (
						<div className="br-card">
							<div className="card-content bg-white p-6 text-center">
								<p className="text-sm text-gray-500">{t("responses.no_active_session_found")}</p>
							</div>
						</div>
					)}

					{currentSession && (
						<div className="br-card">
							<div key={currentSession.id} className="card-content bg-white p-6">
								<div className="border-b border-gray-100 pb-4">
									<p className="text-xs uppercase tracking-[0.3em] text-[#0F3B62]">{t("sessions.one")}</p>
									<h2 className="text-xl font-semibold text-gray-900">{currentSession.name}</h2>
									{isTest && <p className="text-xs text-gray-500">{t("sessions.code")}: {currentSession.code}</p>}
									{currentSession.description && (
										<p className="mt-1 text-sm text-gray-500">{currentSession.description}</p>
									)}
								</div>

								<div className="mt-6 space-y-6">
									{currentQuestions.map((question) => {
										if (!isQuestionVisible(question)) return null;
										return (
											<div key={question.id} className="br-card border border-gray-200">
												<div key={question.id} className="card-content p-5">
													<div className="flex flex-wrap items-start justify-between gap-3">
														<div>
															<p className="text-sm font-semibold text-gray-800">
																{question.text}
																{question.is_critical && <span className="text-pink-500"> *</span>}
															</p>
															{isTest && question.actors?.length ? (
																<p className="mt-1 text-xs text-gray-500">
																	{t("responses.involved")}:{" "}
																	{question.actors.map((actor) => (
																		<span key={actor} className="mr-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600 shadow">
																			{actor}
																		</span>
																	))}
																</p>
															) : null}
														</div>
														{isTest && <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500 shadow">
															{t("responses.code")}: {question.code}
														</span>}
													</div>

													{renderQuestionField(question)}
												</div>
											</div>
										);
									})}
									{!currentQuestions.length && (
										<p className="text-sm text-gray-500">{t("responses.no_questions_configured")}</p>
									)}
								</div>
							</div>
						</div>
					)}

					<div className="sticky bottom-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-white/90 p-4 shadow-2xl backdrop-blur">
						<button
							className="br-button secondary w-full sm:w-auto justify-center"
							onClick={resetForm}
							type="button"
							disabled={submitting}
						>
							{t("responses.button_clear_responses")}
						</button>
						<button
							className="br-button primary w-full sm:w-auto justify-center"
							onClick={handlePreSubmit}
							type="button"
							disabled={submitting || !currentSession}
						>
							{submitting ? t("common.sending") : currentSession?.is_triage ? t("responses.button_calculate_preliminary_risk") : isFinalStep ? t("responses.button_generate_final_classification") : t("responses.button_next_step")}
						</button>
					</div>
				</div>
			</div>

			{isReviewModalOpen && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4" style={{ zIndex: 999999 }}>
					<div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
						<div className="mb-4">
							<p className="text-xs uppercase tracking-[0.3em] text-[#0F3B62]">{t("responses.modalReview_title")}</p>
							<h3 className="text-xl font-semibold text-gray-900">{t("responses.modalReview_triage_result")}</h3>
							<p className="mt-1 text-sm text-gray-500">
								{t("responses.modalReview_description")}
							</p>
						</div>

						<div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
							{pendingEvaluation && (() => {
								const evaluation = pendingEvaluation;
								const style = RISK_LEVEL_STYLES[evaluation.level] ?? {
									badge: "bg-gray-100 text-gray-800",
									border: "border-gray-200",
									text: "text-gray-900",
									background: "bg-gray-50",
									legend: "",
								};
								return (
									<div className={`rounded-2xl border ${style.border} ${style.background} p-4`}>
										<div className="flex flex-wrap items-center justify-between gap-4">
											<div>
												<p className="text-xs uppercase tracking-wide text-gray-500">{evaluation.sessionName}</p>
												<p className={`text-lg font-semibold ${style.text}`}>{evaluation.level}</p>
											</div>
											<span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
												{evaluation.level}
											</span>
										</div>
										<p className={`text-lg ${style.text}`}>{t(style.legend)}</p>
										{evaluation.advice && (
											<p className="mt-2 text-sm text-gray-600">{evaluation.advice}</p>
										)}
									</div>
								);
							})()}
						</div>

						<div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
							<button
								className="br-button secondary w-full sm:w-auto justify-center"
								onClick={handleCancelReview}
								type="button"
								disabled={submitting}
							>
								{t("responses.modalReview_button_back")}
							</button>
							<button
								className="br-button primary w-full sm:w-auto justify-center"
								onClick={handleConfirmReview}
								type="button"
								disabled={submitting}
							>
								{submitting ? t("common.sending") : t("responses.modalReview_button_confirm")}
							</button>
						</div>
					</div>
				</div>
			)}
		</DefaultLayout>
	);
}
