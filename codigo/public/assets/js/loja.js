const lista = document.getElementById("lista");
const mensagem = document.getElementById("mensagem");
const saldoOrbes = document.getElementById("saldoOrbes");
const modalCosmeticoEl = document.getElementById("modalCosmetico");
const modalResgateEl = document.getElementById("modalResgate");
const modalUsuarioEl = document.getElementById("modalUsuario");
const modalExcluirCosmeticoEl = document.getElementById("modalExcluirCosmetico");

let dados = { usuarios: [], cosmeticos: [], cosmeticosUsuarios: [] };
let usuarioAtual = null;
let cosmeticoParaResgatar = null;
let cosmeticoParaExcluir = null;

const modalCosmetico = bootstrap.Modal.getOrCreateInstance(modalCosmeticoEl);
const modalResgate = bootstrap.Modal.getOrCreateInstance(modalResgateEl);
const modalUsuario = bootstrap.Modal.getOrCreateInstance(modalUsuarioEl);
const modalExcluirCosmetico = bootstrap.Modal.getOrCreateInstance(modalExcluirCosmeticoEl);

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
    throw new Error("Não foi possível conectar ao servidor. Confira se `npm start` está em execução na pasta codigo.");
  }

  const texto = await resposta.text();
  let resultado = {};
  try { resultado = texto ? JSON.parse(texto) : {}; }
  catch { throw new Error("O servidor retornou uma resposta inválida."); }

  if (!resposta.ok) throw new Error(resultado.erro || `Erro HTTP ${resposta.status}.`);
  return resultado;
}

function ehAdministrador() {
  return ["administrador", "admin", "professor"].includes(String(usuarioAtual?.funcao || "").trim().toLowerCase());
}

function possuiCosmetico(cosmeticoId) {
  return dados.cosmeticosUsuarios.some(rel =>
    Number(rel.usuarioId) === Number(usuarioAtual?.id) &&
    Number(rel.cosmeticoId) === Number(cosmeticoId)
  );
}

function usuarioDaSessao(dadosCarregados) {
  // Se a página de login do projeto já autenticou alguém, usamos esse usuário.
  // A função/permissões são sempre lidas do db.json, não do sessionStorage.
  try {
    const sessao = JSON.parse(sessionStorage.getItem("usuarioCorrente") || "null");
    if (!sessao) return null;

    return dadosCarregados.usuarios.find(u =>
      (sessao.id != null && Number(u.id) === Number(sessao.id)) ||
      (sessao.usuario && String(u.usuario) === String(sessao.usuario)) ||
      (sessao.login && String(u.usuario) === String(sessao.login)) ||
      (sessao.email && String(u.email).toLowerCase() === String(sessao.email).toLowerCase())
    ) || null;
  } catch {
    return null;
  }
}

function atualizarCabecalho() {
  document.getElementById("nomeUsuario").textContent = usuarioAtual?.nome || usuarioAtual?.usuario || usuarioAtual?.login || "Usuário";
  document.getElementById("funcaoUsuario").textContent = usuarioAtual?.funcao || "Sem função definida";
  document.getElementById("avatarUsuario").textContent = (usuarioAtual?.nome || usuarioAtual?.usuario || "Q").trim().charAt(0).toUpperCase();
  saldoOrbes.textContent = Number(usuarioAtual?.orbes || 0).toLocaleString("pt-BR");
  document.getElementById("botaoAdicionar").classList.toggle("d-none", !ehAdministrador());
  document.getElementById("textoCatalogo").textContent = ehAdministrador()
    ? "Modo de gerenciamento: professores e administradores podem adicionar, editar e excluir cosméticos."
    : "Resgate itens com seus Orbes e personalize seu perfil.";
}

async function carregarDados() {
  try {
    dados = await requisicao("/api/dados", { headers: {} });

    if (!Array.isArray(dados.usuarios) || !Array.isArray(dados.cosmeticos)) {
      throw new Error("A API não retornou os arrays usuarios e cosmeticos.");
    }
    if (!Array.isArray(dados.cosmeticosUsuarios)) dados.cosmeticosUsuarios = [];

    const usuarioAutenticado = usuarioDaSessao(dados);
    const idSalvo = Number(localStorage.getItem("quorbeUsuarioId"));
    usuarioAtual = usuarioAutenticado ||
      dados.usuarios.find(u => Number(u.id) === idSalvo) || null;

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
  const cosmeticosFiltrados = dados.cosmeticos;

  document.getElementById("vazio").classList.toggle("d-none", cosmeticosFiltrados.length !== 0);

  cosmeticosFiltrados.forEach(cosmetico => {
    const coluna = document.createElement("div");
    coluna.className = "col-12 col-sm-6 col-xl-4";
    const possui = usuarioAtual ? possuiCosmetico(cosmetico.id) : false;
    const preco = Number(cosmetico.precoOrbes) || 0;

    const caminhoImagem = String(cosmetico.icone || "").trim();
    const temImagem = caminhoImagem !== "" && caminhoImagem.toLowerCase() !== "sem-imagem";

    coluna.innerHTML = `
      <article class="cosmetic-card h-100">
        <div class="product-image-wrap" aria-label="Imagem do produto">
          ${temImagem ? `<img class="product-image" src="${escaparHTML(caminhoImagem)}" alt="${escaparHTML(cosmetico.nome)}" loading="lazy">` : ""}
          <span class="product-image-fallback${temImagem ? " d-none" : ""}">${escaparHTML(cosmetico.nome)}</span>
        </div>
        <div class="product-content">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h3 class="product-title">${escaparHTML(cosmetico.nome)}</h3>
            <span class="product-price">✦ ${preco.toLocaleString("pt-BR")}</span>
          </div>
          <p class="product-description">${possui ? "Este item já faz parte da sua coleção." : "Use seus Orbes para resgatar este item."}</p>
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

    const imagemProduto = coluna.querySelector(".product-image");
    if (imagemProduto) {
      imagemProduto.addEventListener("error", () => {
        imagemProduto.classList.add("d-none");
        const fallback = coluna.querySelector(".product-image-fallback");
        if (fallback) fallback.classList.remove("d-none");
      }, { once: true });
    }

    const editar = coluna.querySelector(".editar");
    if (editar) editar.addEventListener("click", () => abrirEdicao(cosmetico));

    const excluir = coluna.querySelector(".excluir");
    if (excluir) excluir.addEventListener("click", () => excluirCosmetico(cosmetico));

    const resgatar = coluna.querySelector(".resgatar");
    if (resgatar) resgatar.addEventListener("click", () => abrirConfirmacaoResgate(cosmetico));

    lista.appendChild(coluna);
  });
}

const campoFotoCosmetico = document.getElementById("fotoCosmetico");
const previewFotoCosmetico = document.getElementById("previewFotoCosmetico");
const imagemPreviewCosmetico = document.getElementById("imagemPreviewCosmetico");
const textoPreviewCosmetico = document.getElementById("textoPreviewCosmetico");
let fotoAtualCosmetico = "sem-imagem";

function mostrarPreviewFoto(arquivo, caminhoExistente = "") {
  if (arquivo) {
    imagemPreviewCosmetico.src = URL.createObjectURL(arquivo);
    textoPreviewCosmetico.textContent = `Nova foto selecionada: ${arquivo.name}`;
    previewFotoCosmetico.classList.remove("d-none");
  } else if (caminhoExistente && caminhoExistente !== "sem-imagem") {
    imagemPreviewCosmetico.src = caminhoExistente;
    textoPreviewCosmetico.textContent = "Foto atual. Selecione outra imagem para substituí-la.";
    previewFotoCosmetico.classList.remove("d-none");
    imagemPreviewCosmetico.onerror = () => {
      previewFotoCosmetico.classList.add("d-none");
    };
  } else {
    imagemPreviewCosmetico.removeAttribute("src");
    previewFotoCosmetico.classList.add("d-none");
  }
}

campoFotoCosmetico.addEventListener("change", () => {
  const arquivo = campoFotoCosmetico.files[0];
  if (!arquivo) {
    mostrarPreviewFoto(null, fotoAtualCosmetico);
    return;
  }
  const tiposPermitidos = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!tiposPermitidos.includes(arquivo.type)) {
    campoFotoCosmetico.value = "";
    mostrarMensagem("Formato inválido. Selecione uma imagem PNG, JPG, WEBP ou GIF.", "danger");
    return;
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    campoFotoCosmetico.value = "";
    mostrarMensagem("A foto deve ter no máximo 5 MB.", "danger");
    return;
  }
  mostrarPreviewFoto(arquivo);
});

function lerArquivoComoDataURL(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("Não foi possível ler a foto selecionada."));
    leitor.readAsDataURL(arquivo);
  });
}

function limparFormulario() {
  document.getElementById("formCosmetico").reset();
  document.getElementById("cosmeticoId").value = "";
  document.getElementById("icone").value = "sem-imagem";
  fotoAtualCosmetico = "sem-imagem";
  mostrarPreviewFoto(null);
  document.getElementById("tituloModalCosmetico").textContent = "Adicionar cosmético";
  document.getElementById("salvarCosmetico").textContent = "Salvar cosmético";
}

function abrirEdicao(cosmetico) {
  limparFormulario();
  document.getElementById("cosmeticoId").value = cosmetico.id;
  document.getElementById("nome").value = cosmetico.nome;
  document.getElementById("precoOrbes").value = cosmetico.precoOrbes;
  document.getElementById("icone").value = cosmetico.icone || "sem-imagem";
  fotoAtualCosmetico = cosmetico.icone || "sem-imagem";
  mostrarPreviewFoto(null, fotoAtualCosmetico);
  document.getElementById("tituloModalCosmetico").textContent = "Editar cosmético";
  document.getElementById("salvarCosmetico").textContent = "Salvar alterações";
  modalCosmetico.show();
}

document.getElementById("botaoAdicionar").addEventListener("click", limparFormulario);

document.getElementById("formCosmetico").addEventListener("submit", async event => {
  event.preventDefault();
  if (!ehAdministrador()) return mostrarMensagem("Apenas professores e administradores podem gerenciar cosméticos.", "danger");

  const id = document.getElementById("cosmeticoId").value;
  const arquivoFoto = campoFotoCosmetico.files[0];
  const corpo = {
    nome: document.getElementById("nome").value.trim(),
    precoOrbes: Number(document.getElementById("precoOrbes").value),
    icone: document.getElementById("icone").value.trim()
  };

  try {
    if (arquivoFoto) {
      corpo.imagemBase64 = await lerArquivoComoDataURL(arquivoFoto);
      corpo.tipoImagem = arquivoFoto.type;
    }
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

function excluirCosmetico(cosmetico) {
  if (!ehAdministrador()) return;
  cosmeticoParaExcluir = cosmetico;
  document.getElementById("nomeCosmeticoExcluir").textContent = cosmetico.nome;
  document.getElementById("erroExcluirCosmetico").classList.add("d-none");
  document.getElementById("erroExcluirCosmetico").textContent = "";
  document.getElementById("confirmarExclusaoCosmetico").disabled = false;
  modalExcluirCosmetico.show();
}

document.getElementById("confirmarExclusaoCosmetico").addEventListener("click", async () => {
  if (!cosmeticoParaExcluir || !ehAdministrador()) return;

  const botao = document.getElementById("confirmarExclusaoCosmetico");
  const erroEl = document.getElementById("erroExcluirCosmetico");
  botao.disabled = true;
  botao.textContent = "Removendo...";
  erroEl.classList.add("d-none");

  try {
    await requisicao(`/api/cosmeticos/${cosmeticoParaExcluir.id}`, { method: "DELETE" });
    modalExcluirCosmetico.hide();
    cosmeticoParaExcluir = null;
    mostrarMensagem("Cosmético removido com sucesso.");
    await carregarDados();
  } catch (erro) {
    erroEl.textContent = erro.message;
    erroEl.classList.remove("d-none");
  } finally {
    botao.disabled = false;
    botao.textContent = "Remover cosmético";
  }
});

modalExcluirCosmeticoEl.addEventListener("hidden.bs.modal", () => {
  cosmeticoParaExcluir = null;
});

function abrirConfirmacaoResgate(cosmetico) {
  if (!usuarioAtual) {
    modalUsuario.show();
    return;
  }
  cosmeticoParaResgatar = cosmetico;
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


carregarDados();
