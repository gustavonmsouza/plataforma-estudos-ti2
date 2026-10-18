
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORTA = 3000;

const caminhoDB = path.join(__dirname,"..","..", "db", "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function lerDB() {
    try {
        const conteudo = await fs.readFile(caminhoDB, "utf8");
        return JSON.parse(conteudo);
    } catch (erro) {
        console.error("Erro real ao ler o banco:", erro);
        throw erro;
    }
}

async function salvarDB(dados) {
    await fs.writeFile(
        caminhoDB,
        JSON.stringify(dados, null, 2),
        "utf8"
    );
}

// READ: carregar dados

app.get("/api/dados", async (req, res) => {
    try {
        const dados = await lerDB();
        res.json(dados);
    } catch (erro) {
        console.error("ERRO COMPLETO:", erro);

        res.status(500).json({
            erro: erro.message,
            codigo: erro.code
        });
    }
});


// CREATE: adicionar cosmético
app.post("/api/cosmeticos", async (req, res) => {
    try {
        const { nome, precoOrbes, icone } = req.body;

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            !Number.isFinite(precoOrbes) ||
            precoOrbes < 0 ||
            typeof icone !== "string" ||
            !icone.trim()
        ) {
            return res.status(400).json({
                erro: "Informe nome, preço válido e ícone."
            });
        }

        const dados = await lerDB();

        dados.cosmeticos.push({
            nome: nome.trim(),
            precoOrbes,
            icone: icone.trim()
        });

        await salvarDB(dados);

        res.status(201).json({
            mensagem: "Cosmético adicionado com sucesso."
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao adicionar cosmético." });
    }
});

// UPDATE: editar cosmético
app.put("/api/cosmeticos/:indice", async (req, res) => {
    try {
        const indice = Number(req.params.indice);
        const { nome, precoOrbes, icone } = req.body;

        if (
            !Number.isInteger(indice) ||
            indice < 0 ||
            typeof nome !== "string" ||
            !nome.trim() ||
            !Number.isFinite(precoOrbes) ||
            precoOrbes < 0 ||
            typeof icone !== "string" ||
            !icone.trim()
        ) {
            return res.status(400).json({
                erro: "Dados inválidos."
            });
        }

        const dados = await lerDB();

        if (!dados.cosmeticos[indice]) {
            return res.status(404).json({
                erro: "Cosmético não encontrado."
            });
        }

        dados.cosmeticos[indice] = {
            ...dados.cosmeticos[indice],
            nome: nome.trim(),
            precoOrbes,
            icone: icone.trim()
        };

        await salvarDB(dados);

        res.json({ mensagem: "Cosmético atualizado com sucesso." });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao editar cosmético." });
    }
});

// DELETE: excluir cosmético
app.delete("/api/cosmeticos/:indice", async (req, res) => {
    try {
        const indice = Number(req.params.indice);

        if (!Number.isInteger(indice) || indice < 0) {
            return res.status(400).json({ erro: "Índice inválido." });
        }

        const dados = await lerDB();

        if (!dados.cosmeticos[indice]) {
            return res.status(404).json({
                erro: "Cosmético não encontrado."
            });
        }

        dados.cosmeticos.splice(indice, 1);

        await salvarDB(dados);

        res.json({ mensagem: "Cosmético excluído com sucesso." });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao excluir cosmético." });
    }
});

app.listen(PORTA, () => {
    console.log(`Servidor iniciado em http://localhost:${PORTA}`);
});
