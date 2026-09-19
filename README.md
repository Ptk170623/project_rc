# Diário Musical

App pessoal para registrar impressões sobre músicas ao ouvi-las ativamente:
bandas → álbuns → músicas, com classificação (C/B/A/S) e "características"
(observações rápidas) que podem ter uma classificação própria.

- **Backend**: FastAPI + SQLite (SQLAlchemy), servido localmente via `uvicorn`.
- **Frontend**: React (Vite).

## Rodando localmente

### 1. Backend

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn app.main:app --reload --port 8000
```

A API sobe em `http://localhost:8000` (docs interativas em `/docs`) e cria
automaticamente o arquivo `backend/music.db` (SQLite) na primeira execução,
já com uma lista padrão de características/classificações rápidas.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O app abre em `http://localhost:5173` e já aponta para a API em
`http://localhost:8000` (configurável via `VITE_API_BASE`).

## Funcionalidades

- Adicionar banda → dentro da banda, adicionar álbum → dentro do álbum,
  adicionar música.
- Importar músicas em massa por um arquivo `.txt` (uma música por linha).
- Cada música aparece como um "banner" (retângulo com pontas arredondadas)
  mostrando: nome da música em fonte grande; banda e álbum em fonte menor à
  direita; um quadrado com a classificação (C, B, A ou S — clique para
  escolher).
- Clicar na música expande um painel para gerenciar as "características":
  - Botão **+** abre uma lista rápida de opções (editável) ou permite
    escrever um texto livre.
  - Características adicionadas aparecem no topo do banner, lado a lado.
  - Clicar em uma característica permite adicionar uma "classificação" a
    ela (também texto livre ou lista rápida editável), exibida acima da
    característica, mesma fonte, cor diferente.
- As listas de opções rápidas (características e classificações) têm um
  editor próprio para adicionar, renomear ou remover itens.
