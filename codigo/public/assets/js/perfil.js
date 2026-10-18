(() => {
  const $ = id => document.getElementById(id);
  const texto = (id, valor, padrao = "Não informado") => { const el = $(id); if (el) el.textContent = valor == null || String(valor).trim() === "" ? padrao : String(valor); };
  const nomeVisivel = usuario => usuario?.nome || usuario?.usuario || usuario?.login || "Estudante Quorbe";

  function exibirPerfil(usuario) {
    if (!usuario) {
      ["nomePerfil", "nomeDetalhe", "usuarioDetalhe", "emailDetalhe", "funcaoDetalhe", "loginPerfil", "funcaoPerfil", "matriculaPerfil", "turmasPerfil", "orbesPerfil", "sequenciaPerfil", "nomeLateral", "funcaoLateral", "avatarUsuario", "avatarGrande"].forEach(id => texto(id, "—"));
      const aviso = $("avisoPerfil");
      aviso.textContent = "Não foi possível identificar um usuário nesta sessão. Abra a loja e selecione um usuário de teste para continuar.";
      aviso.classList.remove("d-none");
      return;
    }
    const nome = nomeVisivel(usuario);
    const usuarioLogin = usuario.usuario || usuario.login || "Não informado";
    const funcao = usuario.funcao || "Estudante";
    const inicial = nome.trim().charAt(0).toUpperCase() || "Q";
    texto("nomePerfil", nome); texto("loginPerfil", `@${usuarioLogin}`); texto("funcaoPerfil", funcao);
    texto("orbesPerfil", Number(usuario.orbes || 0).toLocaleString("pt-BR"), "0");
    texto("sequenciaPerfil", Number(usuario.sequenciaEstudos || 0), "0");
    texto("matriculaPerfil", usuario.matricula);
    texto("turmasPerfil", Array.isArray(usuario.turmasIds) ? usuario.turmasIds.length : 0, "0");
    texto("nomeDetalhe", nome); texto("usuarioDetalhe", usuarioLogin); texto("emailDetalhe", usuario.email); texto("funcaoDetalhe", funcao);
    texto("nomeLateral", nome); texto("funcaoLateral", funcao); texto("avatarUsuario", inicial); texto("avatarGrande", inicial);
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
          if (usuario) { exibirPerfil(usuario); return; }
        }
      }
    } catch (erro) { console.warn("Não foi possível consultar /api/dados; tentando a sessão local.", erro); }
    if (sessao) { exibirPerfil(sessao); return; }
    exibirPerfil(null);
  }

  iniciar();
})();
