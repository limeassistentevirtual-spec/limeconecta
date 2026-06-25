const dbAdmin = window.limeSupabase;
let CURRENT_ADMIN = null;
let CLIENTS = [];

const modal = document.getElementById('client-modal');
const form = document.getElementById('client-form');
const clientMessage = document.getElementById('client-message');

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('add-client-btn').addEventListener('click', () => openClientModal());
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('show')));
form.addEventListener('submit', saveClient);

initAdmin();

async function initAdmin() {
  CURRENT_ADMIN = await requireUser();
  if (CURRENT_ADMIN.profile.papel !== 'admin') {
    location.href = 'dashboard.html';
    return;
  }
  await loadClients();
}

async function loadClients() {
  const { data, error } = await dbAdmin
    .from('perfis')
    .select('id,nome,email,papel,plano,ativo,vencimento,ultimo_acesso,criado_em')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    return alert('Erro ao carregar clientes. Verifique se as políticas de admin foram criadas no Supabase.');
  }

  CLIENTS = data || [];
  renderClients();
}

function renderClients() {
  const body = document.getElementById('clients-body');
  body.innerHTML = CLIENTS.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.nome || '-')}</strong></td>
      <td>${escapeHtml(c.email || '-')}</td>
      <td>${escapeHtml(formatPlan(c.plano))}</td>
      <td>${c.ativo ? '<span class="pill ok">Ativa</span>' : '<span class="pill danger">Bloqueada</span>'}</td>
      <td>${c.vencimento ? formatDate(c.vencimento) : '-'}</td>
      <td>${escapeHtml(c.papel || '-')}</td>
      <td>
        <button class="btn-small" onclick="toggleClient('${c.id}', ${!c.ativo})">${c.ativo ? 'Bloquear' : 'Liberar'}</button>
        <button class="btn-small" onclick="openClientModal('${c.id}')">Editar</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7">Nenhuma cliente cadastrada.</td></tr>';

  const nonAdmin = CLIENTS.filter(c => c.papel !== 'admin');
  document.getElementById('metric-total-clientes').textContent = nonAdmin.length;
  document.getElementById('metric-ativas').textContent = nonAdmin.filter(c => c.ativo).length;
  document.getElementById('metric-bloqueadas').textContent = nonAdmin.filter(c => !c.ativo).length;
  document.getElementById('metric-teste').textContent = nonAdmin.filter(c => String(c.plano || '').toLowerCase() === 'teste').length;
}

function openClientModal(id = null) {
  clientMessage.textContent = '';
  clientMessage.className = 'message';
  form.reset();
  document.getElementById('client-existing-id').value = id || '';
  document.getElementById('client-id').disabled = !!id;
  document.getElementById('client-modal-title').textContent = id ? 'Editar cliente' : 'Nova cliente';

  if (id) {
    const c = CLIENTS.find(x => x.id === id);
    document.getElementById('client-id').value = c.id;
    document.getElementById('client-name').value = c.nome || '';
    document.getElementById('client-email').value = c.email || '';
    document.getElementById('client-plan').value = c.plano || 'teste';
    document.getElementById('client-due').value = c.vencimento || '';
    document.getElementById('client-active').checked = !!c.ativo;
  } else {
    document.getElementById('client-active').checked = true;
    document.getElementById('client-plan').value = 'teste';
  }

  modal.classList.add('show');
}

async function saveClient(e) {
  e.preventDefault();
  const existingId = document.getElementById('client-existing-id').value;
  const id = document.getElementById('client-id').value.trim();
  const nome = document.getElementById('client-name').value.trim();
  const email = document.getElementById('client-email').value.trim().toLowerCase();
  const plano = document.getElementById('client-plan').value;
  const vencimento = document.getElementById('client-due').value || null;
  const ativo = document.getElementById('client-active').checked;

  clientMessage.textContent = 'Salvando...';

  let result;
  if (existingId) {
    result = await dbAdmin
      .from('perfis')
      .update({ nome, email, plano, vencimento, ativo })
      .eq('id', existingId);
  } else {
    result = await dbAdmin
      .from('perfis')
      .insert({ id, nome, email, plano, vencimento, ativo, papel: 'psicologa', primeiro_acesso: true });
  }

  if (result.error) {
    console.error(result.error);
    clientMessage.textContent = 'Erro ao salvar. Confira se o User ID existe no Auth e se as políticas de admin foram criadas.';
    clientMessage.className = 'message error';
    return;
  }

  clientMessage.textContent = 'Acesso salvo com sucesso.';
  clientMessage.className = 'message success';
  setTimeout(() => modal.classList.remove('show'), 500);
  await loadClients();
}

async function toggleClient(id, ativo) {
  const { error } = await dbAdmin.from('perfis').update({ ativo }).eq('id', id);
  if (error) {
    console.error(error);
    return alert('Erro ao alterar status. Verifique as políticas de admin no Supabase.');
  }
  await loadClients();
}

function formatPlan(plan) {
  const map = { teste: 'Teste', mensal: 'Mensal', anual: 'Anual', vitalicio: 'Vitalício' };
  return map[String(plan || '').toLowerCase()] || plan || '-';
}

function formatDate(date) {
  const [y, m, d] = String(date).split('-');
  return d && m && y ? `${d}/${m}/${y}` : date;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}
