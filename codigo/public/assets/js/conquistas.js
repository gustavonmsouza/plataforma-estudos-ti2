const API_URL = 'http://localhost:3000';

const form = document.getElementById('formConquista');
const campoId = document.getElementById('conquistaId');
const campoNome = document.getElementById('nome');
const campoDescricao = document.getElementById('descricao');
const campoIcone = document.getElementById('icone');
const campoCosmetico = document.getElementById('cosmeticoId');

const pesquisa = document.getElementById('pesquisa');
const filtroCosmetico = document.getElementById('filtroCosmetico');

const lista = document.getElementById('listaConquistas');
const total = document.getElementById('totalConquistas');
const mensagemLista = document.getElementById('mensagemLista');
const mensagemFormulario = document.getElementById('mensagemFormulario');

const tituloFormulario = document.getElementById('tituloFormulario');
const botaoSalvar = document.getElementById('botaoSalvar');
const botaoCancelar = document.getElementById('botaoCancelar');

let conquistas = [];
let cosmeticos = [];

// Realiza requisições para a API.
async function requisicao(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(opcoes.headers || {})
    }
  });

  if (!resposta.ok) {
    throw new Error(`Erro na requisição: ${resposta.status}`);
  }

  if (resposta.status === 204) {
    return null;
  }

  return resposta.json();
}

// Exibe mensagens na interface.
function mostrarMensagem(elemento, texto, tipo = 'info') {
  elemento.textContent = texto;

  elemento.className =
    tipo === 'erro'
      ? 'mt-3 text-danger'
      : tipo === 'sucesso'
        ? 'mt-3 text-success'
        : 'mt-3 texto-secundario';
}

// Carrega os cosméticos disponíveis no banco.
async function carregarCosmeticos() {
  cosmeticos = await requisicao(`${API_URL}/cosmeticos`);

  campoCosmetico.innerHTML =
    '<option value="">Nenhum cosmético</option>';

  cosmeticos.forEach(cosmetico => {
    const opcao = document.createElement('option');

    opcao.value = cosmetico.id;
    opcao.textContent = cosmetico.nome;

    campoCosmetico.appendChild(opcao);
  });
}

// READ: consulta as conquistas cadastradas.
async function carregarConquistas() {
  mensagemLista.textContent = 'Carregando conquistas...';

  try {
    conquistas = await requisicao(`${API_URL}/conquistas`);
    renderizarConquistas();
  } catch (erro) {
    total.textContent = 'Erro ao carregar';

    mostrarMensagem(
      mensagemLista,
      'Não foi possível carregar as conquistas. Verifique se o JSON Server está funcionando.',
      'erro'
    );
  }
}

// Apresenta as conquistas dinamicamente.
function renderizarConquistas() {
  const termo = pesquisa.value.trim().toLowerCase();
  const filtro = filtroCosmetico.value;

  const resultado = conquistas.filter(conquista => {
    const texto = `${conquista.nome} ${conquista.descricao}`
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

  lista.innerHTML = '';

  total.textContent =
    `${resultado.length} de ${conquistas.length} conquista(s)`;

  if (resultado.length === 0) {
    mensagemLista.textContent = 'Nenhuma conquista encontrada.';
    return;
  }

  mensagemLista.textContent = '';

  resultado.forEach(conquista => {
    const coluna = document.createElement('div');
    coluna.className = 'col-md-6 col-xl-4';

    const card = document.createElement('article');
    card.className = 'card-conquista p-4 text-center';

    const icone = document.createElement('div');
    icone.className = 'icone-conquista';

    // Exibe imagens quando o campo contém um nome de arquivo.
    if (
      conquista.icone &&
      /\.(png|jpe?g|gif|webp|svg)$/i.test(conquista.icone)
    ) {
      const imagem = document.createElement('img');

      imagem.src = `/assets/images/${conquista.icone}`;
      imagem.alt = conquista.nome;
      imagem.style.width = '64px';
      imagem.style.height = '64px';
      imagem.style.objectFit = 'contain';

      // Se a imagem não existir, exibe um troféu.
      imagem.addEventListener('error', () => {
        icone.textContent = '🏆';
      }, { once: true });

      icone.appendChild(imagem);
    } else {
      // Mantém o suporte a emojis.
      icone.textContent = conquista.icone || '🏆';
    }

    const nome = document.createElement('h3');
    nome.className = 'h5 fw-bold';
    nome.textContent = conquista.nome;

    const descricao = document.createElement('p');
    descricao.className = 'texto-secundario';
    descricao.textContent = conquista.descricao;

    const cosmetico = cosmeticos.find(
      item => String(item.id) === String(conquista.cosmeticoId)
    );

    const associado = document.createElement('p');
    associado.className = 'small texto-secundario';

    associado.textContent = cosmetico
      ? `Cosmético: ${cosmetico.nome}`
      : 'Sem cosmético associado';

    const botoes = document.createElement('div');
    botoes.className =
      'd-flex justify-content-center gap-2 flex-wrap mt-3';

    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'btn btn-outline-primary btn-sm';
    editar.textContent = 'Editar';

    editar.addEventListener('click', () => {
      iniciarEdicao(conquista);
    });

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'btn btn-outline-danger btn-sm';
    excluir.textContent = 'Excluir';

    excluir.addEventListener('click', () => {
      excluirConquista(conquista);
    });

    botoes.append(editar, excluir);

    card.append(
      icone,
      nome,
      descricao,
      associado,
      botoes
    );

    coluna.appendChild(card);
    lista.appendChild(coluna);
  });
}

// Prepara o formulário para editar uma conquista.
function iniciarEdicao(conquista) {
  campoId.value = conquista.id;
  campoNome.value = conquista.nome;
  campoDescricao.value = conquista.descricao;
  campoIcone.value = conquista.icone || '';
  campoCosmetico.value = conquista.cosmeticoId ?? '';

  tituloFormulario.textContent = 'Editar conquista';
  botaoSalvar.textContent = 'Salvar alterações';
  botaoCancelar.hidden = false;

  mostrarMensagem(
    mensagemFormulario,
    'Editando a conquista selecionada.'
  );

  form.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// Limpa o formulário.
function limparFormulario() {
  form.reset();

  campoId.value = '';

  tituloFormulario.textContent = 'Cadastrar conquista';
  botaoSalvar.textContent = 'Cadastrar conquista';
  botaoCancelar.hidden = true;

  mensagemFormulario.textContent = '';
}

// CREATE e UPDATE: salva uma conquista.
async function salvarConquista(evento) {
  evento.preventDefault();

  const nome = campoNome.value.trim();
  const descricao = campoDescricao.value.trim();
  const icone = campoIcone.value.trim();

  if (!nome || !descricao || !icone) {
    mostrarMensagem(
      mensagemFormulario,
      'Preencha todos os campos obrigatórios.',
      'erro'
    );

    return;
  }

  const dados = {
    nome,
    descricao,
    icone,
    cosmeticoId:
      campoCosmetico.value === ''
        ? null
        : Number(campoCosmetico.value)
  };

  botaoSalvar.disabled = true;

  try {
    if (campoId.value) {
      // UPDATE
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
      // CREATE
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

// DELETE: exclui uma conquista.
async function excluirConquista(conquista) {
  const confirmou = confirm(
    `Deseja excluir a conquista "${conquista.nome}"?`
  );

  if (!confirmou) {
    return;
  }

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

// Eventos de interação.
form.addEventListener('submit', salvarConquista);

botaoCancelar.addEventListener('click', limparFormulario);

pesquisa.addEventListener('input', renderizarConquistas);

filtroCosmetico.addEventListener('change', renderizarConquistas);

// Inicializa a página.
async function iniciarPagina() {
  try {
    await carregarCosmeticos();
  } catch (erro) {
    mostrarMensagem(
      mensagemLista,
      'Não foi possível carregar os cosméticos.',
      'erro'
    );
  }

  await carregarConquistas();
}

iniciarPagina();