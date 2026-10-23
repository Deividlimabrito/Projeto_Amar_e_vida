// Geração de relatórios em PDF, 100% offline (HTML -> PDF no próprio aparelho).
// Depende de: expo-print (gera o PDF) e expo-sharing (menu de compartilhar/salvar/imprimir).
//   npx expo install expo-print expo-sharing expo-file-system
import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system'; // API nova (SDK 54+): só usamos para renomear o PDF
import { DAYS, hhmm, isoDate, sessionLabel } from '../components/ui';

// ---------- Identidade visual ----------
const COR = {
  sun: '#FDC93B', pri: '#0B6E8A', ink: '#12303B', bg: '#EEF5F7',
  ok: '#2E9E6B', no: '#D9534F', mut: '#6B8791', line: '#D5E3E8', na: '#B8C7CC',
};
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ---------- Auxiliares ----------
// Nomes digitados pelo usuário entram no HTML: escapamos para não quebrar o layout.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brDate = (iso = '') => iso.split('-').reverse().join('/');
const weekdayOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return DAYS[new Date(y, m - 1, d).getDay()]; };
const stamp = () => { const n = new Date(); return `${brDate(isoDate(n))} às ${hhmm(n.getTime())}`; };
const namesOf = (list = [], ids = []) => ids.map((i) => list.find((p) => p.id === i)?.name).filter(Boolean).map(esc).join(', ') || '—';
const byName = (a, b) => a.name.localeCompare(b.name);

// ---------- CSS compartilhado ----------
const CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: ${COR.ink}; font-size: 12px; margin: 0; padding: 24px;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .header { background: ${COR.sun}; border-radius: 12px; padding: 16px 20px; }
  .brand { font-size: 11px; font-weight: 800; letter-spacing: 3px; }
  h1 { font-size: 22px; margin: 4px 0 2px; }
  .sub { font-size: 13px; font-weight: 600; }
  .meta { display: flex; flex-wrap: wrap; background: ${COR.bg}; border-radius: 12px; padding: 12px 14px 4px; margin-top: 12px; }
  .item { width: 50%; padding: 0 6px 8px; }
  .item b { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: ${COR.pri}; margin-bottom: 1px; }
  .totals { display: flex; margin: 12px -4px 4px; }
  .tot { flex: 1; margin: 0 4px; text-align: center; padding: 10px 6px; border-radius: 10px; color: #fff; font-weight: 800; font-size: 11px; }
  .tot span { display: block; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: ${COR.pri}; color: #fff; text-align: left; padding: 8px 10px; font-size: 11px; }
  td { padding: 8px 10px; border-bottom: 1px solid ${COR.line}; }
  tbody tr:nth-child(even) td { background: ${COR.bg}; }
  .c { text-align: center; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-weight: 700; font-size: 11px; color: #fff; }
  .ok { background: ${COR.ok}; } .no { background: ${COR.no}; } .na { background: ${COR.na}; }
  .okc { background: #DDF3E8 !important; color: ${COR.ok}; font-weight: 800; }
  .noc { background: #FBE3E2 !important; color: ${COR.no}; font-weight: 800; }
  .nac { color: ${COR.na}; }
  h2 { font-size: 14px; color: ${COR.pri}; margin: 20px 0 0; }
  .legend { color: ${COR.mut}; font-size: 10px; margin-top: 6px; }
  .foot { margin-top: 18px; padding-top: 10px; border-top: 2px solid ${COR.sun}; color: ${COR.mut}; font-size: 10px; display: flex; justify-content: space-between; }
`;

const page = (body) => `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><style>${CSS}</style></head><body>${body}</body></html>`;
const item = (label, value) => `<div class="item"><b>${label}</b>${value}</div>`;
const tot = (label, n, color) => `<div class="tot" style="background:${color}"><span>${n}</span>${label}</div>`;
const badge = (p) =>
  p === true ? '<span class="badge ok">Presente</span>'
  : p === false ? '<span class="badge no">Falta</span>'
  : '<span class="badge na">Não marcado</span>';

// ---------- Relatório da chamada (um dia/sessão) ----------
function attendanceHtml({ session, attendance, data, students }) {
  const marks = attendance.marks || {};
  // Lista = quem foi marcado + (opcional) alunos vinculados à sessão que ficaram sem marcação.
  const ids = [...new Set([...Object.keys(marks), ...(students || []).map((s) => s.id)])];
  const rows = ids
    .map((id) => ({ name: data.students.find((s) => s.id === id)?.name || '(aluno não encontrado)', present: marks[id]?.present }))
    .sort(byName);
  const nP = rows.filter((r) => r.present === true).length;
  const nF = rows.filter((r) => r.present === false).length;
  const nN = rows.length - nP - nF;

  const body = `
    <div class="header">
      <div class="brand">A MARÉ VIDA</div>
      <h1>Lista de Chamada</h1>
      <div class="sub">${esc(session.sport)} · ${weekdayOf(attendance.date)}, ${brDate(attendance.date)}</div>
    </div>
    <div class="meta">
      ${item('Modalidade', esc(session.sport))}
      ${item('Data', `${brDate(attendance.date)} (${weekdayOf(attendance.date)})`)}
      ${item('Horário', `${esc(attendance.start)} às ${esc(attendance.end)}`)}
      ${item('Professor(es)', namesOf(data.teachers, attendance.teacherIds))}
      ${item('Voluntário(s) presentes', namesOf(data.volunteers, attendance.volunteerIds))}
      ${attendance.savedAt ? item('Chamada feita por', `${esc(attendance.savedByName || '—')} às ${hhmm(attendance.savedAt)}`) : ''}
    </div>
    <div class="totals">
      ${tot('Presentes', nP, COR.ok)}
      ${tot('Faltas', nF, COR.no)}
      ${nN > 0 ? tot('Não marcados', nN, COR.na) : ''}
    </div>
    <table>
      <thead><tr><th style="width:40px">#</th><th>Aluno</th><th style="width:120px">Situação</th></tr></thead>
      <tbody>
        ${rows.length
          ? rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${badge(r.present)}</td></tr>`).join('')
          : '<tr><td colspan="3" class="c">Nenhum aluno nesta chamada.</td></tr>'}
      </tbody>
    </table>
    <div class="foot">
      <span>Gerado em ${stamp()}</span>
      <span>Total: ${nP} presente(s) · ${nF} falta(s)${nN > 0 ? ` · ${nN} não marcado(s)` : ''}</span>
    </div>`;
  return page(body);
}

// ---------- Relatório mensal de uma turma ----------
function monthlyHtml({ session, year, month, attendances, data }) {
  const cols = [...attendances].sort((a, b) => a.date.localeCompare(b.date));

  // Alunos = quem aparece em alguma chamada do mês + alunos ativos vinculados à sessão.
  const ids = new Set();
  cols.forEach((a) => Object.keys(a.marks || {}).forEach((i) => ids.add(i)));
  data.students.filter((s) => s.active && (s.sessionIds || []).includes(session.id)).forEach((s) => ids.add(s.id));

  const rows = [...ids].map((id) => {
    const cells = cols.map((a) => a.marks?.[id]?.present);
    const p = cells.filter((c) => c === true).length;
    const f = cells.filter((c) => c === false).length;
    return { name: data.students.find((s) => s.id === id)?.name || '(aluno não encontrado)', cells, p, f, pct: Math.round((p / cols.length) * 100) };
  }).sort(byName);

  const totalP = rows.reduce((n, r) => n + r.p, 0);
  const totalF = rows.reduce((n, r) => n + r.f, 0);
  const media = (totalP / cols.length).toFixed(1).replace('.', ',');
  const perClass = cols.map((a) => Object.values(a.marks || {}).filter((m) => m.present).length);

  const cell = (c) => (c === true ? '<td class="c okc">P</td>' : c === false ? '<td class="c noc">F</td>' : '<td class="c nac">–</td>');

  const body = `
    <div class="header">
      <div class="brand">A MARÉ VIDA</div>
      <h1>Relatório Mensal</h1>
      <div class="sub">${esc(session.sport)} · ${MESES[month]} de ${year}</div>
    </div>
    <div class="meta">
      ${item('Turma', esc(sessionLabel(session)))}
      ${item('Período', `${MESES[month]}/${year}`)}
      ${item('Aulas registradas', cols.length)}
      ${item('Média de presentes por aula', media)}
    </div>
    <div class="totals">
      ${tot('Presenças', totalP, COR.ok)}
      ${tot('Faltas', totalF, COR.no)}
      ${tot('Alunos', rows.length, COR.pri)}
    </div>
    <table>
      <thead>
        <tr>
          <th>Aluno</th>
          ${cols.map((a) => `<th class="c">${brDate(a.date).slice(0, 5)}</th>`).join('')}
          <th class="c">Pres.</th><th class="c">Faltas</th><th class="c">%</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => `<tr><td>${esc(r.name)}</td>${r.cells.map(cell).join('')}<td class="c">${r.p}</td><td class="c">${r.f}</td><td class="c"><b>${r.pct}%</b></td></tr>`).join('')}
        <tr><td><b>Presentes na aula</b></td>${perClass.map((n) => `<td class="c"><b>${n}</b></td>`).join('')}<td colspan="3"></td></tr>
      </tbody>
    </table>
    <div class="legend">P = presente · F = falta · – = não marcado · % = presenças sobre as aulas registradas no mês</div>

    <h2>Aulas do mês</h2>
    <table>
      <thead><tr><th>Data</th><th>Horário</th><th>Professor(es)</th><th>Voluntário(s)</th><th>Chamada feita por</th></tr></thead>
      <tbody>
        ${cols.map((a) => `<tr>
          <td>${brDate(a.date)}</td><td>${esc(a.start)}–${esc(a.end)}</td>
          <td>${namesOf(data.teachers, a.teacherIds)}</td><td>${namesOf(data.volunteers, a.volunteerIds)}</td>
          <td>${a.savedAt ? `${esc(a.savedByName || '—')} (${hhmm(a.savedAt)})` : '—'}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="foot">
      <span>Gerado em ${stamp()}</span>
      <span>Total: ${totalP} presença(s) · ${totalF} falta(s)</span>
    </div>`;
  // Muitas colunas de datas: A4 em paisagem para caber.
  return { html: page(body), landscape: cols.length > 6 };
}

// ---------- Nome do arquivo ----------
// "Surfe · Qua" -> "Surfe_Qua": sem acento, espaço ou símbolo (seguro para WhatsApp/e-mail).
const slug = (v) => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_+|_+$/g, '');
const fileSafe = (...parts) => parts.map(slug).filter(Boolean).join('_') + '.pdf';

// O expo-print cria o PDF com um nome aleatório; aqui fazemos uma CÓPIA com nome legível
// (o original fica intacto). Se algo falhar, devolvemos o arquivo original.
async function giveName(uri, fileName) {
  try {
    const src = new File(uri);
    const target = new File(src.parentDirectory, fileName);
    if (target.exists) await target.delete(); // mesmo relatório gerado de novo
    await src.copy(target); // com await, qualquer erro cai no catch abaixo
    return target.exists ? target.uri : uri;
  } catch (e) {
    return uri;
  }
}

// ---------- Gera o arquivo e abre o menu de compartilhar ----------
async function createAndShare(build, errorTitle) {
  try {
    const { html, landscape = false, title, fileName } = build();
    // A4 em pontos: 595 x 842 (retrato) ou 842 x 595 (paisagem).
    const printed = await Print.printToFileAsync({ html, width: landscape ? 842 : 595, height: landscape ? 595 : 842 });
    const uri = fileName ? await giveName(printed.uri, fileName) : printed.uri;
    if (await Sharing.isAvailableAsync()) {
      const opts = { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' };
      const pageSize = { width: landscape ? 842 : 595, height: landscape ? 595 : 842 };
      try {
        await Sharing.shareAsync(uri, opts);
      } catch (e) {
        try {
          // Arquivo com nome bonito ilegível: tenta o original (nome aleatório).
          if (uri === printed.uri) throw e;
          await Sharing.shareAsync(printed.uri, opts);
        } catch (e2) {
          // Último recurso: abre a impressão direto do HTML (lá dá para "Salvar como PDF").
          console.warn('Compartilhar falhou:', e2?.message);
          await Print.printAsync({ html, ...pageSize });
        }
      }
    } else {
      await Print.printAsync({ uri }); // sem menu de compartilhar: abre a impressão
    }
    return true;
  } catch (e) {
    Alert.alert(errorTitle, `Não foi possível gerar ou compartilhar o PDF.\n\n${e?.message || ''}`.trim());
    return false;
  }
}

/**
 * PDF da chamada de uma sessão em um dia.
 * @param {object} p
 * @param {object} p.session     sessão (sport, day, start, end...)
 * @param {object} p.attendance  registro da chamada ({ date, start, end, marks, teacherIds, volunteerIds, savedAt, savedByName })
 * @param {object} p.data        dados do store ({ students, teachers, volunteers })
 * @param {Array}  [p.students]  alunos vinculados à sessão; os sem marcação aparecem como "Não marcado"
 * @returns {Promise<boolean>}   true se abriu o compartilhamento
 */
export function generateAttendancePDF(p) {
  return createAndShare(
    () => ({
      html: attendanceHtml(p),
      title: `Chamada ${p.session.sport} ${brDate(p.attendance.date)}`,
      // Ex.: Chamada_Surfe_23-10-2026_0900.pdf (o horário separa duas sessões do mesmo dia)
      fileName: fileSafe('Chamada', p.session.sport, brDate(p.attendance.date).replace(/\//g, '-'), String(p.session.start).replace(':', '')),
    }),
    'Erro ao gerar a chamada'
  );
}

/**
 * PDF resumido do histórico mensal de uma turma.
 * @param {object} p
 * @param {object} p.session      sessão
 * @param {number} p.year         ano (ex.: 2026)
 * @param {number} p.month        mês de 0 a 11 (igual ao Date)
 * @param {Array}  p.attendances  chamadas dessa sessão naquele mês
 * @param {object} p.data         dados do store
 */
export async function generateMonthlyHistoryPDF(p) {
  if (!p.attendances?.length) {
    Alert.alert('Sem chamadas', 'Não há chamadas neste mês para gerar o relatório.');
    return false;
  }
  return createAndShare(
    () => ({
      ...monthlyHtml(p),
      title: `Relatório ${p.session.sport} ${MESES[p.month]} ${p.year}`,
      // Ex.: Relatorio_Surfe_Qua_0900_Outubro_2026.pdf
      fileName: fileSafe('Relatorio', p.session.sport, DAYS[p.session.day], String(p.session.start).replace(':', ''), MESES[p.month], p.year),
    }),
    'Erro ao gerar o relatório mensal'
  );
}
