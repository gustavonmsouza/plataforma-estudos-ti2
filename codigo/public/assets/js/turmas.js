let turmas = [];
let usuarios = [];

const lista = document.getElementById('listaTurmas');
const alerta = document.getElementById('alerta');
const modal = new bootstrap.Modal(document.getElementById('modalTurma'));

async function api(url, opcoes) {
  const res = await fetch(url, opcoes);
  if (!res.ok) throw new Error('Erro ' + res.status + ' em ' + url);
  return res.json();
}

function json(metodo, corpo) {
  return {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  };
}

function mostrarErro(msg) {
  alerta.textContent = msg;
  alerta.classList.remove('d-none');
}

async function carregar() {
  try {
    [turmas, usuarios] = await Promise.all([api('/turmas'), api('/usuarios')]);
    alerta.classList.add('d-none');
    desenhar();
  } catch (e) {
    mostrarErro('Não foi possível carregar as turmas. O json-server está rodando?');
  }
}

function professores() {
  return usuarios.filter((u) => u.funcao === 'professor');
}

function contarAlunos(turmaId) {
  return usuarios.filter(
    (u) => u.funcao === 'aluno' && (u.turmasIds || []).includes(turmaId)
  ).length;
}

function nomeProfessor(id) {
  const p = usuarios.find((u) => u.id === id);
  return p ? p.nome : 'Sem professor';
}

function desenhar() {
  lista.innerHTML = '';

  if (turmas.length === 0) {
    lista.innerHTML =
      '<div class="list-group-item text-center py-5 texto-suave">Nenhuma turma ainda. Clique em "Criar turma" para começar.</div>';
    return;
  }

  turmas.forEach((t) => {
    const qtd = contarAlunos(t.id);

    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';

    const info = document.createElement('div');
    const nome = document.createElement('div');
    nome.className = 'fw-semibold';
    nome.textContent = t.nome;
    const detalhe = document.createElement('small');
    detalhe.className = 'texto-suave';
    detalhe.textContent =
      qtd + (qtd === 1 ? ' aluno' : ' alunos') + ' · Prof. ' + nomeProfessor(t.professorId);
    info.append(nome, detalhe);

    const acoes = document.createElement('div');
    acoes.className = 'd-flex gap-1';

    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-sm btn-acao';
    btnEditar.title = 'Editar turma';
    btnEditar.setAttribute('aria-label', 'Editar ' + t.nome);
    btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
    btnEditar.addEventListener('click', () => abrirModal(t));

    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn btn-sm btn-acao btn-acao-perigo';
    btnExcluir.title = 'Excluir turma';
    btnExcluir.setAttribute('aria-label', 'Excluir ' + t.nome);
    btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
    btnExcluir.addEventListener('click', () => excluir(t));

    acoes.append(btnEditar, btnExcluir);
    item.append(info, acoes);
    lista.append(item);
  });
}

function abrirModal(turma) {
  const select = document.getElementById('turmaProfessor');
  select.innerHTML = '';
  professores().forEach((p) => {
    const op = document.createElement('option');
    op.value = p.id;
    op.textContent = p.nome;
    select.append(op);
  });

  document.getElementById('tituloModal').textContent = turma ? 'Editar turma' : 'Criar turma';
  document.getElementById('turmaId').value = turma ? turma.id : '';
  document.getElementById('turmaNome').value = turma ? turma.nome : '';
  if (turma) select.value = turma.professorId;

  modal.show();
}

document.getElementById('btnNova').addEventListener('click', () => abrirModal(null));

document.getElementById('formTurma').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('turmaId').value;
  const dados = {
    nome: document.getElementById('turmaNome').value.trim(),
    professorId: Number(document.getElementById('turmaProfessor').value),
  };

  try {
    if (id) {
      await api('/turmas/' + id, json('PUT', { id: Number(id), ...dados }));
    } else {
      await api('/turmas', json('POST', dados));
    }
    modal.hide();
    await carregar();
  } catch (err) {
    modal.hide();
    mostrarErro('Não foi possível salvar a turma.');
  }
});

async function excluir(turma) {
  if (!confirm('Excluir a ' + turma.nome + '? Essa ação não pode ser desfeita.')) return;

  try {
    await api('/turmas/' + turma.id, { method: 'DELETE' });
    await carregar();
  } catch (err) {
    mostrarErro('Não foi possível excluir a turma.');
  }
}

carregar();
