# Roleta de Passeios — Gramado

Roleta girável com trava de código: cada girada exige o **próximo código da fila**,
e cada código funciona **uma única vez**.

## Como funciona

- Os 15 códigos ficam **só no servidor** (`netlify/functions/girar.mjs`). Ninguém vê pelo navegador.
- A roleta só libera se o código digitado for **exatamente o próximo da fila**.
- Ao liberar, o servidor marca aquele código como usado e passa a exigir o seguinte.
- Depois do 15º, a fila volta para o 1º (o cliente 16 usa o código 1 de novo).
- O servidor também sorteia o passeio: a cada 7 giradas, os 7 passeios saem uma vez cada.
- Cada girada fica registrada com nome, WhatsApp, código e passeio.

## Publicar (uma vez só)

1. **GitHub** → crie um repositório novo (pode ser privado).
2. Em *Add file → Upload files*, arraste **todos** estes arquivos e pastas:
   - `index.html`
   - `netlify.toml`
   - `package.json`
   - a pasta `netlify/` inteira (com `functions/girar.mjs` dentro)
3. **Netlify** → *Add new project → Import an existing project → GitHub* → escolha o repositório.
4. Deixe as configurações como vierem e clique em **Deploy**.
5. Pronto: o link `algumacoisa.netlify.app` é o que você envia para os clientes.

> Trocar o nome do site: *Site configuration → Change site name*.

## Seu painel

Abra **`seusite.netlify.app/#painel`** e digite a senha.

- Senha inicial: `ManuGramado2026`
- Mostra qual é o **próximo código da fila**, quais já foram usados e todas as leads
  (com link direto para o WhatsApp de cada pessoa) + download em CSV.
- **Pular**: use quando um cliente não for girar e você quiser avançar a fila.
- **Voltar**: desfaz um pulo.
- **Reiniciar fila**: volta para o código nº 1.

### Trocar a senha

No Netlify: *Site configuration → Environment variables → Add a variable*
- Key: `ADMIN_SENHA`
- Value: a senha que você quiser

Depois, *Deploys → Trigger deploy → Deploy site*.

## Mudar os códigos, os passeios ou o WhatsApp

- **Códigos** e **passeios**: no arquivo `netlify/functions/girar.mjs`, nas listas do topo.
  A ordem da lista de códigos é a ordem da fila.
- **Seu WhatsApp**: em `index.html`, na linha `const WHATSAPP_DESTINO`.
- **Os nomes nas fatias da roleta**: em `index.html`, na lista `ITEMS`
  (precisa ter os mesmos passeios, na mesma ordem, da lista do servidor).

Depois de editar no GitHub, o Netlify publica sozinho em cerca de um minuto.
