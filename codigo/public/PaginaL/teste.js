const fs = require('fs');
const path = require("path");

const arquivo = path.join(__dirname, "test.json");

function readDB() {
    try {
        const data = fs.readFileSync(arquivo, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler JSON:", err.message);
        throw err;
    }
}

function createPost(data) {
    const registros = readDB();

    registros.push(data);

    fs.writeFileSync(
        arquivo,
        JSON.stringify(registros, null, 2),
        "utf8"
    );

    return registros;
}


function writeDB(data, test) {
    if (!Array.isArray(data)) {
        console.log('Invalid data');
        return false;
    }

    try {
        fs.writeFileSync(test, JSON.stringify(data, null, 2) + '\n');
        console.log("Data saved");
        return true;
    } catch (err) {
        console.log("Failed to write data:", err);
        return false;
    }
}


async function deletePost(id){
    const response = await fetch('test.json/post/id',{
        method:'Delete',
    });
}

async function updatePost(data, id){
    const response = await fetch('test.json/post/id', {
        method: 'PATCH',
        headers: {
            'Content-Type':'application/json',
        },
        body:JSON.stringify(data),
    });
}

module.exports = {readDB,writeDB, createPost, deletePost, updatePost};