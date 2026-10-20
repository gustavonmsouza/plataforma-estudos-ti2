# Quorbe

## Informações gerais

- **Disciplina:** Trabalho Interdisciplinar II (TI II)
- **Ano/Semestre:** 2026/2

## Alunos integrantes da equipe

- Gabriela Schaper Soriano Veiga
- Gustavo Norberto Medeiros de Souza
- Lucas Marçal Vilela
- Matheus Romling Rotheia Almeida
- Renato Teixeira Miranda Guimarães

## Professores responsáveis

- Marcos André Silveira Kutova
- Rommel Vieira Carneiro

## Resumo

A Quorbe é uma aplicação web desenvolvida para auxiliar alunos e professores na organização e no acompanhamento das atividades acadêmicas. A plataforma reúne funcionalidades de gerenciamento de tarefas, turmas, grupos e notas, além de recursos que permitem acompanhar o progresso dos alunos.

Para os estudantes, a aplicação oferece um sistema de gamificação baseado em pontos, conquistas e sequência de estudos. Os pontos acumulados podem ser utilizados em uma loja de cosméticos integrada à plataforma. Para os professores, são disponibilizados recursos para criação e acompanhamento de tarefas e gerenciamento de turmas e grupos.

## Problema

Alunos e professores precisam lidar com diferentes atividades e informações relacionadas ao ambiente acadêmico, como tarefas, turmas, grupos, notas e acompanhamento dos estudos. A ausência de um ambiente centralizado pode dificultar a organização dessas informações e o acompanhamento da rotina acadêmica.

Além disso, existe a necessidade de incentivar a participação dos estudantes e a continuidade dos estudos. Nesse contexto, recursos de gamificação podem contribuir para tornar o acompanhamento das atividades mais envolvente.

## Solução proposta

A Quorbe propõe reunir, em um único ambiente digital, funcionalidades voltadas para a organização acadêmica de alunos e professores.

A plataforma disponibiliza recursos como calendário, gerenciamento de tarefas, turmas, grupos e notas. Também permite acompanhar as atividades e o progresso dos estudantes.

Para os alunos, a solução inclui recursos de gamificação, como pontos, conquistas e sequência de estudos. Os pontos acumulados podem ser utilizados na loja de cosméticos integrada à plataforma. Para os professores, são disponibilizadas funcionalidades relacionadas ao gerenciamento de turmas e ao acompanhamento das atividades acadêmicas.

## Funcionalidades da plataforma

### Funcionalidades para alunos

- Visualização e organização das atividades acadêmicas.
- Acompanhamento de tarefas.
- Consulta ao calendário.
- Visualização de turmas e grupos.
- Acompanhamento de notas e progresso acadêmico.
- Sistema de gamificação com pontos e conquistas.
- Acompanhamento da sequência de estudos.
- Acesso à loja de cosméticos.
- Personalização do perfil por meio dos itens disponíveis na loja.

### Funcionalidades para professores

- Gerenciamento de turmas.
- Criação e acompanhamento de tarefas.
- Organização de grupos.
- Acompanhamento das atividades dos alunos.
- Recursos relacionados à organização acadêmica.

## Arquitetura da solução

A Quorbe é estruturada como uma aplicação web composta por uma interface front-end e um servidor back-end.

O front-end é responsável pela apresentação das páginas e pela interação dos usuários com a plataforma. A interface disponibiliza funcionalidades conforme os perfis de aluno e professor.

O back-end utiliza Node.js e Express para disponibilizar o servidor HTTP e os recursos da aplicação. Os dados utilizados pelo servidor são armazenados em arquivos JSON.

A comunicação entre a interface e o servidor ocorre por meio de requisições HTTP, incluindo recursos de API REST para acesso e manipulação dos dados.

### Tecnologias utilizadas

- **HTML:** estrutura das páginas.
- **CSS:** estilização e apresentação visual.
- **JavaScript:** funcionalidades e interações da interface.
- **Node.js:** ambiente de execução do servidor.
- **Express:** framework utilizado para disponibilizar o servidor HTTP.
- **JSON:** formato utilizado para armazenamento dos dados.
- **Git e GitHub:** ferramentas de controle de versão e hospedagem de código.
- **Visual Studio Code:** ambiente de desenvolvimento.
- **Figma:** ferramenta de prototipação de interfaces.
- **Miro:** ferramenta de colaboração e organização de ideias.

## Estrutura do projeto

Os principais diretórios e arquivos estão organizados da seguinte forma:

```text
Quorbe/
├── codigo/
│   ├── db/
│   │   ├── db.json
│   │   └── db.json.example
│   └── public/
│       ├── assets/
│       │   ├── css/
│       │   ├── img/
│       │   └── js/
│       │       ├── servidor.js
│       │       └── loja.js
│       ├── index.html
│       └── loja.html
├── docs/
├── templates/
├── package.json
├── package-lock.json
└── README.md