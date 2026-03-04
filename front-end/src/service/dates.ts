import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

interface ReturnDateNow {
    date_timestamp: Date;
    date_string_us: string;
    date_string_br: string;
    date_value_us: string;
    date_hours: string;
    date_value_br: string;
    day: string;
    day_week_string: string;
    month: string;
    year: string;
    date_extenso: string;
    toISOString: string;
}

function returnDateNow(date?: Date | string): ReturnDateNow  {
	const brasiliaDate = date ? new Date(date) : new Date();

	return {
		date_timestamp: new Date(brasiliaDate.getTime() - brasiliaDate.getTimezoneOffset() * 60000),
		date_string_us: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "yyyyMMdd", { locale: ptBR }),
		date_string_br: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "ddMMyyyy", { locale: ptBR }),
		date_value_us: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "yyyy-MM-dd", { locale: ptBR }),
		date_hours: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "HH:mm", { locale: ptBR }),
		date_value_br: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "dd/MM/yyyy", { locale: ptBR }),
		day: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "dd", { locale: ptBR }),
		day_week_string: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "EE", { locale: ptBR }),
		month: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "MM", { locale: ptBR }),
		year: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "yyyy", { locale: ptBR }),
		date_extenso: formatInTimeZone(brasiliaDate, 'America/Sao_Paulo', "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss, 'horário de Brasília'", { locale: ptBR }),
		toISOString: brasiliaDate.toISOString()
	};
}

export default returnDateNow;
