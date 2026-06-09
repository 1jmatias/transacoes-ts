interface Transacao {
    Status: string;
    ID: number;
    Data: string;
    Nome: string;
    "Forma de Pagamento": string;
    Email: string;
    "Valor (R$)": string;
    "Cliente Novo": number;
    [key: string]: string | number;
}

function isTransacao(obj: unknown): obj is Transacao { //typeguard -> verificação de transação válida
  return (
    typeof obj === "object" &&
    obj !== null &&
    "Status" in obj &&
    "ID" in obj &&
    "Data" in obj &&
    "Nome" in obj &&
    "Forma de Pagamento" in obj &&
    "Email" in obj &&
    "Valor (R$)" in obj &&
    "Cliente Novo" in obj
  );
}

function pegarElemento(ID: string): HTMLElement {
  const elemento = document.getElementById(ID);
  if (!(elemento instanceof HTMLElement)) { // typeguard para verificar se é do tipo HTML
    throw new Error(`Elemento com ID "${ID}" não encontrado no HTML.`);
  }
  return elemento;
}

function converterParaNumero(valor: string): number {
  if (valor === "-" || valor.trim() === "") {
    return 0;
  }
  const valorLimpo = valor.replace(".", "").replace(",", ".");
  const numero = parseFloat(valorLimpo); //converte a string para número
  if (isNaN(numero)) { //typeguard para verificar se é um número válido
    throw new Error(`Valor inválido para conversão: "${valor}"`);
  }
  return numero;
}

function pagamentoMaisUsado(transacoes: Transacao[]): string {
  const contagem: { [key: string]: number } = {};

  transacoes.forEach((transacao: Transacao) => {
    const pagamento = transacao["Forma de Pagamento"];
    if (typeof pagamento !== "string") {
      throw new Error("Forma de Pagamento deveria ser string");
    }
    if (contagem[pagamento] === undefined) {
      contagem[pagamento] = 0;
    }
    contagem[pagamento]++;
  });

  let maisUsado: string = "";
  let maiorContagem: number = 0;

  for (const forma in contagem) {
    if (contagem[forma] > maiorContagem) {
      maiorContagem = contagem[forma];
      maisUsado = forma;
    }
  }

  return maisUsado;
}

function contarOcorrencias(transacoes: Transacao[], campo: string): { [key: string]: number } {
  const contagem: { [key: string]: number } = {};

  transacoes.forEach((transacao: Transacao) => {
    const valor = transacao[campo];
    if (typeof valor !== "string") {
      throw new Error(`Campo "${campo}" deveria ser string`);
    }
    if (contagem[valor] === undefined) {
      contagem[valor] = 0;
    }
    contagem[valor]++;
  });

  return contagem;
}

function diaMaisVendas(transacoes: Transacao[]): string {
  const contagem: { [key: string]: number } = {};

  transacoes.forEach((transacao: Transacao) => {
    const data = transacao["Data"];
    if (typeof data !== "string") {
      throw new Error(`Campo "Data" deveria ser string`);
    }
    const partes = data.split(" ")[0].split("/");
    const dataObj = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
    const dia = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
    const diaNome = dia.charAt(0).toUpperCase() + dia.slice(1);

    if (contagem[diaNome] === undefined) {
      contagem[diaNome] = 0;
    }
    contagem[diaNome]++;
  });

  let diaCampeao: string = "";
  let maiorContagem: number = 0;
  for (const dia in contagem) {
    if (contagem[dia] > maiorContagem) {
      maiorContagem = contagem[dia];
      diaCampeao = dia;
    }
  }

  return diaCampeao;
}

function criarTabela(transacoes: Transacao[]): void {
  const elTabela = pegarElemento("tabela-transacoes");
  const tabela = document.createElement("table");
  const cabecalho = document.createElement("tr");

  const colunas: string[] = ["Nome", "Email", "Valor (R$)", "Forma de Pagamento", "Status"];

  colunas.forEach((coluna: string) => {
    const th = document.createElement("th");
    th.innerText = coluna;
    cabecalho.appendChild(th);
  });

  tabela.appendChild(cabecalho);

  transacoes.forEach((transacao: Transacao) => {
    const linha = document.createElement("tr");
    colunas.forEach((coluna: string) => {
      const td = document.createElement("td");
      const valor = transacao[coluna];

      td.innerText = String(valor);
      if (coluna === "Status") {
        if (valor === "Paga") td.className = "status-paga";
        else if (valor === "Recusada pela operadora de cartão") td.className = "status-recusada";
        else if (valor === "Aguardando pagamento") td.className = "status-aguardando";
        else if (valor === "Estornada") td.className = "status-estornada";
      }
      linha.appendChild(td);
    });

    tabela.appendChild(linha);
  });

  elTabela.appendChild(tabela);
}

async function buscarTransacoes(): Promise<Transacao[]> {
  const resposta = await fetch("https://api.origamid.dev/json/transacoes.json");
  const dados: unknown = await resposta.json();

  if (!Array.isArray(dados)) { //type guard para verificar se os dados são um array
    throw new Error("A API não retornou um array.");
  }

  const transacoes = dados.filter(isTransacao);

  if (transacoes.length === 0) {
    throw new Error("Nenhuma transação válida encontrada.");
  }

  return transacoes;
}

async function iniciar(): Promise<void> {
  const transacoes = await buscarTransacoes();
  const elTotalTransacoes = pegarElemento("total-transacoes");
  const elValorTotal = pegarElemento("valor-total");
  const elPagamentoMaisUsado = pegarElemento("pagamento-mais-usado");
  
  const totalTransacoes: number = transacoes.length;
    elTotalTransacoes.innerText = `Total de transações: ${totalTransacoes}`;
  const valorTotal: number = transacoes.reduce((acumulador: number, transacao: Transacao) => {
    const valor = transacao["Valor (R$)"];
    if (typeof valor !== "string") {
      throw new Error(`"Valor (R$)" deveria ser string, mas é ${typeof valor}`);
    }
    return acumulador + converterParaNumero(valor);
  }, 0);
  elValorTotal.innerText = `Valor total: R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const melhorPagamento: string = pagamentoMaisUsado(transacoes);
  elPagamentoMaisUsado.innerText = `Pagamento mais usado: ${melhorPagamento}`;

  const contagemPagamentos = contarOcorrencias(transacoes, "Forma de Pagamento");
  const elContagemPagamentos = pegarElemento("contagem-pagamentos");
    for (const forma in contagemPagamentos) {
      const li = document.createElement("li");
      li.innerText = `${forma}: ${contagemPagamentos[forma]}`;
      elContagemPagamentos.appendChild(li);
    }

  const contagemStatus = contarOcorrencias(transacoes, "Status");
  const elContagemStatus = pegarElemento("contagem-status");
    for (const Status in contagemStatus) {
      const li = document.createElement("li");
      li.innerText = `${Status}: ${contagemStatus[Status]}`;
      elContagemStatus.appendChild(li);
    }

  const diaCampeao: string = diaMaisVendas(transacoes);
  const elDiaMaisVendas = pegarElemento("dia-mais-vendas");
  elDiaMaisVendas.innerText = `Dia com mais vendas: ${diaCampeao}`;

  criarTabela(transacoes);
}

iniciar();