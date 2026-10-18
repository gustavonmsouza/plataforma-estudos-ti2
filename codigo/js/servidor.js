const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORTA = process.env.PORT || 3000;
const caminhoDB = path.join(__dirname, "..", "db", "db.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

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
        const { nome, precoOrbes, icone } = req.body;
        if (!validarCosmetico({ nome, precoOrbes, icone })) {
            return res.status(400).json({ erro: "Informe nome, preço não negativo e caminho/URL da imagem." });
        }

        const dados = await lerDB();
        const novoId = dados.cosmeticos.reduce((maior, c) => Math.max(maior, Number(c.id) || 0), 0) + 1;
        dados.cosmeticos.push({ id: novoId, nome: nome.trim(), precoOrbes, icone: icone.trim() });
        await salvarDB(dados);
        res.status(201).json({ mensagem: "Cosmético adicionado.", cosmetico: dados.cosmeticos.at(-1) });
    } catch (erro) {
        console.error("Erro ao adicionar cosmético:", erro);
        res.status(500).json({ erro: "Erro ao adicionar cosmético." });
    }
});

// UPDATE
app.put("/api/cosmeticos/:id", exigirAdministrador, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, precoOrbes, icone } = req.body;
        if (!Number.isInteger(id) || id <= 0 || !validarCosmetico({ nome, precoOrbes, icone })) {
            return res.status(400).json({ erro: "Dados inválidos." });
        }

        const dados = await lerDB();
        const cosmetico = dados.cosmeticos.find(c => Number(c.id) === id);
        if (!cosmetico) return res.status(404).json({ erro: "Cosmético não encontrado." });

        cosmetico.nome = nome.trim();
        cosmetico.precoOrbes = precoOrbes;
        cosmetico.icone = icone.trim();
        await salvarDB(dados);
        res.json({ mensagem: "Cosmético atualizado.", cosmetico });
    } catch (erro) {
        console.error("Erro ao editar cosmético:", erro);
        res.status(500).json({ erro: "Erro ao editar cosmético." });
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

app.listen(PORTA, () => {
    console.log(`Quorbe disponível em http://localhost:${PORTA}/loja.html`);
    console.log(`Banco de dados: ${caminhoDB}`);
});
