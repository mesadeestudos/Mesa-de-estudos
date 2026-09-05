import fs from 'node:fs';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';

const PDF_PATH = 'C:/Users/Lopes/Downloads/edital EAOEAR 2026.pdf';
const OUT_DIR = path.join(process.cwd(), 'data', 'imports');
const RAW_PATH = path.join(OUT_DIR, 'eaoear-2026-raw.txt');
const JSON_PATH = path.join(OUT_DIR, 'eaoear-2026.json');

const SPECIALTIES = [
  { code: 'CGR', name: 'Engenharia Cartográfica', vacancies: 1, ampla: 1, reservadas: 0 },
  { code: 'CMP', name: 'Engenharia da Computação', vacancies: 3, ampla: 2, reservadas: 1 },
  { code: 'ELT', name: 'Engenharia Elétrica', vacancies: 2, ampla: 2, reservadas: 0 },
  { code: 'ELN', name: 'Engenharia Eletrônica', vacancies: 2, ampla: 2, reservadas: 0 },
  { code: 'MEC', name: 'Engenharia Mecânica', vacancies: 2, ampla: 2, reservadas: 0 },
  { code: 'TEL', name: 'Engenharia de Telecomunicações', vacancies: 2, ampla: 2, reservadas: 0 },
  { code: 'PRU', name: 'Engenharia de Produção', vacancies: 2, ampla: 2, reservadas: 0 },
];

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanTopic(text) {
  return text
    .replace(/\n-- \d+ of \d+ --\n/g, '\n')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

function sectionBetween(text, startPattern, endPattern) {
  const start = text.search(startPattern);
  if (start < 0) throw new Error(`Seção inicial não encontrada: ${startPattern}`);

  const rest = text.slice(start);
  const end = rest.search(endPattern);
  if (end < 0) throw new Error(`Seção final não encontrada: ${endPattern}`);

  return rest.slice(0, end);
}

function extractNumberedTopics(section, prefix) {
  const headerRegex = new RegExp(`^${prefix.replaceAll('.', '\\.')}\\.\\d+\\s+(.+)$`, 'gm');
  const matches = [...section.matchAll(headerRegex)];

  return matches.map((match, index) => {
    const fullHeader = match[0].trim();
    const contentStart = match.index + fullHeader.length;
    const contentEnd = index + 1 < matches.length ? matches[index + 1].index : section.length;
    const rawTitleAndStart = match[1].trim();
    const [titlePart, ...bodyParts] = rawTitleAndStart.split(':');
    const title = titlePart.replace(/^\d+\s+/, '').trim();
    const descriptionStart = bodyParts.length > 0 ? bodyParts.join(':') : '';
    const description = cleanTopic(`${descriptionStart} ${section.slice(contentStart, contentEnd)}`);

    return {
      titulo: title,
      descricao: description ? `${title}: ${description}` : title,
    };
  });
}

function extractCommonDiscipline(text) {
  const common = sectionBetween(text, /^1 GRAMÁTICA E INTERPRETAÇÃO DE TEXTOS/m, /^2 CONHECIMENTOS ESPECIALIZADOS - CADAR/m);
  const grammarStart = common.search(/^1\.1\.1\s+/m);
  const interpretationHeader = common.search(/^1\.2 INTERPRETAÇÃO DE TEXTOS/m);
  const interpretationStart = common.search(/^1\.2\.1\s+/m);

  if (grammarStart < 0 || interpretationHeader < 0 || interpretationStart < 0) {
    throw new Error('Não foi possível extrair Gramática e Interpretação de Textos.');
  }

  const grammar = common.slice(grammarStart, interpretationHeader);
  const interpretation = common.slice(interpretationStart);

  return {
    nome: 'Gramática e Interpretação de Textos',
    tipo: 'B',
    peso: 1,
    qtd_questoes: 30,
    topicos: [
      {
        titulo: 'Gramática',
        descricao: cleanTopic(grammar.replace(/^1\.1\.1\s+Gramática:\s*/m, 'Gramática: ')),
      },
      {
        titulo: 'Interpretação de Textos',
        descricao: cleanTopic(interpretation.replace(/^1\.2\.1\s+\d*\s*Interpretação Textual:\s*/m, 'Interpretação Textual: ')),
      },
    ],
  };
}

function extractEssayDiscipline() {
  return {
    nome: 'Redação',
    tipo: 'B',
    peso: 1,
    qtd_questoes: null,
    topicos: [
      {
        titulo: 'Texto dissertativo-argumentativo',
        descricao: 'Elaboração de texto manuscrito, dissertativo-argumentativo, em prosa, sobre assunto da atualidade, com avaliação da capacidade de expressão conforme a norma culta da Língua Portuguesa.',
      },
    ],
  };
}

function extractSpecializedDisciplines(text) {
  const eaoear = sectionBetween(text, /^6 CONHECIMENTOS ESPECIALIZADOS [–-] EAOEAR/m, /^7 CONHECIMENTOS ESPECIALIZADOS [–-] EIAC/m);

  return SPECIALTIES.map((specialty, index) => {
    const escapedName = specialty.name.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startRegex = new RegExp(`^6\\.${index + 1}\\s+${escapedName}\\s+\\(${specialty.code}\\)`, 'm');
    const start = eaoear.search(startRegex);
    if (start < 0) throw new Error(`Especialidade não encontrada: ${specialty.name}`);

    const nextRegex = index + 1 < SPECIALTIES.length
      ? new RegExp(`^6\\.${index + 2}\\s+`, 'm')
      : /^7\s/m;
    const slice = eaoear.slice(start);
    const next = slice.slice(1).search(nextRegex);
    const section = next >= 0 ? slice.slice(0, next + 1) : slice;
    const topicos = extractNumberedTopics(section, `6.${index + 1}`);

    return {
      ...specialty,
      disciplina: {
        nome: specialty.name,
        tipo: 'E',
        peso: 1,
        qtd_questoes: 30,
        topicos,
      },
    };
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let text;
  if (fs.existsSync(RAW_PATH)) {
    text = fs.readFileSync(RAW_PATH, 'utf8');
  } else {
    const parser = new PDFParse({ data: fs.readFileSync(PDF_PATH) });
    const result = await parser.getText();
    await parser.destroy();
    text = result.text;
    fs.writeFileSync(RAW_PATH, text, 'utf8');
  }

  const normalized = normalizeText(text);
  const linguaPortuguesa = extractCommonDiscipline(normalized);
  const redacao = extractEssayDiscipline();
  const specialties = extractSpecializedDisciplines(normalized);

  const data = {
    fonte: {
      arquivo: PDF_PATH,
      texto_extraido: RAW_PATH,
      paginas: 108,
      observacoes: [
        'Dados estruturados a partir do Anexo III, Anexo IV e Art. 143-148 do edital.',
        'Banca/organizador inferido como DIRENS/CIAAR porque o edital não indica uma banca externa contratada.',
        'Questões: Art. 144 informa 30 questões de GIT e 30 de CE para EAOEAR; Redação não possui quantidade de questões.',
      ],
    },
    orgao: {
      nome: 'Comando da Aeronáutica',
      sigla: 'COMAER',
    },
    banca: {
      nome: 'Diretoria de Ensino da Aeronáutica / CIAAR',
      sigla: 'DIRENS-CIAAR',
    },
    concurso: {
      nome: 'Exame de Admissão ao Estágio de Adaptação de Oficiais Engenheiros da Aeronáutica 2026',
      sigla: 'EAOEAR 2026',
    },
    edital: {
      ano: 2026,
      status: 'PUBLICADO',
      data_prova: null,
    },
    cargos: specialties.map(specialty => ({
      nome: `EAOEAR - ${specialty.name} (${specialty.code})`,
      especialidade: specialty.name,
      sigla: specialty.code,
      vagas: {
        total: specialty.vacancies,
        ampla_concorrencia: specialty.ampla,
        reservadas: specialty.reservadas,
      },
      disciplinas: [
        linguaPortuguesa,
        redacao,
        specialty.disciplina,
      ],
    })),
  };

  fs.writeFileSync(JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  const topicos = data.cargos.reduce((acc, cargo) => acc + cargo.disciplinas.reduce((sum, disc) => sum + disc.topicos.length, 0), 0);
  console.log(JSON.stringify({
    out: path.relative(process.cwd(), JSON_PATH),
    cargos: data.cargos.length,
    disciplinas: data.cargos.reduce((acc, cargo) => acc + cargo.disciplinas.length, 0),
    topicos,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
