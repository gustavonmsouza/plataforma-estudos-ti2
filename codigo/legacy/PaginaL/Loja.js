
const lista = document.getElementById("lista");
const espacoAdd = document.getElementById("espacoAdd");

const modalAdicionar = document.getElementById("modalAdicionar");
const modalEditar = document.getElementById("modalEditar");

let dados = null;
let indiceSelecionado = null;

// Escapa valores para não inserir HTML acidentalmente nos cards.
function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function ehAluno(usuario) {
    return usuario?.funcao === "aluno";
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);

    const resultado = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(resultado.erro || "Erro na requisição.");
    }

    return resultado;
}

// READ
async function carregarDados() {
    try {
        dados = await requisicao("/api/dados");

        // Exemplo provisório: seleciona o primeiro usuário do JSON.
        // Troque pela identificação do usuário autenticado no seu sistema.
        const usuarioLogado = dados.usuarios[0];

        const aluno = ehAluno(usuarioLogado);

        espacoAdd.innerHTML = aluno
            ? ""
            : `<button class="btn btn-primary mb-3"
                       data-bs-toggle="modal"
                       data-bs-target="#modalAdicionar">
                   Adicionar cosmético
               </button>`;

        renderizarCosmeticos(aluno);
    } catch (erro) {
        console.error("Erro ao carregar os cosméticos:", erro);
        alert(erro.message);
    }
}

function renderizarCosmeticos(aluno) {
    lista.innerHTML = "";

    dados.cosmeticos.forEach((cosmetico, indice) => {
        const coluna = document.createElement("div");

        coluna.className = "col-12 col-md-6 col-lg-4";

        coluna.innerHTML = `
            <div class="card shadow-sm h-100">
                <div class="card-body">
                    <img
                        src="${escaparHTML(cosmetico.icone)}"
                        alt="${escaparHTML(cosmetico.nome)}"
                        class="card-img-top"
                        style="height:200px; object-fit:cover;"
                    >

                    <h5 class="card-title mt-3">
                        ${escaparHTML(cosmetico.nome)}
                    </h5>

                    <p class="card-text">
                        Preço: ${escaparHTML(cosmetico.precoOrbes)} Orbes
                    </p>

                    ${
                        !aluno
                            ? `
                                <div class="d-flex gap-2 mb-3">
                                    <button
                                        class="btn btn-primary editar"
                                        data-indice="${indice}">
                                        Editar
                                    </button>

                                    <button
                                        class="btn btn-danger excluir"
                                        data-indice="${indice}">
                                        Excluir
                                    </button>
                                </div>
                            `
                            : ""
                    }

                    <button class="btn btn-success comprar">
                        Comprar
                    </button>
                </div>
            </div>
        `;

        // UPDATE: abrir o modal e preencher os campos
        const botaoEditar = coluna.querySelector(".editar");

        if (botaoEditar) {
            botaoEditar.addEventListener("click", () => {
                indiceSelecionado = indice;

                document.getElementById("nomeEditar").value =
                    cosmetico.nome;

                document.getElementById("precoEditar").value =
                    cosmetico.precoOrbes;

                document.getElementById("iconeEditar").value =
                    cosmetico.icone;

                bootstrap.Modal
                    .getOrCreateInstance(modalEditar)
                    .show();
            });
        }

        // DELETE
        const botaoExcluir = coluna.querySelector(".excluir");

        if (botaoExcluir) {
            botaoExcluir.addEventListener("click", async () => {
                if (!confirm(`Deseja excluir "${cosmetico.nome}"?`)) {
                    return;
                }

                try {
                    await requisicao(`/api/cosmeticos/${indice}`, {
                        method: "DELETE"
                    });

                    await carregarDados();
                } catch (erro) {
                    console.error(erro);
                    alert(erro.message);
                }
            });
        }

        // Exemplo do botão de compra
        coluna.querySelector(".comprar").addEventListener("click", () => {
            alert(`Você selecionou: ${cosmetico.nome}`);
        });

        lista.appendChild(coluna);
    });
}

// CREATE: formulário de adicionar
document.getElementById("formAdicionar").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const precoOrbes = Number(
            document.getElementById("preco").value
        );
        const icone = document.getElementById("icone").value.trim();

        try {
            await requisicao("/api/cosmeticos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome,
                    precoOrbes,
                    icone
                })
            });

            this.reset();

            bootstrap.Modal
                .getOrCreateInstance(modalAdicionar)
                .hide();

            await carregarDados();
        } catch (erro) {
            console.error(erro);
            alert(erro.message);
        }
    }
);

// UPDATE: formulário de edição
document.getElementById("formEditar").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        if (indiceSelecionado === null) return;

        const nome = document.getElementById("nomeEditar").value.trim();
        const precoOrbes = Number(
            document.getElementById("precoEditar").value
        );
        const icone = document.getElementById("iconeEditar").value.trim();

        try {
            await requisicao(
                `/api/cosmeticos/${indiceSelecionado}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nome,
                        precoOrbes,
                        icone
                    })
                }
            );

            indiceSelecionado = null;

            bootstrap.Modal
                .getOrCreateInstance(modalEditar)
                .hide();

            await carregarDados();
        } catch (erro) {
            console.error(erro);
            alert(erro.message);
        }
    }
);

carregarDados();
