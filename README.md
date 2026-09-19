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

## Usando pelo celular (mesma rede Wi-Fi)

O celular precisa estar na **mesma rede Wi-Fi** do computador onde o app
está rodando (não funciona pela internet, só na rede local).

1. Descubra o IP local do computador:
   - Linux/Mac: `hostname -I` ou `ifconfig` (algo como `192.168.0.x`)
   - Windows: `ipconfig` (campo "Endereço IPv4")
2. Rode o backend escutando em todas as interfaces de rede, não só em
   `localhost`:
   ```bash
   ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. Rode o frontend normalmente (`npm run dev`) — ele já escuta em `0.0.0.0`
   por padrão (configurado em `vite.config.js`).
4. No navegador do celular, acesse `http://<IP-DO-COMPUTADOR>:5173`
   (exemplo: `http://192.168.0.15:5173`). O frontend detecta sozinho o
   endereço da API a partir da URL usada para abrir a página, então não
   precisa configurar nada a mais.
5. Se não conectar, confira o firewall do computador — pode ser necessário
   liberar as portas `5173` e `8000` para conexões da rede local.

Dica: no navegador do celular (Chrome/Safari), use "Adicionar à tela de
início" para abrir o app como se fosse um atalho, sem a barra de endereço.

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
