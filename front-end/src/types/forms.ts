export interface CampoEtapaForms {
    legenda: string;
    explicacao: string;
    tipo: string,
    processos: string[]
}

export const camposForms: Record<string, CampoEtapaForms> = {
	"aprovacao_contrato_social": {
		"legenda": "Aprovação de contrato social",
		"explicacao": "Por favor, conferir o contrato de alteração, aprovar ou solicitar ajustes nesse campo. ",
		"tipo": "text",
		"processos": ["Alteração", "Abertura", "Outros"]
	},
	"dados_a_serem_alterados": {
		"legenda": "Dados Alteração",
		"explicacao": "Por favor, confirmar os dados de alteração a serem realizadas para andamento do processo. ",
		"tipo": "text",
		"processos": ["Alteração", "Abertura", "Outros"]
	},
	"exigencia_processo": {
		"legenda": "Exigência no processo",
		"explicacao": "O processo entrou em exigencia no órgao, por favor, enviar a pendência acima para cumprimento. ",
		"tipo": "text",
		"processos": ["Alteração", "Abertura", "Outros"]
	},

	"capital": {
		"legenda": "Informar o capital social",
		"explicacao": "Informar o valor do capital social da empresa que deverá constar em contrato social e a devida distribuição entre os sócios.",
		"tipo": "text",
		"processos": ["Encerramento"]
	},
	"atuacao": {
		"legenda": "Informar a forma de atuação",
		"explicacao": "Informar se a empresa atua em estabelecimento FIXO (exerce as atividades no endereço da sede) ou se ela atua pela INTERNET, se a prestação acontece em locais de terceiros. ",
		"tipo": "text",
		"processos": ["Encerramento"]
	},
	"responsavel_rfb": {
		"legenda": "Informar qual sócio é responsável na RFB",
		"explicacao": "Informar quem é o sócio indicado como responsável legal perante a Receita Federal.  ",
		"tipo": "text",
		"processos": ["Encerramento"]
	},
	"livros": {
		"legenda": "Informar qual dos sócios fará a guarda dos livros e documentos da empresa",
		"explicacao": "Indicar quem é o sócio que será responsável pela guarda dos documentos da empresa.",
		"tipo": "text",
		"processos": ["Encerramento"]
	},
	"numero_inscricao_encerramento": {
		"legenda": "Informar o numero da inscrição municipal da empresa para a devida baixa.",
		"explicacao": "Informar o número do cadastro da empresa na Prefeitura (mesmo numero utilizado para emissão de Notas na prefeitura)",
		"tipo": "text",
		"processos": ["Encerramento", "Alteração", "Abertura", "Outros"]
	},
	"login_prefeitura": {
		"legenda": "Informar o login Prefeitura",
		"explicacao": " Informar o dado de acesso USUÁRIO que é utilizado para logar no sistema da Prefeitura (é gerado na abertura da empresa).",
		"tipo": "text",
		"processos": ["Encerramento", "Alteração", "Abertura", "Outros"]
	},
	"senha_prefeitura": {
		"legenda": "Informar a senha Prefeitura",
		"explicacao": "Informar o dado de acesso SENHA que é utilizado para logar no sistema da Prefeitura (é gerado na abertura da empresa).",
		"tipo": "text",
		"processos": ["Encerramento", "Alteração", "Abertura", "Outros"]
	},
	"contrato_assinado": {
		"legenda": "Contrato Social Assinado (Anexar)",
		"explicacao": "Anexar o contrato enviando anteriormente assinado nesse campo. ",
		"tipo": "file",
		"processos": ["Encerramento"]
	},
	"data_contrato_assinado": {
		"legenda": "Data do Contrato Social Assinado",
		"explicacao": "Informe a data de assinaturado documento assinado nesse campo. ",
		"tipo": "text",
		"processos": ["Encerramento"]
	},
	"comprovante_taxa": {
		"legenda": "Comprovante Taxa (Anexar)",
		"explicacao": "Anexar o comprovante de pagamento da taxa enviada.",
		"tipo": "file",
		"processos": ["Encerramento", "Alteração", "Abertura", "Outros"]
	},
	"procuracao": {
		"legenda": "Procuração Assinada (Anexar)",
		"explicacao": "Anexar a procuração (Documento de autorização para representação perantes os órgãos) assinada.",
		"tipo": "file",
		"processos": ["Encerramento", "Alteração", "Abertura", "Outros"]
	},
	"requerimentos": {
		"legenda": "Requerimentos Assinados (Anexar)",
		"explicacao": "Anexar os requerimentos enviados da Prefeitura assinados nesse campo.",
		"tipo": "file",
		"processos": ["Encerramento", "Alteração", "Abertura", "Outros"]
	},
	"outros_documentos": {
		"legenda": "Documentos Adicionais (Anexar)",
		"explicacao": "Anexar a documentação extra exigida.",
		"tipo": "file",
		"processos": ["Encerramento"]
	},
	"outros_documentos_1": {
		"legenda": "Documentos Adicionais (Anexar) 1",
		"explicacao": "Anexar a documentação extra exigida.",
		"tipo": "file",
		"processos": ["Encerramento"]
	},
	"outros_documentos_2": {
		"legenda": "Documentos Adicionais (Anexar) 2",
		"explicacao": "Anexar a documentação extra exigida.",
		"tipo": "file",
		"processos": ["Encerramento"]
	},
	"outros_documentos_3": {
		"legenda": "Documentos Adicionais (Anexar) 3",
		"explicacao": "Anexar a documentação extra exigida.",
		"tipo": "file",
		"processos": ["Encerramento"]
	},
	"documentos_socios": {
		"legenda": "Documentos sócios",
		"explicacao": "Por favor, enviar o documento (frente e verso) do sócio para andamento do processo.",
		"tipo": "file",
		"processos": ["Alteração", "Abertura", "Outros"]
	},
	"iptu": {
		"legenda": "IPTU",
		"explicacao": "Por favor, enviar o IPTU com todas as informacoes do endereço para andamento do processo. ",
		"tipo": "file",
		"processos": ["Alteração", "Abertura", "Outros"]
	},
	"alvara_avcb": {
		"legenda": "AVCB/Alvarás",
		"explicacao": "Por favor, enviar o AVCB/Alvará do local do endereco da empresa para andamento do processo. ",
		"tipo": "file",
		"processos": ["Alteração", "Abertura", "Outros"]
	},
};

