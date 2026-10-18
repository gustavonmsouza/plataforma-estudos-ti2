function usuarioLogado() {
  try {
    return JSON.parse(sessionStorage.getItem('usuarioCorrente'));
  } catch (e) {
    return null;
  }
}

function irParaLogin() {
  window.location.replace('/index.html');
}

function exigirLogin() {
  const u = usuarioLogado();
  if (!u || !u.funcao) irParaLogin();
}

function exigirFuncao(funcao) {
  const u = usuarioLogado();
  if (!u || !u.funcao) {
    irParaLogin();
    return;
  }
  if (u.funcao !== funcao) {
    window.location.replace('/' + u.funcao + '/home.html');
  }
}

function sair() {
  sessionStorage.removeItem('usuarioCorrente');
  irParaLogin();
}
