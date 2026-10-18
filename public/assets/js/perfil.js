(() => {
  const nomeElemento = document.getElementById("nomePerfil");
  const aviso = document.getElementById("avisoPerfil");
  const nomeVisivel = usuario => usuario?.nome || usuario?.usuario || usuario?.login || "Estudante Quorbe";

  function exibirNome(usuario) {
    if (usuario) {
      nomeElemento.textContent = nomeVisivel(usuario);
      return;
    }
    nomeElemento.textContent = "Usuário";
    aviso.textContent = "Não foi possível identificar o usuário desta sessão. Você pode continuar para a loja.";
    aviso.classList.remove("d-none");
  }

  async function iniciar() {
    let sessao = null;
    try { sessao = JSON.parse(sessionStorage.getItem("usuarioCorrente") || "null"); } catch { sessao = null; }
    const idLocal = Number(localStorage.getItem("quorbeUsuarioId"));
    try {
      const resposta = await fetch("/api/dados", { headers: { Accept: "application/json" } });
      if (resposta.ok) {
        const dados = await resposta.json();
        if (Array.isArray(dados.usuarios)) {
          const usuario = dados.usuarios.find(u =>
            (sessao?.id != null && Number(u.id) === Number(sessao.id)) ||
            (sessao?.usuario && String(u.usuario) === String(sessao.usuario)) ||
            (sessao?.login && String(u.usuario || u.login) === String(sessao.login)) ||
            (sessao?.email && String(u.email || "").toLowerCase() === String(sessao.email).toLowerCase())
          ) || dados.usuarios.find(u => idLocal && Number(u.id) === idLocal);
          if (usuario) { exibirNome(usuario); return; }
        }
      }
    } catch (erro) { console.warn("Não foi possível consultar /api/dados; tentando a sessão local.", erro); }
    exibirNome(sessao);
  }

  iniciar();
})();
