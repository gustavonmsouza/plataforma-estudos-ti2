const API_URL = '';

const form = document.getElementById('formConquista');
const campoId = document.getElementById('conquistaId');
const campoNome = document.getElementById('nome');
const campoDescricao = document.getElementById('descricao');
const campoIcone = document.getElementById('icone');
const campoCosmetico =
  document.getElementById('cosmetico') ||
  document.getElementById('cosmeticoId');

const campoTipoRequisito = document.getElementById('tipoRequisito');
const campoValorRequisito = document.getElementById('valorRequisito');
const campoPercentualRequisito =
  document.getElementById('percentualRequisito');

const grupoValorRequisito =
  document.getElementById('grupoValorRequisito');

const grupoPercentualRequisito =
  document.getElementById('grupoPercentualRequisito');

const rotuloValorRequisito =
  document.getElementById('rotuloValorRequisito');

const ajudaValorRequisito =
  document.getElementById('ajudaValorRequisito');

const resumoRequisito =
  document.getElementById('resumoRequisito');

const pesquisa = document.getElementById('pesquisa');
const filtroCosmetico = document.getElementById('filtroCosmetico');

const lista = document.getElementById('listaConquistas');

const total =
  document.getElementById('contadorConquistas') ||
  document.getElementById('totalConquistas');

const mensagemLista = document.getElementById('mensagemLista');
const mensagemFormulario =
  document.getElementById('mensagemFormulario');

const tituloFormulario =
  document.getElementById('tituloFormulario');

const botaoSalvar = document.getElementById('botaoSalvar');
const botaoCancelar = document.getElementById('botaoCancelar');

const previewIcone = document.getElementById('previewIcone');

const nomeIconeSelecionado =
  document.getElementById('nomeIconeSelecionado');

const galeriaEmojis = document.getElementById('galeriaEmojis');
const galeriaVetorial = document.getElementById('galeriaVetorial');

let conquistas = [];
let cosmeticos = [];
let categoriaIconeAtual = 'emojis';

const tiposRequisito = {
  tarefas: 'Tarefas concluídas',
  orbes: 'Orbes acumulados',
  sequencia: 'Sequência de estudos',
  desempenho: 'Desempenho',
  todos: 'Todos os requisitos'
};

const emojisDisponiveis = [
  { nome: 'Troféu', valor: '🏆' },
  { nome: 'Medalha', valor: '🏅' },
  { nome: 'Estrela', valor: '⭐' },
  { nome: 'Fogo', valor: '🔥' },
  { nome: 'Raio', valor: '⚡' },
  { nome: 'Alvo', valor: '🎯' },
  { nome: 'Coroa', valor: '👑' },
  { nome: 'Diamante', valor: '💎' },
  { nome: 'Livro', valor: '📚' },
  { nome: 'Lápis', valor: '✏️' },
  { nome: 'Foguete', valor: '🚀' },
  { nome: 'Cérebro', valor: '🧠' },
  { nome: 'Lâmpada', valor: '💡' },
  { nome: 'Relógio', valor: '⏱️' },
  { nome: 'Check', valor: '✅' },
  { nome: 'Força', valor: '💪' },
  { nome: 'Presente', valor: '🎁' },
  { nome: 'Bandeira', valor: '🚩' },
  { nome: 'Nave espacial', valor: '🛸' },
  { nome: 'Alvo verde', valor: '🟢' },
  { nome: 'Livro aberto', valor: '📖' },
  { nome: 'Foguete espacial', valor: '🌠' },
  { nome: 'Troféu dourado', valor: '🥇' },
  { nome: 'Fita', valor: '🎗️' }
];

const iconesVetoriais = [
  {
    nome: 'Troféu',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/trophy-fill.svg'
  },
  {
    nome: 'Estrela',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/star-fill.svg'
  },
  {
    nome: 'Medalha',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/award-fill.svg'
  },
  {
    nome: 'Raio',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/lightning-charge-fill.svg'
  },
  {
    nome: 'Alvo',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/bullseye.svg'
  },
  {
    nome: 'Diamante',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/gem.svg'
  },
  {
    nome: 'Livro',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/book-fill.svg'
  },
  {
    nome: 'Foguete',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/rocket-takeoff-fill.svg'
  },
  {
    nome: 'Cérebro',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/brain.svg'
  },
  {
    nome: 'Lâmpada',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/lightbulb-fill.svg'
  },
  {
    nome: 'Relógio',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/clock-fill.svg'
  },
  {
    nome: 'Concluído',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/check-circle-fill.svg'
  },
  {
    nome: 'Coração',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/heart-fill.svg'
  },
  {
    nome: 'Bandeira',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/flag-fill.svg'
  },
  {
    nome: 'Pessoa',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-fill.svg'
  },
  {
    nome: 'Foguete alternativo',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/rocket-fill.svg'
  },
  {
    nome: 'Alvo com seta',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/crosshair.svg'
  },
  {
    nome: 'Calendário',
    valor: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/calendar-check-fill.svg'
  }
];

async function requisicao(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(opcoes.headers || {})
    }
  });

  if (!resposta.ok) {
    let mensagem = `Erro na requisição: ${resposta.status}`;

    try {
      const dados = await resposta.json();
      mensagem = dados.erro || dados.message || mensagem;
    } catch (_) {}

    throw new Error(mensagem);
  }

  if (resposta.status === 204) {
    return null;
  }

  return resposta.json();
}

function mostrarMensagem(elemento, texto, tipo = 'info') {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.classList.remove('sucesso', 'erro');

  if (tipo === 'sucesso') {
    elemento.classList.add('sucesso');
  }

  if (tipo === 'erro') {
    elemento.classList.add('erro');
  }
}

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}

function atualizarFormularioRequisito() {
  if (!campoTipoRequisito) return;

  const tipo = campoTipoRequisito.value;

  const configuracoes = {
    tarefas: {
      rotulo: 'Número de tarefas concluídas',
      ajuda: 'Quantidade mínima de tarefas concluídas.'
    },
    orbes: {
      rotulo: 'Quantidade de Orbes',
      ajuda: 'Quantidade mínima de Orbes acumulados.'
    },
    sequencia: {
      rotulo: 'Dias consecutivos de estudo',
      ajuda: 'Número mínimo de dias consecutivos de estudo.'
    },
    desempenho: {
      rotulo: 'Valor de referência',
      ajuda: 'Defina o percentual mínimo de aproveitamento.'
    },
    todos: {
      rotulo: 'Meta mínima de cada requisito',
      ajuda: 'A meta será aplicada a tarefas, Orbes, sequência e desempenho.'
    }
  };

  const configuracao =
    configuracoes[tipo] || configuracoes.tarefas;

  if (rotuloValorRequisito) {
    rotuloValorRequisito.textContent = configuracao.rotulo;
  }

  if (ajudaValorRequisito) {
    ajudaValorRequisito.textContent = configuracao.ajuda;
  }

  if (grupoValorRequisito) {
    grupoValorRequisito.hidden = tipo === 'desempenho';
  }

  if (grupoPercentualRequisito) {
    grupoPercentualRequisito.hidden =
      tipo !== 'desempenho' && tipo !== 'todos';
  }

  if (campoPercentualRequisito) {
    campoPercentualRequisito.required =
      tipo === 'desempenho' || tipo === 'todos';
  }

  if (campoValorRequisito) {
    campoValorRequisito.required = tipo !== 'desempenho';
  }

  atualizarResumoRequisito();
}

function atualizarResumoRequisito() {
  if (!resumoRequisito || !campoTipoRequisito) return;

  const tipo = campoTipoRequisito.value;
  const valor = Number(campoValorRequisito?.value) || 1;
  const percentual =
    Number(campoPercentualRequisito?.value) || 90;

  const resumos = {
    tarefas:
      `O aluno precisará concluir ${valor} tarefa(s).`,
    orbes:
      `O aluno precisará acumular ${valor} Orbes.`,
    sequencia:
      `O aluno precisará estudar por ${valor} dia(s) consecutivos.`,
    desempenho:
      `O aluno precisará obter pelo menos ${percentual}% de aproveitamento.`,
    todos:
      `O aluno precisará cumprir todos os requisitos: ${valor} tarefa(s), ${valor} Orbes, ${valor} dia(s) de sequência e ${percentual}% de aproveitamento.`
  };

  resumoRequisito.textContent =
    resumos[tipo] || resumos.tarefas;
}

function exibirIconeNoElemento(elemento, valor) {
  if (!elemento) return;

  elemento.replaceChildren();

  const ehImagem =
    /^(https?:\/\/|\/)/i.test(valor || '') &&
    /\.(svg|png|jpe?g|gif|webp)(\?.*)?$/i.test(valor || '');

  if (ehImagem) {
    const imagem = document.createElement('img');

    imagem.src = valor;
    imagem.alt = '';
    imagem.loading = 'lazy';

    imagem.addEventListener('error', () => {
      elemento.replaceChildren();
      elemento.textContent = '🏆';
    }, { once: true });

    elemento.appendChild(imagem);
  } else {
    elemento.textContent = valor || '🏆';
  }
}

function atualizarPreviewIcone(nome = '') {
  const valor = campoIcone?.value || '🏆';

  exibirIconeNoElemento(previewIcone, valor);

  if (nomeIconeSelecionado) {
    const encontrado = [
      ...emojisDisponiveis,
      ...iconesVetoriais
    ].find(item => item.valor === valor);

    nomeIconeSelecionado.textContent =
      nome || encontrado?.nome || 'Ícone personalizado';
  }

  document.querySelectorAll('.opcao-icone').forEach(botao => {
    const selecionado = botao.dataset.valor === valor;

    botao.classList.toggle('selecionado', selecionado);
    botao.setAttribute('aria-pressed', String(selecionado));
  });
}

function selecionarIcone(valor, nome) {
  if (campoIcone) {
    campoIcone.value = valor;
  }

  atualizarPreviewIcone(nome);
}

function criarOpcaoIcone(item, vetorial = false) {
  const botao = document.createElement('button');

  botao.type = 'button';
  botao.className = 'opcao-icone';
  botao.dataset.valor = item.valor;
  botao.setAttribute('aria-label', item.nome);
  botao.setAttribute('aria-pressed', 'false');
  botao.title = item.nome;

  const visual = document.createElement('span');
  visual.className = 'visual-icone';

  if (vetorial) {
    const imagem = document.createElement('img');

    imagem.src = item.valor;
    imagem.alt = '';
    imagem.loading = 'lazy';

    imagem.addEventListener('error', () => {
      visual.replaceChildren();
      visual.textContent = '🏆';
    }, { once: true });

    visual.appendChild(imagem);
  } else {
    visual.textContent = item.valor;
  }

  const nome = document.createElement('span');
  nome.className = 'nome-icone';
  nome.textContent = item.nome;

  botao.append(visual, nome);

  botao.addEventListener('click', () => {
    selecionarIcone(item.valor, item.nome);
  });

  return botao;
}

function configurarCategoriasIcones() {
  document.querySelectorAll('[data-categoria-icone]').forEach(botao => {
    botao.addEventListener('click', () => {
      categoriaIconeAtual = botao.dataset.categoriaIcone;

      if (galeriaEmojis) {
        galeriaEmojis.hidden = categoriaIconeAtual !== 'emojis';
      }

      if (galeriaVetorial) {
        galeriaVetorial.hidden = categoriaIconeAtual !== 'vetoriais';
      }

      document.querySelectorAll('[data-categoria-icone]').forEach(outro => {
        const ativo = outro === botao;

        outro.classList.toggle('ativo', ativo);
        outro.classList.toggle('ativa', ativo);
        outro.setAttribute('aria-pressed', String(ativo));
      });
    });
  });
}

function renderizarGaleriaIcones() {
  if (galeriaEmojis) {
    galeriaEmojis.replaceChildren(
      ...emojisDisponiveis.map(item => criarOpcaoIcone(item))
    );
  }

  if (galeriaVetorial) {
    galeriaVetorial.replaceChildren(
      ...iconesVetoriais.map(item => criarOpcaoIcone(item, true))
    );
  }

  configurarCategoriasIcones();

  if (galeriaEmojis) {
    galeriaEmojis.hidden = categoriaIconeAtual !== 'emojis';
  }

  if (galeriaVetorial) {
    galeriaVetorial.hidden = categoriaIconeAtual !== 'vetoriais';
  }

  atualizarPreviewIcone('Troféu');
}

async function carregarCosmeticos() {
  if (!campoCosmetico) return;

  const dados = await requisicao(`${API_URL}/cosmeticos`);
  cosmeticos = Array.isArray(dados) ? dados : [];

  const valorAtual = campoCosmetico.value;

  campoCosmetico.replaceChildren();

  const opcaoNenhum = document.createElement('option');
  opcaoNenhum.value = '';
  opcaoNenhum.textContent = 'Nenhum cosmético';

  campoCosmetico.appendChild(opcaoNenhum);

  cosmeticos.forEach(cosmetico => {
    const opcao = document.createElement('option');

    opcao.value = cosmetico.id;
    opcao.textContent = cosmetico.nome;

    campoCosmetico.appendChild(opcao);
  });

  if (valorAtual) {
    campoCosmetico.value = valorAtual;
  }
}

async function carregarConquistas() {
  if (mensagemLista) {
    mensagemLista.textContent = 'Carregando conquistas...';
  }

  try {
    const dados = await requisicao(`${API_URL}/conquistas`);
    conquistas = Array.isArray(dados) ? dados : [];
    renderizarConquistas();
  } catch (erro) {
    if (total) {
      total.textContent = 'Erro ao carregar';
    }

    mostrarMensagem(
      mensagemLista,
      `Não foi possível carregar as conquistas: ${erro.message}`,
      'erro'
    );
  }
}

function obterDescricaoRequisito(conquista) {
  const tipo = conquista.tipoRequisito || 'tarefas';
  const valor = Number(conquista.valorRequisito) || 1;
  const percentual =
    Number(conquista.percentualRequisito) || 90;

  const descricoes = {
    tarefas: `Tarefas concluídas: ${valor}`,
    orbes: `Orbes necessários: ${valor}`,
    sequencia: `Sequência necessária: ${valor} dia(s)`,
    desempenho: `Desempenho mínimo: ${percentual}%`,
    todos:
      `Todos: ${valor} tarefa(s), ${valor} Orbes, ${valor} dia(s) de sequência e ${percentual}% de desempenho`
  };

  return descricoes[tipo] || 'Requisito não definido';
}

function criarBotao(texto, classe, aoClicar) {
  const botao = document.createElement('button');

  botao.type = 'button';
  botao.className = classe;
  botao.textContent = texto;
  botao.addEventListener('click', aoClicar);

  return botao;
}

function renderizarConquistas() {
  if (!lista) return;

  const termo = pesquisa?.value.trim().toLowerCase() || '';
  const filtro = filtroCosmetico?.value || 'todos';

  const resultado = conquistas.filter(conquista => {
    const texto =
      `${conquista.nome || ''} ${conquista.descricao || ''}`
        .toLowerCase();

    const correspondeTexto = texto.includes(termo);

    const temCosmetico =
      conquista.cosmeticoId !== null &&
      conquista.cosmeticoId !== undefined &&
      conquista.cosmeticoId !== '';

    const correspondeFiltro =
      filtro === 'todos' ||
      (filtro === 'com' && temCosmetico) ||
      (filtro === 'sem' && !temCosmetico);

    return correspondeTexto && correspondeFiltro;
  });

  lista.replaceChildren();

  if (total) {
    total.textContent =
      `${resultado.length} de ${conquistas.length} conquista(s)`;
  }

  if (resultado.length === 0) {
    if (mensagemLista) {
      mensagemLista.textContent = conquistas.length
        ? 'Nenhuma conquista encontrada.'
        : 'Nenhuma conquista cadastrada ainda.';
    }

    return;
  }

  if (mensagemLista) {
    mensagemLista.textContent = '';
  }

  resultado.forEach(conquista => {
    const card = document.createElement('article');
    card.className = 'card-conquista';

    const icone = document.createElement('div');
    icone.className = 'icone-conquista';

    exibirIconeNoElemento(icone, conquista.icone || '🏆');

    const nome = document.createElement('h3');
    nome.textContent = conquista.nome || 'Conquista';

    const descricao = document.createElement('p');
    descricao.className = 'texto-secundario';
    descricao.textContent =
      conquista.descricao || 'Sem descrição.';

    const cosmetico = cosmeticos.find(
      item => String(item.id) === String(conquista.cosmeticoId)
    );

    const associado = document.createElement('p');
    associado.className = 'texto-secundario';
    associado.textContent = cosmetico
      ? `Cosmético associado: ${cosmetico.nome}`
      : 'Sem cosmético associado';

    const requisito = document.createElement('p');
    requisito.className = 'detalhe-requisito';
    requisito.textContent = obterDescricaoRequisito(conquista);

    const botoes = document.createElement('div');
    botoes.className = 'botoes-formulario';

    const editar = criarBotao(
      'Editar',
      'botao botao-secundario',
      () => iniciarEdicao(conquista)
    );

    const excluir = criarBotao(
      'Excluir',
      'botao botao-secundario',
      () => excluirConquista(conquista)
    );

    botoes.append(editar, excluir);
    card.append(icone, nome, descricao, associado, requisito, botoes);
    lista.appendChild(card);
  });
}

function iniciarEdicao(conquista) {
  campoId.value = conquista.id;
  campoNome.value = conquista.nome || '';
  campoDescricao.value = conquista.descricao || '';
  campoIcone.value = conquista.icone || '🏆';

  if (campoCosmetico) {
    campoCosmetico.value = conquista.cosmeticoId ?? '';
  }

  campoTipoRequisito.value =
    conquista.tipoRequisito || 'tarefas';

  campoValorRequisito.value =
    conquista.valorRequisito ?? 1;

  campoPercentualRequisito.value =
    conquista.percentualRequisito ?? 90;

  atualizarFormularioRequisito();
  atualizarPreviewIcone();

  if (tituloFormulario) {
    tituloFormulario.textContent = 'Editar conquista';
  }

  if (botaoSalvar) {
    botaoSalvar.textContent = 'Salvar alterações';
  }

  if (botaoCancelar) {
    botaoCancelar.hidden = false;
  }

  mostrarMensagem(
    mensagemFormulario,
    'Editando a conquista selecionada.'
  );

  form.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function limparFormulario() {
  form.reset();

  campoId.value = '';
  campoIcone.value = '🏆';
  campoTipoRequisito.value = 'tarefas';
  campoValorRequisito.value = '1';
  campoPercentualRequisito.value = '90';

  categoriaIconeAtual = 'emojis';

  if (galeriaEmojis) {
    galeriaEmojis.hidden = false;
  }

  if (galeriaVetorial) {
    galeriaVetorial.hidden = true;
  }

  document.querySelectorAll('[data-categoria-icone]').forEach(botao => {
    const ativo = botao.dataset.categoriaIcone === 'emojis';

    botao.classList.toggle('ativo', ativo);
    botao.classList.toggle('ativa', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });

  atualizarFormularioRequisito();
  atualizarPreviewIcone('Troféu');

  if (tituloFormulario) {
    tituloFormulario.textContent = 'Nova conquista';
  }

  if (botaoSalvar) {
    botaoSalvar.textContent = 'Cadastrar conquista';
  }

  if (botaoCancelar) {
    botaoCancelar.hidden = true;
  }

  if (mensagemFormulario) {
    mensagemFormulario.textContent = '';
    mensagemFormulario.classList.remove('sucesso', 'erro');
  }
}

function validarFormulario() {
  const nome = campoNome.value.trim();
  const descricao = campoDescricao.value.trim();
  const icone = campoIcone.value.trim();

  if (!nome || !descricao || !icone) {
    throw new Error(
      'Preencha o nome, a descrição e selecione um ícone.'
    );
  }

  const tipo = campoTipoRequisito.value;
  const valor = Number(campoValorRequisito.value);
  const percentual = Number(campoPercentualRequisito.value);

  if (!Object.prototype.hasOwnProperty.call(tiposRequisito, tipo)) {
    throw new Error('Selecione um tipo de requisito válido.');
  }

  if (
    tipo !== 'desempenho' &&
    (!Number.isInteger(valor) || valor < 1)
  ) {
    throw new Error('Informe uma meta inteira maior que zero.');
  }

  if (
    (tipo === 'desempenho' || tipo === 'todos') &&
    (!Number.isFinite(percentual) ||
      percentual < 1 ||
      percentual > 100)
  ) {
    throw new Error('O desempenho deve estar entre 1% e 100%.');
  }

  const idCosmetico = campoCosmetico?.value || '';

  return {
    nome,
    descricao,
    icone,
    cosmeticoId: idCosmetico === '' ? null : Number(idCosmetico),
    tipoRequisito: tipo,
    valorRequisito: valor || 1,
    percentualRequisito:
      tipo === 'desempenho' || tipo === 'todos'
        ? percentual
        : 90
  };
}

async function salvarConquista(evento) {
  evento.preventDefault();

  let dados;

  try {
    dados = validarFormulario();
  } catch (erro) {
    mostrarMensagem(
      mensagemFormulario,
      erro.message,
      'erro'
    );

    return;
  }

  botaoSalvar.disabled = true;

  try {
    if (campoId.value) {
      await requisicao(
        `${API_URL}/conquistas/${encodeURIComponent(campoId.value)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(dados)
        }
      );

      mostrarMensagem(
        mensagemFormulario,
        'Conquista atualizada com sucesso!',
        'sucesso'
      );
    } else {
      await requisicao(`${API_URL}/conquistas`, {
        method: 'POST',
        body: JSON.stringify(dados)
      });

      mostrarMensagem(
        mensagemFormulario,
        'Conquista cadastrada com sucesso!',
        'sucesso'
      );
    }

    limparFormulario();
    await carregarConquistas();
  } catch (erro) {
    mostrarMensagem(
      mensagemFormulario,
      `Não foi possível salvar: ${erro.message}`,
      'erro'
    );
  } finally {
    botaoSalvar.disabled = false;
  }
}

async function excluirConquista(conquista) {
  const confirmou = confirm(
    `Deseja excluir a conquista "${conquista.nome}"?`
  );

  if (!confirmou) return;

  try {
    await requisicao(
      `${API_URL}/conquistas/${encodeURIComponent(conquista.id)}`,
      {
        method: 'DELETE'
      }
    );

    if (String(campoId.value) === String(conquista.id)) {
      limparFormulario();
    }

    mostrarMensagem(
      mensagemFormulario,
      'Conquista excluída com sucesso!',
      'sucesso'
    );

    await carregarConquistas();
  } catch (erro) {
    mostrarMensagem(
      mensagemLista,
      `Não foi possível excluir: ${erro.message}`,
      'erro'
    );
  }
}

campoTipoRequisito.addEventListener(
  'change',
  atualizarFormularioRequisito
);

campoValorRequisito.addEventListener(
  'input',
  atualizarResumoRequisito
);

campoPercentualRequisito.addEventListener(
  'input',
  atualizarResumoRequisito
);

campoIcone.addEventListener('input', () => {
  atualizarPreviewIcone();
});

form.addEventListener('submit', salvarConquista);
botaoCancelar.addEventListener('click', limparFormulario);
pesquisa.addEventListener('input', renderizarConquistas);
filtroCosmetico.addEventListener('change', renderizarConquistas);

async function iniciarPagina() {
  renderizarGaleriaIcones();
  atualizarFormularioRequisito();

  if (!campoIcone.value) {
    campoIcone.value = '🏆';
  }

  atualizarPreviewIcone('Troféu');

  try {
    await carregarCosmeticos();
  } catch (erro) {
    mostrarMensagem(
      mensagemLista,
      `Não foi possível carregar os cosméticos: ${erro.message}`,
      'erro'
    );
  }

  await carregarConquistas();
}

iniciarPagina();