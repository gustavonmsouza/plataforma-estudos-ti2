const lista = document.getElementById("lista");
const mensagem = document.getElementById("mensagem");
const saldoOrbes = document.getElementById("saldoOrbes");
const modalCosmeticoEl = document.getElementById("modalCosmetico");
const modalResgateEl = document.getElementById("modalResgate");
const modalUsuarioEl = document.getElementById("modalUsuario");

let dados = { usuarios: [], cosmeticos: [], cosmeticosUsuarios: [] };
let usuarioAtual = null;
let cosmeticoParaResgatar = null;

const modalCosmetico = bootstrap.Modal.getOrCreateInstance(modalCosmeticoEl);
const modalResgate = bootstrap.Modal.getOrCreateInstance(modalResgateEl);
const modalUsuario = bootstrap.Modal.getOrCreateInstance(modalUsuarioEl);

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function mostrarMensagem(texto, tipo = "success") {
  mensagem.className = `alert alert-${tipo}`;
  mensagem.textContent = texto;
  mensagem.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (tipo === "success") {
    window.setTimeout(() => mensagem.classList.add("d-none"), 4500);
  }
}

async function requisicao(url, opcoes = {}) {
  const headers = { ...(opcoes.headers || {}) };
  if (usuarioAtual) headers["x-usuario-id"] = String(usuarioAtual.id);
  if (opcoes.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  let resposta;
  try {
    resposta = await fetch(url, { ...opcoes, headers });
  } catch (erro) {
    console.error("Falha de conexão:", erro);
    throw new Error("Não foi possível conectar ao servidor. Confira se node servidor.js está em execução.");
  }

  const texto = await resposta.text();
  let resultado = {};
  try { resultado = texto ? JSON.parse(texto) : {}; }
  catch { throw new Error("O servidor retornou uma resposta inválida."); }

  if (!resposta.ok) throw new Error(resultado.erro || `Erro HTTP ${resposta.status}.`);
  return resultado;
}

function ehAdministrador() {
  return ["administrador", "admin"].includes(String(usuarioAtual?.funcao || "").toLowerCase());
}

function possuiCosmetico(cosmeticoId) {
  return dados.cosmeticosUsuarios.some(rel =>
    Number(rel.usuarioId) === Number(usuarioAtual?.id) &&
    Number(rel.cosmeticoId) === Number(cosmeticoId)
  );
}

function resolverImagem(caminho) {
  return String(caminho || "").trim();
}

function atualizarCabecalho() {
  document.getElementById("nomeUsuario").textContent = usuarioAtual?.nome || usuarioAtual?.usuario || usuarioAtual?.login || "Usuário";
  document.getElementById("funcaoUsuario").textContent = usuarioAtual?.funcao || "Sem função definida";
  document.getElementById("avatarUsuario").textContent = (usuarioAtual?.nome || usuarioAtual?.usuario || "Q").trim().charAt(0).toUpperCase();
  saldoOrbes.textContent = Number(usuarioAtual?.orbes || 0).toLocaleString("pt-BR");
  document.getElementById("botaoAdicionar").classList.toggle("d-none", !ehAdministrador());
  document.getElementById("textoCatalogo").textContent = ehAdministrador()
    ? "Modo administrador: gerencie os cosméticos disponíveis."
    : "Resgate itens com seus Orbes e personalize seu perfil.";
}

async function carregarDados() {
  try {
    dados = await requisicao("/api/dados", { headers: {} });

    if (!Array.isArray(dados.usuarios) || !Array.isArray(dados.cosmeticos)) {
      throw new Error("A API não retornou os arrays usuarios e cosmeticos.");
    }
    if (!Array.isArray(dados.cosmeticosUsuarios)) dados.cosmeticosUsuarios = [];

    const idSalvo = Number(localStorage.getItem("quorbeUsuarioId"));
    usuarioAtual = dados.usuarios.find(u => Number(u.id) === idSalvo) || null;

    preencherSeletorUsuarios();
    if (!usuarioAtual) {
      modalUsuario.show();
      renderizarCosmeticos();
      return;
    }

    atualizarCabecalho();
    renderizarCosmeticos();
  } catch (erro) {
    console.error("Erro ao carregar a loja:", erro);
    mostrarMensagem(erro.message, "danger");
  }
}

function preencherSeletorUsuarios() {
  const seletor = document.getElementById("seletorUsuario");
  seletor.innerHTML = "";
  dados.usuarios.forEach(usuario => {
    const opcao = document.createElement("option");
    opcao.value = usuario.id;
    opcao.textContent = `${usuario.nome || usuario.usuario || usuario.login || "Usuário"} — ${usuario.funcao || "sem função"} (ID ${usuario.id})`;
    seletor.appendChild(opcao);
  });
  if (usuarioAtual) seletor.value = String(usuarioAtual.id);
}

function renderizarCosmeticos() {
  lista.innerHTML = "";
  const termo = document.getElementById("pesquisa").value.trim().toLocaleLowerCase("pt-BR");
  const filtro = document.getElementById("filtro").value;

  const cosmeticosFiltrados = dados.cosmeticos.filter(c => {
    const possui = usuarioAtual ? possuiCosmetico(c.id) : false;
    const combinaPesquisa = String(c.nome).toLocaleLowerCase("pt-BR").includes(termo);
    const combinaFiltro = filtro === "todos" ||
      (filtro === "disponiveis" && !possui) ||
      (filtro === "possuídos" && possui);
    return combinaPesquisa && combinaFiltro;
  });

  document.getElementById("vazio").classList.toggle("d-none", cosmeticosFiltrados.length !== 0);

  cosmeticosFiltrados.forEach(cosmetico => {
    const coluna = document.createElement("div");
    coluna.className = "col-12 col-sm-6 col-xl-4";
    const possui = usuarioAtual ? possuiCosmetico(cosmetico.id) : false;
    const preco = Number(cosmetico.precoOrbes) || 0;
    const saldo = Number(usuarioAtual?.orbes) || 0;
    const imagem = resolverImagem(cosmetico.icone);
    const imagemSegura = escaparHTML(imagem);

    coluna.innerHTML = `
      <article class="cosmetic-card h-100">
        <div class="product-image-wrap">
          <img src="${imagemSegura}" alt="${escaparHTML(cosmetico.nome)}" class="product-image" loading="lazy">
          <span class="product-badge ${possui ? "owned" : ""}">${possui ? "Na sua coleção" : "Disponível"}</span>
        </div>
        <div class="product-content">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h3 class="product-title">${escaparHTML(cosmetico.nome)}</h3>
            <span class="product-price">✦ ${preco.toLocaleString("pt-BR")}</span>
          </div>
          <p class="product-description">${possui ? "Este cosmético já faz parte da sua coleção." : "Use seus Orbes para resgatar este item."}</p>
          <div class="product-actions">
            ${ehAdministrador() ? `
              <button type="button" class="btn btn-outline-primary btn-sm editar">Editar</button>
              <button type="button" class="btn btn-outline-danger btn-sm excluir">Excluir</button>
            ` : `
              <button type="button" class="btn ${possui ? "btn-owned" : "btn-primary"} w-100 resgatar" ${possui ? "disabled" : ""}>
                ${possui ? "Resgatado ✓" : `Resgatar por ${preco.toLocaleString("pt-BR")} Orbes`}
              </button>
            `}
          </div>
        </div>
      </article>
    `;

    const img = coluna.querySelector(".product-image");
    img.addEventListener("error", () => {
      img.classList.add("image-broken");
      img.alt = "Imagem não encontrada: " + cosmetico.nome;
      img.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320"><rect width="100%" height="100%" fill="#f1eefb"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="22" fill="#6c5ca7">Imagem não encontrada</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="15" fill="#6c5ca7">${escaparHTML(cosmetico.nome)}</text></svg>`
      );
    }, { once: true });

    const editar = coluna.querySelector(".editar");
    if (editar) editar.addEventListener("click", () => abrirEdicao(cosmetico));

    const excluir = coluna.querySelector(".excluir");
    if (excluir) excluir.addEventListener("click", () => excluirCosmetico(cosmetico));

    const resgatar = coluna.querySelector(".resgatar");
    if (resgatar) resgatar.addEventListener("click", () => abrirConfirmacaoResgate(cosmetico));

    lista.appendChild(coluna);
  });
}

function limparFormulario() {
  document.getElementById("formCosmetico").reset();
  document.getElementById("cosmeticoId").value = "";
  document.getElementById("tituloModalCosmetico").textContent = "Adicionar cosmético";
  document.getElementById("salvarCosmetico").textContent = "Salvar cosmético";
  atualizarPreview("");
}

function atualizarPreview(caminho) {
  const preview = document.getElementById("previewImagem");
  const semPreview = document.getElementById("semPreview");
  if (!caminho.trim()) {
    preview.classList.add("d-none");
    preview.removeAttribute("src");
    semPreview.classList.remove("d-none");
    return;
  }
  preview.src = caminho.trim();
  preview.classList.remove("d-none");
  semPreview.classList.add("d-none");
}

function abrirEdicao(cosmetico) {
  limparFormulario();
  document.getElementById("cosmeticoId").value = cosmetico.id;
  document.getElementById("nome").value = cosmetico.nome;
  document.getElementById("precoOrbes").value = cosmetico.precoOrbes;
  document.getElementById("icone").value = cosmetico.icone;
  document.getElementById("tituloModalCosmetico").textContent = "Editar cosmético";
  document.getElementById("salvarCosmetico").textContent = "Salvar alterações";
  atualizarPreview(cosmetico.icone);
  modalCosmetico.show();
}

document.getElementById("botaoAdicionar").addEventListener("click", limparFormulario);
document.getElementById("icone").addEventListener("input", e => atualizarPreview(e.target.value));

document.getElementById("formCosmetico").addEventListener("submit", async event => {
  event.preventDefault();
  if (!ehAdministrador()) return mostrarMensagem("Apenas administradores podem gerenciar cosméticos.", "danger");

  const id = document.getElementById("cosmeticoId").value;
  const corpo = {
    nome: document.getElementById("nome").value.trim(),
    precoOrbes: Number(document.getElementById("precoOrbes").value),
    icone: document.getElementById("icone").value.trim()
  };

  try {
    await requisicao(id ? `/api/cosmeticos/${id}` : "/api/cosmeticos", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(corpo)
    });
    modalCosmetico.hide();
    mostrarMensagem(id ? "Cosmético atualizado com sucesso." : "Cosmético adicionado com sucesso.");
    await carregarDados();
  } catch (erro) {
    mostrarMensagem(erro.message, "danger");
  }
});

async function excluirCosmetico(cosmetico) {
  if (!ehAdministrador()) return;
  const confirmar = window.confirm(`Deseja excluir "${cosmetico.nome}"? Essa ação também removerá os registros de posse desse item.`);
  if (!confirmar) return;

  try {
    await requisicao(`/api/cosmeticos/${cosmetico.id}`, { method: "DELETE" });
    mostrarMensagem("Cosmético excluído com sucesso.");
    await carregarDados();
  } catch (erro) {
    mostrarMensagem(erro.message, "danger");
  }
}

function abrirConfirmacaoResgate(cosmetico) {
  if (!usuarioAtual) {
    modalUsuario.show();
    return;
  }
  cosmeticoParaResgatar = cosmetico;
  document.getElementById("imagemResgate").src = resolverImagem(cosmetico.icone);
  document.getElementById("imagemResgate").alt = cosmetico.nome;
  document.getElementById("nomeResgate").textContent = cosmetico.nome;
  document.getElementById("precoResgate").textContent = Number(cosmetico.precoOrbes).toLocaleString("pt-BR");
  document.getElementById("saldoAntesResgate").textContent = Number(usuarioAtual.orbes || 0).toLocaleString("pt-BR");
  const semSaldo = Number(usuarioAtual.orbes || 0) < Number(cosmetico.precoOrbes || 0);
  document.getElementById("avisoSaldo").classList.toggle("d-none", !semSaldo);
  document.getElementById("confirmarResgate").disabled = semSaldo;
  modalResgate.show();
}

document.getElementById("confirmarResgate").addEventListener("click", async () => {
  if (!cosmeticoParaResgatar || !usuarioAtual) return;
  try {
    const resultado = await requisicao("/api/resgates", {
      method: "POST",
      body: JSON.stringify({ cosmeticoId: cosmeticoParaResgatar.id })
    });
    modalResgate.hide();
    mostrarMensagem(`${resultado.mensagem} Novo saldo: ${resultado.orbes} Orbes.`);
    await carregarDados();
  } catch (erro) {
    modalResgate.hide();
    mostrarMensagem(erro.message, "danger");
  }
});

document.getElementById("usarUsuario").addEventListener("click", async () => {
  const id = Number(document.getElementById("seletorUsuario").value);
  if (!id) return;
  localStorage.setItem("quorbeUsuarioId", String(id));
  usuarioAtual = dados.usuarios.find(u => Number(u.id) === id) || null;
  modalUsuario.hide();
  atualizarCabecalho();
  renderizarCosmeticos();
});

document.getElementById("trocarUsuario").addEventListener("click", () => {
  preencherSeletorUsuarios();
  modalUsuario.show();
});

document.getElementById("sair").addEventListener("click", event => {
  event.preventDefault();
  localStorage.removeItem("quorbeUsuarioId");
  usuarioAtual = null;
  preencherSeletorUsuarios();
  atualizarCabecalho();
  modalUsuario.show();
});

document.getElementById("pesquisa").addEventListener("input", renderizarCosmeticos);
document.getElementById("filtro").addEventListener("change", renderizarCosmeticos);

carregarDados();
