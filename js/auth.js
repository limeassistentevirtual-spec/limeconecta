const db = window.limeSupabase;
const msg = document.getElementById('auth-message');

function setMessage(text, type='') {
  msg.textContent = text || '';
  msg.className = `message ${type}`;
}

async function redirectIfLogged() {
  const { data } = await db.auth.getSession();
  if (data.session) {
    const profile = await getProfile(data.session.user.id);
    if (profile?.papel === 'admin') location.href = 'admin.html';
    else location.href = 'dashboard.html';
  }
}

async function getProfile(userId) {
  const { data } = await db.from('perfis').select('*').eq('id', userId).maybeSingle();
  return data;
}

redirectIfLogged();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMessage('Entrando...');
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return setMessage('E-mail ou senha inválidos.', 'error');

  const profile = await getProfile(data.user.id);
  if (!profile) {
    await db.auth.signOut();
    return setMessage('Seu e-mail ainda não foi liberado pela LIMECONECTA.', 'error');
  }
  if (!profile.ativo) {
    await db.auth.signOut();
    return setMessage('Sua licença está inativa. Fale com a LIME.', 'error');
  }

  await db.from('perfis').update({ ultimo_acesso: new Date().toISOString() }).eq('id', profile.id);
  location.href = profile.papel === 'admin' ? 'admin.html' : 'dashboard.html';
});

document.getElementById('forgot-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim().toLowerCase();
  if (!email) return setMessage('Digite seu e-mail para recuperar a senha.', 'error');
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/index.html' });
  if (error) return setMessage('Não foi possível enviar o e-mail de recuperação.', 'error');
  setMessage('Enviamos um e-mail para redefinir sua senha.', 'success');
});
