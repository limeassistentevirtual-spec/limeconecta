const dbDash = window.limeSupabase;
let CURRENT = null;
let PATIENTS = [];

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('help-btn').addEventListener('click', () => document.getElementById('help-modal').classList.add('show'));
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('show')));
document.getElementById('add-patient-btn').addEventListener('click', addPatient);
document.getElementById('excel-btn').addEventListener('click', generateExcel);

init();
async function init() {
  CURRENT = await requireUser();
  document.getElementById('welcome-title').textContent = `Olá, ${CURRENT.profile.nome || 'psicóloga'} 👋`;
  document.getElementById('license-status').textContent = `Plano: ${CURRENT.profile.plano || 'Essencial'} • Licença ativa`;
  await loadPatients();
}
async function loadPatients() {
  const { data, error } = await dbDash.from('pacientes').select('*').eq('usuario_id', CURRENT.profile.id).order('nome');
  if (error) return alert('Erro ao carregar pacientes.');
  PATIENTS = data || [];
  renderPatients();
}
function renderPatients() {
  const body = document.getElementById('patients-body');
  body.innerHTML = PATIENTS.map(p => `
    <tr>
      <td><strong>${p.nome}</strong></td>
      <td>${brl(p.valor_padrao)}</td>
      <td><span class="pill ok">Ativo</span></td>
      <td><button class="btn-small" onclick="editPatient('${p.id}')">Editar</button> <button class="btn-small danger" onclick="deletePatient('${p.id}')">Excluir</button></td>
    </tr>
  `).join('') || '<tr><td colspan="4">Nenhum paciente cadastrado.</td></tr>';
  document.getElementById('metric-pacientes').textContent = PATIENTS.length;
  document.getElementById('metric-sessoes').textContent = 0;
  document.getElementById('metric-total').textContent = brl(0);
  document.getElementById('metric-ticket').textContent = brl(0);
}
async function addPatient() {
  const nome = prompt('Nome completo do paciente:');
  if (!nome) return;
  const valor = Number(String(prompt('Valor padrão da sessão:') || '0').replace(',', '.'));
  const { error } = await dbDash.from('pacientes').insert({ usuario_id: CURRENT.profile.id, nome: nome.trim(), valor_padrao: valor });
  if (error) return alert('Erro ao salvar paciente.');
  await loadPatients();
}
async function editPatient(id) {
  const p = PATIENTS.find(x => x.id === id);
  const nome = prompt('Nome do paciente:', p.nome);
  if (!nome) return;
  const valor = Number(String(prompt('Valor padrão:', p.valor_padrao) || '0').replace(',', '.'));
  const { error } = await dbDash.from('pacientes').update({ nome: nome.trim(), valor_padrao: valor }).eq('id', id).eq('usuario_id', CURRENT.profile.id);
  if (error) return alert('Erro ao editar.');
  await loadPatients();
}
async function deletePatient(id) {
  if (!confirm('Excluir paciente?')) return;
  const { error } = await dbDash.from('pacientes').delete().eq('id', id).eq('usuario_id', CURRENT.profile.id);
  if (error) return alert('Erro ao excluir.');
  await loadPatients();
}
function generateExcel() {
  const wb = XLSX.utils.book_new();
  const rows = [['Paciente', 'Valor padrão', 'Status'], ...PATIENTS.map(p => [p.nome, p.valor_padrao, 'Ativo'])];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 34 }, { wch: 18 }, { wch: 14 }];
  Object.keys(ws).forEach(cell => {
    if (!cell.startsWith('!')) ws[cell].s = { font: { name: 'DM Sans' } };
  });
  ['A1','B1','C1'].forEach(c => { if(ws[c]) ws[c].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '3C1557' } } }; });
  for (let i = 2; i <= rows.length; i++) { if(ws[`B${i}`]) { ws[`B${i}`].z = 'R$ #,##0.00'; ws[`B${i}`].s = { font: { bold: true } }; } }
  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
  XLSX.writeFile(wb, 'LIMECONECTA_Pacientes.xlsx');
}
