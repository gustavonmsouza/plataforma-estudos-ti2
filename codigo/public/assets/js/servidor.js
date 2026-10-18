const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORTA = process.env.PORT || 3000;
const raizProjeto = path.resolve(__dirname, "..", "..", "..");
const pastaPublica = path.resolve(__dirname, "..", "..");
const caminhoDB = path.join(raizProjeto, "db", "db.json");

app.use(express.json({ limit: "8mb" }));
// Não exponha o código-fonte do servidor pela pasta pública.
app.get("/assets/js/servidor.js", (req, res) => res.sendStatus(404));
app.use(express.static(pastaPublica));

const pastaFotosCosmeticos = path.join(pastaPublica, "assets", "images", "cosmeticos");
const tiposImagemPermitidos = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif"
};

async function salvarFotoEnviada(imagemBase64, tipoImagem, cosmeticoId) {
    if (!imagemBase64) return null;
    const extensao = tiposImagemPermitidos[tipoImagem];
    if (!extensao) throw new Error("Formato de imagem inválido. Use PNG, JPG, WEBP ou GIF.");

    const conteudoBase64 = String(imagemBase64).replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(conteudoBase64, "base64");
    if (!buffer.length) throw new Error("A foto enviada está vazia ou inválida.");
    if (buffer.length > 5 * 1024 * 1024) throw new Error("A foto deve ter no máximo 5 MB.");

    await fs.mkdir(pastaFotosCosmeticos, { recursive: true });
    const nomeArquivo = `cosmetico-${cosmeticoId}-${Date.now()}.${extensao}`;
    await fs.writeFile(path.join(pastaFotosCosmeticos, nomeArquivo), buffer, { flag: "wx" });
    return `./assets/images/cosmeticos/${nomeArquivo}`;
}

async function lerDB() {
    const conteudo = await fs.readFile(caminhoDB, "utf8");
    const dados = JSON.parse(conteudo);

    if (!Array.isArray(dados.usuarios) || !Array.isArray(dados.cosmeticos)) {
        throw new Error("O db.json precisa conter os arrays 'usuarios' e 'cosmeticos'.");
    }

    if (!Array.isArray(dados.cosmeticosUsuarios)) dados.cosmeticosUsuarios = [];
    return dados;
}

async function salvarDB(dados) {
    await fs.writeFile(caminhoDB, JSON.stringify(dados, null, 2), "utf8");
}

function validarCosmetico({ nome, precoOrbes, icone }) {
    return typeof nome === "string" &&
        nome.trim().length > 0 &&
        typeof precoOrbes === "number" &&
        Number.isFinite(precoOrbes) &&
        precoOrbes >= 0 &&
        typeof icone === "string" &&
        icone.trim().length > 0;
}

// Demonstração: o navegador envia o ID do usuário atual no cabeçalho.
// Em produção, substitua isso por autenticação de sessão/token confiável.
async function obterUsuarioDaRequisicao(req) {
    const usuarioId = Number(req.get("x-usuario-id"));
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) return null;
    const dados = await lerDB();
    return dados.usuarios.find(u => Number(u.id) === usuarioId) || null;
}

async function exigirAdministrador(req, res, next) {
    try {
        const usuario = await obterUsuarioDaRequisicao(req);
        if (!usuario) {
            return res.status(401).json({ erro: "Usuário não identificado. Selecione um usuário de teste." });
        }
        if (!["administrador", "admin", "professor"].includes(String(usuario.funcao || "").trim().toLowerCase())) {
            return res.status(403).json({ erro: "Somente professores e administradores podem gerenciar cosméticos." });
        }
        req.usuarioAtual = usuario;
        next();
    } catch (erro) {
        console.error("Falha ao verificar permissões de gerenciamento:", erro);
        res.status(500).json({ erro: "Erro ao verificar permissões." });
    }
}

// READ: retorna os dados necessários à loja
app.get("/api/dados", async (req, res) => {
    try {
        const dados = await lerDB();
        res.json({
            usuarios: dados.usuarios.map(({ senha, ...u }) => u),
            cosmeticos: dados.cosmeticos,
            cosmeticosUsuarios: dados.cosmeticosUsuarios
        });
    } catch (erro) {
        console.error("Erro ao ler banco:", erro);
        res.status(500).json({ erro: "Erro ao ler o banco de dados." });
    }
});

// CREATE
app.post("/api/cosmeticos", exigirAdministrador, async (req, res) => {
    try {
        const { nome, precoOrbes, icone, imagemBase64, tipoImagem } = req.body;
        if (typeof nome !== "string" || !nome.trim() || typeof precoOrbes !== "number" || !Number.isFinite(precoOrbes) || precoOrbes < 0) {
            return res.status(400).json({ erro: "Informe um nome e um preço válido não negativo." });
        }

        const dados = await lerDB();
        const novoId = dados.cosmeticos.reduce((maior, c) => Math.max(maior, Number(c.id) || 0), 0) + 1;
        const fotoSalva = await salvarFotoEnviada(imagemBase64, tipoImagem, novoId);
        const caminhoImagem = fotoSalva || (typeof icone === "string" && icone.trim() ? icone.trim() : "sem-imagem");
        const novoCosmetico = { id: novoId, nome: nome.trim(), precoOrbes, icone: caminhoImagem };
        dados.cosmeticos.push(novoCosmetico);
        await salvarDB(dados);
        res.status(201).json({ mensagem: "Cosmético adicionado.", cosmetico: novoCosmetico });
    } catch (erro) {
        console.error("Erro ao adicionar cosmético:", erro);
        res.status(400).json({ erro: erro.message || "Erro ao adicionar cosmético." });
    }
});

// UPDATE
app.put("/api/cosmeticos/:id", exigirAdministrador, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, precoOrbes, imagemBase64, tipoImagem } = req.body;
        if (!Number.isInteger(id) || id <= 0 || typeof nome !== "string" || !nome.trim() || typeof precoOrbes !== "number" || !Number.isFinite(precoOrbes) || precoOrbes < 0) {
            return res.status(400).json({ erro: "Dados inválidos. Confira nome e preço." });
        }

        const dados = await lerDB();
        const cosmetico = dados.cosmeticos.find(c => Number(c.id) === id);
        if (!cosmetico) return res.status(404).json({ erro: "Cosmético não encontrado." });

        const fotoSalva = await salvarFotoEnviada(imagemBase64, tipoImagem, id);
        cosmetico.nome = nome.trim();
        cosmetico.precoOrbes = precoOrbes;
        // Sem uma nova foto enviada, preserva a foto que já estava cadastrada.
        if (fotoSalva) cosmetico.icone = fotoSalva;
        if (!cosmetico.icone) cosmetico.icone = "sem-imagem";
        await salvarDB(dados);
        res.json({ mensagem: "Cosmético atualizado.", cosmetico });
    } catch (erro) {
        console.error("Erro ao editar cosmético:", erro);
        res.status(400).json({ erro: erro.message || "Erro ao editar cosmético." });
    }
});

// DELETE
app.delete("/api/cosmeticos/:id", exigirAdministrador, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: "ID inválido." });

        const dados = await lerDB();
        const existe = dados.cosmeticos.some(c => Number(c.id) === id);
        if (!existe) return res.status(404).json({ erro: "Cosmético não encontrado." });

        dados.cosmeticos = dados.cosmeticos.filter(c => Number(c.id) !== id);
        // Remove relações de posse do cosmético excluído.
        dados.cosmeticosUsuarios = dados.cosmeticosUsuarios.filter(rel => Number(rel.cosmeticoId) !== id);
        // Limpa o cosmético equipado, se algum usuário o usava.
        for (const usuario of dados.usuarios) {
            if (Number(usuario.cosmeticoEquipadoId) === id) usuario.cosmeticoEquipadoId = null;
        }

        await salvarDB(dados);
        res.json({ mensagem: "Cosmético excluído." });
    } catch (erro) {
        console.error("Erro ao excluir cosmético:", erro);
        res.status(500).json({ erro: "Erro ao excluir cosmético." });
    }
});

// RESGATE: confirma, verifica saldo e registra posse no JSON.
app.post("/api/resgates", async (req, res) => {
    try {
        const usuarioId = Number(req.get("x-usuario-id"));
        const cosmeticoId = Number(req.body.cosmeticoId);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !Number.isInteger(cosmeticoId) || cosmeticoId <= 0) {
            return res.status(400).json({ erro: "Usuário ou cosmético inválido." });
        }

        const dados = await lerDB();
        const usuario = dados.usuarios.find(u => Number(u.id) === usuarioId);
        const cosmetico = dados.cosmeticos.find(c => Number(c.id) === cosmeticoId);

        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
        if (!cosmetico) return res.status(404).json({ erro: "Cosmético não encontrado." });

        if (!Array.isArray(dados.cosmeticosUsuarios)) dados.cosmeticosUsuarios = [];
        const jaPossui = dados.cosmeticosUsuarios.some(
            rel => Number(rel.usuarioId) === usuarioId && Number(rel.cosmeticoId) === cosmeticoId
        );
        if (jaPossui) return res.status(409).json({ erro: "Você já possui esse cosmético." });

        const saldo = Number(usuario.orbes) || 0;
        const custo = Number(cosmetico.precoOrbes) || 0;
        if (saldo < custo) return res.status(400).json({ erro: "Você não tem Orbes suficientes." });

        usuario.orbes = saldo - custo;
        const novaRelacaoId = dados.cosmeticosUsuarios.reduce((maior, rel) => Math.max(maior, Number(rel.id) || 0), 0) + 1;
        dados.cosmeticosUsuarios.push({
            id: novaRelacaoId,
            usuarioId,
            cosmeticoId,
            dataAdquirido: new Date().toISOString()
        });

        await salvarDB(dados);
        res.json({ mensagem: "Resgate concluído!", orbes: usuario.orbes });
    } catch (erro) {
        console.error("Erro no resgate:", erro);
        res.status(500).json({ erro: "Erro ao concluir o resgate." });
    }
});



// API REST genérica para os recursos do db.json.
// Mantém compatibilidade com as páginas antigas que consultavam o JSON Server
// (/usuarios, /turmas, /conquistas etc.), mas usando este mesmo servidor e porta.
app.use(async (req, res, next) => {
    try {
        // As rotas específicas da loja (/api/...) foram registradas acima.
        if (req.path.startsWith("/api/")) return next();

        const segmentos = req.path.split("/").filter(Boolean);
        if (segmentos.length < 1 || segmentos.length > 2) return next();

        const nomeColecao = segmentos[0];
        const idSolicitado = segmentos[1];
        const dados = await lerDB();
        if (!Object.prototype.hasOwnProperty.call(dados, nomeColecao) || !Array.isArray(dados[nomeColecao])) {
            return next();
        }

        const colecao = dados[nomeColecao];
        const comparar = (a, b) => String(a ?? "") === String(b ?? "");

        if (req.method === "GET" && idSolicitado !== undefined) {
            const registro = colecao.find(item => comparar(item.id, decodeURIComponent(idSolicitado)));
            if (!registro) return res.status(404).json({ erro: "Registro não encontrado." });
            return res.json(registro);
        }

        if (req.method === "GET") {
            let resultado = colecao.filter(registro => Object.entries(req.query).every(([chave, valor]) => {
                if (chave.startsWith("_")) return true;
                let campo = chave;
                let operador = "eq";
                for (const sufixo of ["_like", "_gte", "_lte", "_ne", "_gt", "_lt"]) {
                    if (chave.endsWith(sufixo)) {
                        campo = chave.slice(0, -sufixo.length);
                        operador = sufixo.slice(1);
                        break;
                    }
                }
                const atual = registro[campo];
                const esperado = Array.isArray(valor) ? valor[0] : valor;
                if (operador === "ne") return !comparar(atual, esperado);
                if (operador === "like") return String(atual ?? "").toLowerCase().includes(String(esperado).toLowerCase());
                if (["gte", "lte", "gt", "lt"].includes(operador)) {
                    const a = Number(atual), b = Number(esperado);
                    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
                    if (operador === "gte") return a >= b;
                    if (operador === "lte") return a <= b;
                    if (operador === "gt") return a > b;
                    return a < b;
                }
                return comparar(atual, esperado);
            }));

            const total = resultado.length;
            const ordenar = req.query._sort;
            if (ordenar) {
                const campos = String(ordenar).split(",");
                const ordens = String(req.query._order || "asc").split(",");
                resultado.sort((a, b) => {
                    for (let i = 0; i < campos.length; i++) {
                        const av = a[campos[i]], bv = b[campos[i]];
                        if (av === bv) continue;
                        const comparacao = av == null ? -1 : bv == null ? 1 : (av > bv ? 1 : -1);
                        return (ordens[i] || ordens[0] || "asc").toLowerCase() === "desc" ? -comparacao : comparacao;
                    }
                    return 0;
                });
            }

            const inicio = req.query._start !== undefined ? Math.max(0, Number(req.query._start) || 0) : null;
            const fim = req.query._end !== undefined ? Math.max(0, Number(req.query._end) || 0) : null;
            if (inicio !== null || fim !== null) {
                resultado = resultado.slice(inicio ?? 0, fim ?? undefined);
            } else if (req.query._page !== undefined) {
                const pagina = Math.max(1, Number(req.query._page) || 1);
                const limite = Math.max(1, Number(req.query._limit) || 10);
                resultado = resultado.slice((pagina - 1) * limite, pagina * limite);
            } else if (req.query._limit !== undefined) {
                resultado = resultado.slice(0, Math.max(0, Number(req.query._limit) || 0));
            }
            res.set("X-Total-Count", String(total));
            return res.json(resultado);
        }

        if (req.method === "POST" && idSolicitado === undefined) {
            if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "O corpo da requisição deve ser um objeto JSON." });
            }
            const novo = { ...req.body };
            if (novo.id === undefined || novo.id === null || novo.id === "") {
                novo.id = colecao.reduce((maior, item) => Math.max(maior, Number(item.id) || 0), 0) + 1;
            }
            colecao.push(novo);
            await salvarDB(dados);
            return res.status(201).json(novo);
        }

        if ((req.method === "PUT" || req.method === "PATCH") && idSolicitado !== undefined) {
            const indice = colecao.findIndex(item => comparar(item.id, decodeURIComponent(idSolicitado)));
            if (indice < 0) return res.status(404).json({ erro: "Registro não encontrado." });
            const corpo = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
            const atualizado = req.method === "PATCH"
                ? { ...colecao[indice], ...corpo, id: colecao[indice].id }
                : { ...corpo, id: corpo.id ?? colecao[indice].id };
            colecao[indice] = atualizado;
            await salvarDB(dados);
            return res.json(atualizado);
        }

        if (req.method === "DELETE" && idSolicitado !== undefined) {
            const indice = colecao.findIndex(item => comparar(item.id, decodeURIComponent(idSolicitado)));
            if (indice < 0) return res.status(404).json({ erro: "Registro não encontrado." });
            const removido = colecao.splice(indice, 1)[0];
            await salvarDB(dados);
            return res.json(removido);
        }

        return next();
    } catch (erro) {
        console.error("Erro na API REST genérica:", erro);
        return res.status(500).json({ erro: "Não foi possível processar a requisição." });
    }
});

app.listen(PORTA, () => {
    console.log(`Quorbe disponível em http://localhost:${PORTA}/`);
    console.log(`Loja de cosméticos: http://localhost:${PORTA}/loja.html`);
    console.log(`API da loja: http://localhost:${PORTA}/api/dados`);
    console.log(`Banco de dados: ${caminhoDB}`);
});
