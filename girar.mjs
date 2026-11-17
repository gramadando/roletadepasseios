import { getStore } from "@netlify/blobs";

/* ===================================================================
   OS 15 CÓDIGOS, NA ORDEM DA FILA.
   Ficam só aqui no servidor — ninguém consegue ver pelo navegador.
   Pode trocar/aumentar a lista; a ordem é a ordem de entrega.
   =================================================================== */
const CODIGOS = ['3919','8216','4098','1676','3336','7071','7465','1090',
                 '4189','9962','1960','8729','8143','8705','4016'];

const PASSEIOS = [
  'Museu de Cera',
  'Motor Show Gramado',
  'Hollywood Dreams',
  'Super Carros — Ingresso',
  'Super Carros — Passeio de Porsche',
  'Jardim do Amor',
  'Vale dos Dinossauros',
];

/* Senha do painel. O ideal é definir a variável ADMIN_SENHA no Netlify
   (Site configuration > Environment variables). Sem ela, vale a de baixo. */
const ADMIN = process.env.ADMIN_SENHA || 'ManuGramado2026';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const embaralhar = n => {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

async function lerEstado(store) {
  const e = await store.get('estado', { type: 'json' }).catch(() => null);
  return {
    indice: Number.isInteger(e?.indice) ? e.indice : 0,   // posição atual da fila
    sacola: Array.isArray(e?.sacola) ? e.sacola : [],      // passeios que ainda não saíram no ciclo
    leads:  Array.isArray(e?.leads)  ? e.leads  : [],      // quem girou
    ciclos: Number.isInteger(e?.ciclos) ? e.ciclos : 0,
  };
}
const salvar = (store, est) => store.setJSON('estado', est);

export default async (req) => {
  const store = getStore('roleta');
  const url = new URL(req.url);

  /* ---------------- painel da Manu ---------------- */
  const senha = url.searchParams.get('admin');
  if (senha !== null) {
    if (senha !== ADMIN) return json({ erro: 'senha_incorreta' }, 401);
    const est = await lerEstado(store);
    const acao = url.searchParams.get('acao');

    if (acao === 'pular')  { est.indice = (est.indice + 1) % CODIGOS.length; await salvar(store, est); }
    if (acao === 'voltar') { est.indice = (est.indice - 1 + CODIGOS.length) % CODIGOS.length; await salvar(store, est); }
    if (acao === 'reset')  { est.indice = 0; await salvar(store, est); }
    if (acao === 'limpar') { est.leads = []; await salvar(store, est); }

    return json({
      ok: true,
      posicao: est.indice + 1,
      total: CODIGOS.length,
      proximoCodigo: CODIGOS[est.indice],
      codigos: CODIGOS,
      ciclosCompletos: est.ciclos,
      leads: est.leads.slice().reverse(),
    });
  }

  /* ---------------- girada ---------------- */
  if (req.method !== 'POST') return json({ erro: 'metodo_nao_permitido' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ erro: 'corpo_invalido' }, 400); }

  const nome     = String(body.nome || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const whatsapp = String(body.whatsapp || '').replace(/\D/g, '').slice(0, 13);
  const codigo   = String(body.codigo || '').replace(/\D/g, '');

  if (nome.length < 2)      return json({ ok: false, campo: 'nome',     msg: 'Escreve seu nome 🙂' });
  if (whatsapp.length < 10) return json({ ok: false, campo: 'whatsapp', msg: 'Coloca o DDD + número' });
  if (codigo.length !== 4)  return json({ ok: false, campo: 'codigo',   msg: 'O código tem 4 números' });

  const est = await lerEstado(store);
  const esperado = CODIGOS[est.indice];

  if (codigo !== esperado) {
    const pos = CODIGOS.indexOf(codigo);
    let msg = 'Código inválido. Confere com a Manu 💬';
    if (pos > -1 && pos < est.indice) msg = 'Esse código já foi usado 🙈 Fale com a Manu.';
    else if (pos > -1)                msg = 'Ainda não é a vez desse código ⏳ Fale com a Manu.';
    return json({ ok: false, campo: 'codigo', msg });
  }

  // código certo: consome a vez e sorteia o passeio (7 giradas = os 7 passeios)
  if (!est.sacola.length) est.sacola = embaralhar(PASSEIOS.length);
  const passeio = est.sacola.shift();

  est.indice += 1;
  if (est.indice >= CODIGOS.length) { est.indice = 0; est.ciclos += 1; }

  est.leads.push({
    quando: new Date().toISOString(),
    nome, whatsapp, codigo,
    passeio: PASSEIOS[passeio],
  });
  if (est.leads.length > 5000) est.leads = est.leads.slice(-5000);

  await salvar(store, est);

  return json({ ok: true, passeio, nomePasseio: PASSEIOS[passeio] });
};
