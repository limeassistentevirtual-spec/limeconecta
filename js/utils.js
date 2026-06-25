function brl(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
async function requireUser() {
  const db = window.limeSupabase;
  const { data } = await db.auth.getSession();
  if (!data.session) location.href = 'index.html';
  const { data: profile } = await db.from('perfis').select('*').eq('id', data.session.user.id).maybeSingle();
  if (!profile || !profile.ativo) {
    await db.auth.signOut();
    location.href = 'index.html';
  }
  return { session: data.session, profile };
}
async function logout() {
  await window.limeSupabase.auth.signOut();
  location.href = 'index.html';
}
