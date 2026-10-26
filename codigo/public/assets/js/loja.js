/**
 * =========================================================================
 * QUORBE - LOJA DE COSMÉTICOS (ARQUITETURA MVC)
 * =========================================================================
 * Este módulo organiza a lógica da loja de cosméticos seguindo o padrão
 * Model-View-Controller (MVC), atendendo tanto a visão do aluno (resgate)
 * quanto a visão do professor (gerenciamento).
 *
 * - LojaModel: Gerencia o estado, regras de negócio e chamadas à API REST.
 * - LojaView: Gerencia manipulação do DOM, renderização de cards e modais.
 * - LojaController: Orquestra o fluxo de dados entre o Model e a View.
 * =========================================================================
 */

/* =========================================================================
 * 1. MODEL (Modelo de Dados e Regras de Negócio)
 * ========================================================================= */
class LojaModel {
  constructor() {
    this.usuarios = [];
    this.cosmeticos = [];
    this.cosmeticosUsuarios = [];
    this.usuarioAtual = null;
    this.cosmeticoParaResgatar = null;
    this.cosmeticoParaExcluir = null;
  }

  obterSessao() {
    try {
      return JSON.parse(sessionStorage.getItem("usuarioCorrente") || "null");
    } catch {
      return null;
    }
  }

  ehAdministrador(usuario = this.usuarioAtual) {
    const funcao = String(usuario?.funcao || "").trim().toLowerCase();
    return ["administrador", "admin", "professor"].includes(funcao);
  }

  validarAutenticacao(ehPaginaProfessor) {
    const sessao = this.obterSessao();
    if (!sessao || !sessao.funcao) {
      window.location.replace("/index.html");
      return false;
    }

    if (ehPaginaProfessor && !this.ehAdministrador(sessao)) {
      window.location.replace("/aluno/loja.html");
      return false;
    }

    return true;
  }

  async requisicao(url, opcoes = {}) {
    const headers = { ...(opcoes.headers || {}) };
    if (this.usuarioAtual) {
      headers["x-usuario-id"] = String(this.usuarioAtual.id);
    }
    if (opcoes.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    let resposta;
    try {
      resposta = await fetch(url, { ...opcoes, headers });
    } catch (erro) {
      console.error("Falha de conexão com a API:", erro);
      throw new Error("Não foi possível conectar ao servidor. Confira se `npm start` está em execução.");
    }

    const texto = await resposta.text();
    let resultado = {};
    try {
      resultado = texto ? JSON.parse(texto) : {};
    } catch {
      throw new Error("O servidor retornou uma resposta inválida.");
    }

    if (!resposta.ok) {
      throw new Error(resultado.erro || `Erro HTTP ${resposta.status}.`);
    }

    return resultado;
  }

  usuarioDaSessao(dadosCarregados, sessao) {
    if (!sessao) return null;
    return dadosCarregados.usuarios.find(u =>
      (sessao.id != null && Number(u.id) === Number(sessao.id)) ||
      (sessao.usuario && String(u.usuario) === String(sessao.usuario)) ||
      (sessao.login && String(u.usuario) === String(sessao.login)) ||
      (sessao.email && String(u.email).toLowerCase() === String(sessao.email).toLowerCase())
    ) || null;
  }

  async carregarDados() {
    const sessao = this.obterSessao();
    const dados = await this.requisicao("/api/dados");

    if (!Array.isArray(dados.usuarios) || !Array.isArray(dados.cosmeticos)) {
      throw new Error("A API não retornou a lista de cosméticos e usuários esperada.");
    }

    this.usuarios = dados.usuarios;
    this.cosmeticos = dados.cosmeticos;
    this.cosmeticosUsuarios = Array.isArray(dados.cosmeticosUsuarios) ? dados.cosmeticosUsuarios : [];

    this.usuarioAtual = this.usuarioDaSessao(dados, sessao);
    if (!this.usuarioAtual) {
      sessionStorage.removeItem("usuarioCorrente");
      window.location.replace("/index.html");
      return;
    }

    // Sincroniza sessão local com os dados atualizados do banco (saldo de Orbes)
    sessionStorage.setItem("usuarioCorrente", JSON.stringify({ ...sessao, ...this.usuarioAtual }));
  }

  possuiCosmetico(cosmeticoId) {
    return this.cosmeticosUsuarios.some(rel =>
      Number(rel.usuarioId) === Number(this.usuarioAtual?.id) &&
      Number(rel.cosmeticoId) === Number(cosmeticoId)
    );
  }

  obterCosmeticoPorId(id) {
    return this.cosmeticos.find(c => Number(c.id) === Number(id)) || null;
  }

  podeResgatar(cosmetico) {
    const preco = Number(cosmetico?.precoOrbes) || 0;
    const saldo = Number(this.usuarioAtual?.orbes) || 0;
    return saldo >= preco;
  }

  async resgatarCosmetico(cosmeticoId) {
    return await this.requisicao("/api/resgates", {
      method: "POST",
      body: JSON.stringify({ cosmeticoId })
    });
  }

  async salvarCosmetico({ id, nome, precoOrbes, icone, arquivoFoto }) {
    const corpo = {
      nome: String(nome || "").trim(),
      precoOrbes: Number(precoOrbes),
      icone: String(icone || "sem-imagem").trim()
    };

    if (arquivoFoto) {
      corpo.imagemBase64 = await this.lerArquivoComoDataURL(arquivoFoto);
      corpo.tipoImagem = arquivoFoto.type;
    }

    return await this.requisicao(id ? `/api/cosmeticos/${id}` : "/api/cosmeticos", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(corpo)
    });
  }

  async excluirCosmetico(cosmeticoId) {
    return await this.requisicao(`/api/cosmeticos/${cosmeticoId}`, {
      method: "DELETE"
    });
  }

  lerArquivoComoDataURL(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
      leitor.readAsDataURL(arquivo);
    });
  }

  encerrarSessao() {
    sessionStorage.removeItem("usuarioCorrente");
    window.location.replace("/index.html");
  }
}

/* =========================================================================
 * 2. VIEW (Interface de Usuário e Manipulação do DOM)
 * ========================================================================= */
class LojaView {
  constructor() {
    this.listaEl = document.getElementById("lista");
    this.mensagemEl = document.getElementById("mensagem");
    this.vazioEl = document.getElementById("vazio");
    this.saldoOrbesEl = document.getElementById("saldoOrbes");
    this.totalCosmeticosEl = document.getElementById("totalCosmeticos");

    // Elementos de perfil no menu lateral
    this.nomeUsuarioEl = document.getElementById("nomeUsuario");
    this.funcaoUsuarioEl = document.getElementById("funcaoUsuario");
    this.avatarUsuarioEl = document.getElementById("avatarUsuario");
    this.botaoSairEl = document.getElementById("sair");

    // Modais Bootstrap
    this.modalCosmeticoEl = document.getElementById("modalCosmetico");
    this.modalExcluirCosmeticoEl = document.getElementById("modalExcluirCosmetico");
    this.modalResgateEl = document.getElementById("modalResgate");

    this.modalCosmetico = this.modalCosmeticoEl ? bootstrap.Modal.getOrCreateInstance(this.modalCosmeticoEl) : null;
    this.modalExcluirCosmetico = this.modalExcluirCosmeticoEl ? bootstrap.Modal.getOrCreateInstance(this.modalExcluirCosmeticoEl) : null;
    this.modalResgate = this.modalResgateEl ? bootstrap.Modal.getOrCreateInstance(this.modalResgateEl) : null;

    // Elementos do formulário do professor
    this.formCosmetico = document.getElementById("formCosmetico");
    this.botaoAdicionar = document.getElementById("botaoAdicionar");
    this.cosmeticoIdInput = document.getElementById("cosmeticoId");
    this.nomeInput = document.getElementById("nome");
    this.precoOrbesInput = document.getElementById("precoOrbes");
    this.iconeInput = document.getElementById("icone");
    this.fotoCosmeticoInput = document.getElementById("fotoCosmetico");
    this.previewFotoCosmetico = document.getElementById("previewFotoCosmetico");
    this.imagemPreviewCosmetico = document.getElementById("imagemPreviewCosmetico");
    this.textoPreviewCosmetico = document.getElementById("textoPreviewCosmetico");
    this.tituloModalCosmetico = document.getElementById("tituloModalCosmetico");
    this.salvarCosmeticoBtn = document.getElementById("salvarCosmetico");

    // Elementos de exclusão do professor
    this.nomeCosmeticoExcluir = document.getElementById("nomeCosmeticoExcluir");
    this.erroExcluirCosmetico = document.getElementById("erroExcluirCosmetico");
    this.confirmarExclusaoCosmeticoBtn = document.getElementById("confirmarExclusaoCosmetico");

    // Elementos de resgate do aluno
    this.nomeResgate = document.getElementById("nomeResgate");
    this.precoResgate = document.getElementById("precoResgate");
    this.saldoAntesResgate = document.getElementById("saldoAntesResgate");
    this.avisoSaldo = document.getElementById("avisoSaldo");
    this.confirmarResgateBtn = document.getElementById("confirmarResgate");

    this.fotoAtualCosmetico = "sem-imagem";
  }

  escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  mostrarMensagem(texto, tipo = "success") {
    if (!this.mensagemEl) return;
    this.mensagemEl.className = `alert alert-${tipo}`;
    this.mensagemEl.textContent = texto;
    this.mensagemEl.classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (tipo === "success") {
      window.setTimeout(() => {
        if (this.mensagemEl) this.mensagemEl.classList.add("d-none");
      }, 4500);
    }
  }

  renderizarCabecalho(usuario, ehProfessor, totalCosmeticos = 0) {
    const padrao = ehProfessor ? "Professor" : "Aluno";
    const nome = usuario?.nome || usuario?.usuario || usuario?.login || padrao;

    if (this.nomeUsuarioEl) this.nomeUsuarioEl.textContent = nome;
    if (this.funcaoUsuarioEl) this.funcaoUsuarioEl.textContent = usuario?.funcao || padrao;
    if (this.avatarUsuarioEl) this.avatarUsuarioEl.textContent = nome.trim().charAt(0).toUpperCase();

    if (this.saldoOrbesEl) {
      this.saldoOrbesEl.textContent = Number(usuario?.orbes || 0).toLocaleString("pt-BR");
    }

    if (this.totalCosmeticosEl) {
      this.totalCosmeticosEl.textContent = String(totalCosmeticos);
    }
  }

  renderizarCatalogo(cosmeticos, ehProfessor, possuiCallback) {
    if (!this.listaEl) return;
    this.listaEl.innerHTML = "";

    if (this.vazioEl) {
      this.vazioEl.classList.toggle("d-none", cosmeticos.length !== 0);
    }

    cosmeticos.forEach(cosmetico => {
      const coluna = document.createElement("div");
      coluna.className = "col-12 col-sm-6 col-xl-4";
      const preco = Number(cosmetico.precoOrbes) || 0;

      let caminhoImagem = String(cosmetico.icone || "").trim();
      const temImagem = caminhoImagem !== "" && caminhoImagem.toLowerCase() !== "sem-imagem";

      if (ehProfessor) {
        coluna.innerHTML = `
          <article class="cosmetic-card h-100">
            <div class="product-image-wrap" aria-label="Imagem do produto">
              ${temImagem ? `<img class="product-image" src="${this.escaparHTML(caminhoImagem)}" alt="${this.escaparHTML(cosmetico.nome)}" loading="lazy">` : ""}
              <span class="product-image-fallback${temImagem ? " d-none" : ""}">${this.escaparHTML(cosmetico.nome)}</span>
            </div>
            <div class="product-content">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <h3 class="product-title">${this.escaparHTML(cosmetico.nome)}</h3>
                <span class="product-price">✦ ${preco.toLocaleString("pt-BR")}</span>
              </div>
              <p class="product-description">Valor de resgate: ${preco.toLocaleString("pt-BR")} Orbes</p>
              <div class="product-actions">
                <button type="button" class="btn btn-outline-primary btn-sm btn-editar" data-id="${cosmetico.id}">Editar</button>
                <button type="button" class="btn btn-outline-danger btn-sm btn-excluir" data-id="${cosmetico.id}">Excluir</button>
              </div>
            </div>
          </article>
        `;
      } else {
        const possui = possuiCallback ? possuiCallback(cosmetico.id) : false;

        coluna.innerHTML = `
          <article class="cosmetic-card h-100">
            <div class="product-image-wrap" aria-label="Imagem do produto">
              ${temImagem ? `<img class="product-image" src="${this.escaparHTML(caminhoImagem)}" alt="${this.escaparHTML(cosmetico.nome)}" loading="lazy">` : ""}
              <span class="product-image-fallback${temImagem ? " d-none" : ""}">${this.escaparHTML(cosmetico.nome)}</span>
            </div>
            <div class="product-content">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <h3 class="product-title">${this.escaparHTML(cosmetico.nome)}</h3>
                <span class="product-price">✦ ${preco.toLocaleString("pt-BR")}</span>
              </div>
              <p class="product-description">${possui ? "Este item já faz parte da sua coleção." : "Use seus Orbes para resgatar este item."}</p>
              <div class="product-actions">
                ${possui ? `
                  <span class="badge text-bg-secondary w-100 py-2">Na sua coleção</span>
                ` : `
                  <button type="button" class="btn btn-primary w-100 btn-resgatar" data-id="${cosmetico.id}">Resgatar por ${preco.toLocaleString("pt-BR")} Orbes</button>
                `}
              </div>
            </div>
          </article>
        `;
      }

      // Fallback em caso de erro no carregamento da imagem
      const img = coluna.querySelector(".product-image");
      if (img) {
        img.addEventListener("error", () => {
          img.classList.add("d-none");
          const fallback = coluna.querySelector(".product-image-fallback");
          if (fallback) fallback.classList.remove("d-none");
        }, { once: true });
      }

      this.listaEl.appendChild(coluna);
    });
  }

  // Métodos de modal do resgate (Aluno)
  abrirModalResgate(cosmetico, saldoUsuario, podeResgatar) {
    if (this.nomeResgate) this.nomeResgate.textContent = cosmetico.nome;
    if (this.precoResgate) this.precoResgate.textContent = Number(cosmetico.precoOrbes || 0).toLocaleString("pt-BR");
    if (this.saldoAntesResgate) this.saldoAntesResgate.textContent = Number(saldoUsuario || 0).toLocaleString("pt-BR");

    if (this.avisoSaldo) this.avisoSaldo.classList.toggle("d-none", podeResgatar);
    if (this.confirmarResgateBtn) this.confirmarResgateBtn.disabled = !podeResgatar;

    if (this.modalResgate) this.modalResgate.show();
  }

  fecharModalResgate() {
    if (this.modalResgate) this.modalResgate.hide();
  }

  // Métodos do formulário e modais do professor
  mostrarPreviewFoto(arquivo, caminhoExistente = "") {
    if (!this.previewFotoCosmetico || !this.imagemPreviewCosmetico) return;

    if (arquivo) {
      this.imagemPreviewCosmetico.src = URL.createObjectURL(arquivo);
      if (this.textoPreviewCosmetico) this.textoPreviewCosmetico.textContent = `Nova foto selecionada: ${arquivo.name}`;
      this.previewFotoCosmetico.classList.remove("d-none");
    } else if (caminhoExistente && caminhoExistente !== "sem-imagem") {
      this.imagemPreviewCosmetico.src = caminhoExistente;
      if (this.textoPreviewCosmetico) this.textoPreviewCosmetico.textContent = "Foto atual. Selecione outra imagem para substituí-la.";
      this.previewFotoCosmetico.classList.remove("d-none");
      this.imagemPreviewCosmetico.onerror = () => {
        this.previewFotoCosmetico.classList.add("d-none");
      };
    } else {
      this.imagemPreviewCosmetico.removeAttribute("src");
      this.previewFotoCosmetico.classList.add("d-none");
    }
  }

  limparFormularioCosmetico() {
    if (this.formCosmetico) this.formCosmetico.reset();
    if (this.cosmeticoIdInput) this.cosmeticoIdInput.value = "";
    if (this.iconeInput) this.iconeInput.value = "sem-imagem";
    this.fotoAtualCosmetico = "sem-imagem";
    this.mostrarPreviewFoto(null);

    if (this.tituloModalCosmetico) this.tituloModalCosmetico.textContent = "Adicionar cosmético";
    if (this.salvarCosmeticoBtn) this.salvarCosmeticoBtn.textContent = "Salvar cosmético";
  }

  preencherFormularioCosmetico(cosmetico) {
    this.limparFormularioCosmetico();
    if (this.cosmeticoIdInput) this.cosmeticoIdInput.value = cosmetico.id;
    if (this.nomeInput) this.nomeInput.value = cosmetico.nome;
    if (this.precoOrbesInput) this.precoOrbesInput.value = cosmetico.precoOrbes;
    if (this.iconeInput) this.iconeInput.value = cosmetico.icone || "sem-imagem";

    this.fotoAtualCosmetico = cosmetico.icone || "sem-imagem";
    this.mostrarPreviewFoto(null, this.fotoAtualCosmetico);

    if (this.tituloModalCosmetico) this.tituloModalCosmetico.textContent = "Editar cosmético";
    if (this.salvarCosmeticoBtn) this.salvarCosmeticoBtn.textContent = "Salvar alterações";

    if (this.modalCosmetico) this.modalCosmetico.show();
  }

  fecharModalCosmetico() {
    if (this.modalCosmetico) this.modalCosmetico.hide();
  }

  abrirModalExclusao(cosmetico) {
    if (this.nomeCosmeticoExcluir) this.nomeCosmeticoExcluir.textContent = cosmetico.nome;
    if (this.erroExcluirCosmetico) {
      this.erroExcluirCosmetico.classList.add("d-none");
      this.erroExcluirCosmetico.textContent = "";
    }
    if (this.confirmarExclusaoCosmeticoBtn) this.confirmarExclusaoCosmeticoBtn.disabled = false;
    if (this.modalExcluirCosmetico) this.modalExcluirCosmetico.show();
  }

  fecharModalExclusao() {
    if (this.modalExcluirCosmetico) this.modalExcluirCosmetico.hide();
  }

  exibirErroExclusao(mensagem) {
    if (this.erroExcluirCosmetico) {
      this.erroExcluirCosmetico.textContent = mensagem;
      this.erroExcluirCosmetico.classList.remove("d-none");
    }
  }
}

/* =========================================================================
 * 3. CONTROLLER (Controlador da Lógica e Fluxo da Aplicação)
 * ========================================================================= */
class LojaController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.ehPaginaProfessor = Boolean(document.getElementById("formCosmetico") || document.getElementById("botaoAdicionar"));
  }

  async init() {
    // 1. Validação de autenticação
    if (!this.model.validarAutenticacao(this.ehPaginaProfessor)) return;

    // 2. Vinculação dos eventos da interface
    this.vincularEventos();

    // 3. Carga inicial de dados
    await this.atualizarDadosInterface();
  }

  async atualizarDadosInterface() {
    try {
      await this.model.carregarDados();
      this.view.renderizarCabecalho(
        this.model.usuarioAtual,
        this.ehPaginaProfessor,
        this.model.cosmeticos.length
      );
      this.view.renderizarCatalogo(
        this.model.cosmeticos,
        this.ehPaginaProfessor,
        id => this.model.possuiCosmetico(id)
      );
    } catch (erro) {
      console.error("Erro ao carregar os dados:", erro);
      this.view.mostrarMensagem(erro.message, "danger");
    }
  }

  vincularEventos() {
    // Logout
    if (this.view.botaoSairEl) {
      this.view.botaoSairEl.addEventListener("click", event => {
        event.preventDefault();
        this.model.encerrarSessao();
      });
    }

    // Delegação de eventos nos cards de produtos (Resgatar, Editar, Excluir)
    if (this.view.listaEl) {
      this.view.listaEl.addEventListener("click", event => {
        const btnResgatar = event.target.closest(".btn-resgatar");
        if (btnResgatar) {
          const id = Number(btnResgatar.dataset.id);
          this.handleAbrirResgate(id);
          return;
        }

        const btnEditar = event.target.closest(".btn-editar");
        if (btnEditar) {
          const id = Number(btnEditar.dataset.id);
          this.handleAbrirEditar(id);
          return;
        }

        const btnExcluir = event.target.closest(".btn-excluir");
        if (btnExcluir) {
          const id = Number(btnExcluir.dataset.id);
          this.handleAbrirExcluir(id);
          return;
        }
      });
    }

    // Eventos específicos do Aluno
    if (this.view.confirmarResgateBtn) {
      this.view.confirmarResgateBtn.addEventListener("click", () => this.handleConfirmarResgate());
    }

    // Eventos específicos do Professor
    if (this.view.botaoAdicionar) {
      this.view.botaoAdicionar.addEventListener("click", () => this.view.limparFormularioCosmetico());
    }

    if (this.view.fotoCosmeticoInput) {
      this.view.fotoCosmeticoInput.addEventListener("change", () => this.handleFotoChange());
    }

    if (this.view.formCosmetico) {
      this.view.formCosmetico.addEventListener("submit", event => this.handleSubmeterFormulario(event));
    }

    if (this.view.confirmarExclusaoCosmeticoBtn) {
      this.view.confirmarExclusaoCosmeticoBtn.addEventListener("click", () => this.handleConfirmarExclusao());
    }
  }

  // Handlers do Aluno
  handleAbrirResgate(cosmeticoId) {
    const cosmetico = this.model.obterCosmeticoPorId(cosmeticoId);
    if (!cosmetico) return;

    this.model.cosmeticoParaResgatar = cosmetico;
    const saldo = Number(this.model.usuarioAtual?.orbes || 0);
    const podeResgatar = this.model.podeResgatar(cosmetico);

    this.view.abrirModalResgate(cosmetico, saldo, podeResgatar);
  }

  async handleConfirmarResgate() {
    const cosmetico = this.model.cosmeticoParaResgatar;
    if (!cosmetico) return;

    const btn = this.view.confirmarResgateBtn;
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Processando...";
      }

      const resultado = await this.model.resgatarCosmetico(cosmetico.id);
      this.view.fecharModalResgate();
      this.view.mostrarMensagem(`${resultado.mensagem} Novo saldo: ${resultado.orbes} Orbes.`);
      await this.atualizarDadosInterface();
    } catch (erro) {
      this.view.fecharModalResgate();
      this.view.mostrarMensagem(erro.message, "danger");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Confirmar resgate";
      }
    }
  }

  // Handlers do Professor
  handleAbrirEditar(cosmeticoId) {
    const cosmetico = this.model.obterCosmeticoPorId(cosmeticoId);
    if (!cosmetico) return;
    this.view.preencherFormularioCosmetico(cosmetico);
  }

  handleFotoChange() {
    const input = this.view.fotoCosmeticoInput;
    const arquivo = input ? input.files[0] : null;

    if (!arquivo) {
      this.view.mostrarPreviewFoto(null, this.view.fotoAtualCosmetico);
      return;
    }

    const tiposValidos = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!tiposValidos.includes(arquivo.type)) {
      input.value = "";
      this.view.mostrarMensagem("Formato inválido. Selecione uma imagem PNG, JPG, WEBP ou GIF.", "danger");
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      input.value = "";
      this.view.mostrarMensagem("A foto deve ter no máximo 5 MB.", "danger");
      return;
    }

    this.view.mostrarPreviewFoto(arquivo);
  }

  async handleSubmeterFormulario(event) {
    event.preventDefault();
    if (!this.model.ehAdministrador()) {
      return this.view.mostrarMensagem("Apenas professores e administradores podem gerenciar cosméticos.", "danger");
    }

    const id = this.view.cosmeticoIdInput ? this.view.cosmeticoIdInput.value : "";
    const nome = this.view.nomeInput ? this.view.nomeInput.value : "";
    const precoOrbes = this.view.precoOrbesInput ? this.view.precoOrbesInput.value : 0;
    const icone = this.view.iconeInput ? this.view.iconeInput.value : "sem-imagem";
    const arquivoFoto = this.view.fotoCosmeticoInput ? this.view.fotoCosmeticoInput.files[0] : null;
    const btnSalvar = this.view.salvarCosmeticoBtn;

    try {
      if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = "Salvando...";
      }

      await this.model.salvarCosmetico({ id, nome, precoOrbes, icone, arquivoFoto });
      this.view.fecharModalCosmetico();
      this.view.mostrarMensagem(id ? "Cosmético atualizado com sucesso." : "Cosmético adicionado com sucesso.");
      await this.atualizarDadosInterface();
    } catch (erro) {
      this.view.mostrarMensagem(erro.message, "danger");
    } finally {
      if (btnSalvar) {
        btnSalvar.disabled = false;
        btnSalvar.textContent = id ? "Salvar alterações" : "Salvar cosmético";
      }
    }
  }

  handleAbrirExcluir(cosmeticoId) {
    const cosmetico = this.model.obterCosmeticoPorId(cosmeticoId);
    if (!cosmetico) return;

    this.model.cosmeticoParaExcluir = cosmetico;
    this.view.abrirModalExclusao(cosmetico);
  }

  async handleConfirmarExclusao() {
    const cosmetico = this.model.cosmeticoParaExcluir;
    if (!cosmetico || !this.model.ehAdministrador()) return;

    const btn = this.view.confirmarExclusaoCosmeticoBtn;
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Removendo...";
      }

      await this.model.excluirCosmetico(cosmetico.id);
      this.view.fecharModalExclusao();
      this.model.cosmeticoParaExcluir = null;
      this.view.mostrarMensagem("Cosmético removido com sucesso.");
      await this.atualizarDadosInterface();
    } catch (erro) {
      this.view.exibirErroExclusao(erro.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Remover cosmético";
      }
    }
  }
}

// =========================================================================
// INICIALIZAÇÃO DA APLICAÇÃO MVC
// =========================================================================
// Expõe classes globalmente para fins de inspeção/testes
window.LojaModel = LojaModel;
window.LojaView = LojaView;
window.LojaController = LojaController;

// Instanciação e Inicialização
const lojaApp = new LojaController(new LojaModel(), new LojaView());
lojaApp.init();

