const dados = JSON.parse(localStorage.getItem("deliveryData")) || {
  dias: {},
  kmAnterior: 0,
  metaDiaria: 150,
  metaMensal: 4500,
  metaFinanceira: 2500, 
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const frasesMotivacionais = [
  "Não desista! Amanhã é um novo dia!",
  "Continue acelerando, o sucesso está próximo!",
  "Cada dia é uma nova oportunidade!",
  "Você consegue! Foco na meta!",
  "Persistência é a chave do sucesso!",
  "Bora rodar mais! Você é capaz!",
  "Não pare agora! Continue firme!",
];

let diaSelecionado = null;


function atualizarRelogio() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");
  document.getElementById("currentTime").textContent = `${horas}:${minutos}`;
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();


function getDataHoje() {
  const hoje = new Date();
  return hoje.toISOString().split("T")[0];
}


function getDadosDia(data) {
  if (!dados.dias[data]) {
    dados.dias[data] = {
      entrada: null,
      saida: null,
      kmInicial: 0,
      kmFinal: 0,
      kmRodados: 0,
      ganhos: 0,
      gastoGasolina: 0,
      gastoManutencao: 0,
      gastoAntecipacao: 0,
      metaBatida: false,
    };
  }
  return dados.dias[data];
}


function salvarDados() {
  localStorage.setItem("deliveryData", JSON.stringify(dados));
  atualizarInterface();
}


function registrarEntrada() {
  const dataHoje = getDataHoje();
  const dadosHoje = getDadosDia(dataHoje);
  const agora = new Date();

  dadosHoje.entrada = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  salvarDados();

  document.getElementById("btnEntrada").style.display = "none";
  document.getElementById("btnSaida").style.display = "block";
  document.getElementById("workStatus").textContent = "Trabalhando";
  document.getElementById("workStatus").className = "status-badge status-working";

  mostrarModal("Entrada Registrada!", `Entrada registrada às ${dadosHoje.entrada}. Boa sorte nas entregas!`);
}


function registrarSaida() {
  const dataHoje = getDataHoje();
  const dadosHoje = getDadosDia(dataHoje);
  const agora = new Date();

  dadosHoje.saida = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  salvarDados();

  document.getElementById("btnEntrada").style.display = "block";
  document.getElementById("btnSaida").style.display = "none";
  document.getElementById("workStatus").textContent = "Fora do Expediente";
  document.getElementById("workStatus").className = "status-badge status-off";

  mostrarModal("Saída Registrada!", `Saída registrada às ${dadosHoje.saida}. Descanse bem!`);
}


function registrarKm() {
  const kmAtual = Number.parseFloat(document.getElementById("kmAtual").value);

  if (!kmAtual || kmAtual <= 0) {
    mostrarModal("Erro", "Por favor, insira um valor válido de KM.");
    return;
  }

  const dataHoje = getDataHoje();
  const dadosHoje = getDadosDia(dataHoje);

  if (dadosHoje.kmInicial === 0) {
    dadosHoje.kmInicial = dados.kmAnterior || kmAtual;
  }

  dadosHoje.kmFinal = kmAtual;
  dadosHoje.kmRodados = dadosHoje.kmFinal - dadosHoje.kmInicial;
  dados.kmAnterior = kmAtual;

  dadosHoje.metaBatida = dadosHoje.kmRodados >= dados.metaDiaria;

  document.getElementById("kmRodados").textContent = dadosHoje.kmRodados.toFixed(1);
  document.getElementById("kmAtual").value = "";

  salvarDados();
  mostrarModal("KM Registrado!", `Você rodou ${dadosHoje.kmRodados.toFixed(1)} km hoje!`);
}


function registrarGanho() {
  const ganho = Number.parseFloat(document.getElementById("ganhoDia").value);

  if (!ganho || ganho <= 0) {
    mostrarModal("Erro", "Por favor, insira um valor válido de ganho.");
    return;
  }

  const dataHoje = getDataHoje();
  const dadosHoje = getDadosDia(dataHoje);

  dadosHoje.ganhos += ganho;
  document.getElementById("totalGanho").textContent = `R$ ${dadosHoje.ganhos.toFixed(2)}`;
  document.getElementById("ganhoDia").value = "";

  salvarDados();

  const acumulado = calcularAcumuladoMensal();
  const meta = dados.metaFinanceira;
  const falta = Math.max(meta - acumulado, 0);
  const percentual = Math.min((acumulado / meta) * 100, 100).toFixed(1);

  mostrarModal(
    "Ganho Registrado!",
    `R$ ${ganho.toFixed(2)} adicionados aos ganhos de hoje!\n\n💰 Total acumulado: R$ ${acumulado.toFixed(
      2
    )}\n🎯 Meta: R$ ${meta.toFixed(2)}\n📈 Faltam R$ ${falta.toFixed(2)} (${percentual}% alcançado)`
  );

  atualizarFinanceiro();
}


function calcularAcumuladoMensal() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  let totalGanhosMes = 0;
  let totalGastosMes = 0;

  Object.keys(dados.dias).forEach((data) => {
    const dataObj = new Date(data + "T00:00:00");
    if (dataObj.getMonth() === mesAtual && dataObj.getFullYear() === anoAtual) {
      const dia = dados.dias[data];
      totalGanhosMes += dia.ganhos;
      // Soma todos os gastos do dia para o total de gastos do mês
      totalGastosMes += dia.gastoGasolina + dia.gastoManutencao + (dia.gastoAntecipacao || 0);
    }
  });
  // O Acumulado agora é o Lucro Líquido do mês
  return totalGanhosMes - totalGastosMes;
}


function registrarGastos() {
  const gasolina = Number.parseFloat(document.getElementById("gastoGasolina").value) || 0;
  const manutencao = Number.parseFloat(document.getElementById("gastoManutencao").value) || 0;
  const antecipacao = Number.parseFloat(document.getElementById("gastoAntecipacao").value) || 0;

  if (gasolina === 0 && manutencao === 0 && antecipacao === 0) {
    mostrarModal("Erro", "Por favor, insira pelo menos um valor de gasto.");
    return;
  }

  const dataHoje = getDataHoje();
  const dadosHoje = getDadosDia(dataHoje);

  if (gasolina > 0) dadosHoje.gastoGasolina += gasolina;
  if (manutencao > 0) dadosHoje.gastoManutencao += manutencao;
  if (antecipacao > 0) dadosHoje.gastoAntecipacao += antecipacao;

  document.getElementById("gastoGasolina").value = "";
  document.getElementById("gastoManutencao").value = "";
  document.getElementById("gastoAntecipacao").value = "";

  salvarDados();

  const total = gasolina + manutencao + antecipacao;
  mostrarModal("Gastos Registrados!", `Total de R$ ${total.toFixed(2)} em gastos registrado.`);
}


function atualizarInterface() {
  const dataHoje = getDataHoje();
  const dadosHoje = getDadosDia(dataHoje);

  
  if (dadosHoje.entrada && !dadosHoje.saida) {
    document.getElementById("btnEntrada").style.display = "none";
    document.getElementById("btnSaida").style.display = "block";
    document.getElementById("workStatus").textContent = "Trabalhando";
    document.getElementById("workStatus").className = "status-badge status-working";
    document.getElementById("pontoInfo").textContent = `Entrada: ${dadosHoje.entrada}`;
  } else if (dadosHoje.entrada && dadosHoje.saida) {
    document.getElementById("pontoInfo").textContent = `Entrada: ${dadosHoje.entrada} | Saída: ${dadosHoje.saida}`;
  }

 
  document.getElementById("kmRodados").textContent = dadosHoje.kmRodados.toFixed(1);

  document.getElementById("totalGanho").textContent = `R$ ${dadosHoje.ganhos.toFixed(2)}`;


  document.getElementById("headerKM").textContent = `${dadosHoje.kmRodados.toFixed(0)} KM`;
  document.getElementById("headerGanhos").textContent = `R$ ${dadosHoje.ganhos.toFixed(0)}`;

  atualizarCalendario();
  atualizarEstatisticas();
  atualizarFinanceiro();
  atualizarMetaMensal();
}


function atualizarCalendario() {
  const calendario = document.getElementById("weekCalendar");
  calendario.innerHTML = "";

  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - diaSemana);

  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    const dataStr = dia.toISOString().split("T")[0];
    const dadosDia = dados.dias[dataStr];

    const dayCard = document.createElement("div");
    dayCard.className = "day-card";
    dayCard.dataset.date = dataStr;

    if (dataStr === getDataHoje()) {
      dayCard.classList.add("active");
    } else if (dadosDia && dadosDia.kmRodados > 0) {
      dayCard.classList.add("completed");
    }

    const kmRodados = dadosDia ? dadosDia.kmRodados.toFixed(0) : "0";
    const diaNum = dia.getDate();

    dayCard.innerHTML = `
      <div class="day-name">${diasSemana[i]}</div>
      <div class="day-date">${diaNum}</div>
      <div class="day-km">${kmRodados} km</div>
    `;
    dayCard.addEventListener("click", () => mostrarHistoricoDia(dataStr));
    calendario.appendChild(dayCard);
  }
}


function atualizarEstatisticas() {
  let totalGanhos = 0;
  let totalGastos = 0;
  let totalKm = 0;

  Object.values(dados.dias).forEach((dia) => {
    totalGanhos += dia.ganhos;
    totalGastos += dia.gastoGasolina + dia.gastoManutencao + (dia.gastoAntecipacao || 0);
    totalKm += dia.kmRodados;
  });

  const lucro = totalGanhos - totalGastos;

  document.getElementById("statGanhos").textContent = `R$ ${totalGanhos.toFixed(2)}`;
  document.getElementById("statGastos").textContent = `R$ ${totalGastos.toFixed(2)}`;
  document.getElementById("statLucro").textContent = `R$ ${lucro.toFixed(2)}`;
  document.getElementById("statLucro").className = `stat-box-value ${lucro >= 0 ? "positive" : "negative"}`;
  document.getElementById("statKmTotal").textContent = `${totalKm.toFixed(1)} km`;
}


function atualizarFinanceiro() {
  const metaMensal = dados.metaFinanceira;
  const acumulado = calcularAcumuladoMensal();
  const falta = Math.max(metaMensal - acumulado, 0);
  const percentual = Math.min((acumulado / metaMensal) * 100, 100);

  document.getElementById("financeiroAcumulado").textContent = `R$ ${acumulado.toFixed(2)}`;
  document.getElementById("financeiroFalta").textContent = `R$ ${falta.toFixed(2)}`;
  document.getElementById("financeiroProgress").style.width = `${percentual}%`;
  document.getElementById("financeiroPercent").textContent = `${percentual.toFixed(1)}% da meta`;
}


function resetarTudo() {
  const confirmar = confirm("⚠️ Tem certeza que deseja resetar todos os dados? Isso não pode ser desfeito.");
  if (confirmar) {
    localStorage.removeItem("deliveryData");
    location.reload();
  }
}


function mostrarModal(titulo, mensagem) {
  document.getElementById("modalTitle").textContent = titulo;
  document.getElementById("modalMessage").textContent = mensagem;
  document.getElementById("modal").classList.add("active");
}
function fecharModal() {
  document.getElementById("modal").classList.remove("active");
}


function atualizarMetaMensal() {
    const metaMensal = dados.metaMensal;
    let kmAcumuladoMes = 0;
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    Object.keys(dados.dias).forEach((data) => {
        const dataObj = new Date(data + "T00:00:00");
        if (dataObj.getMonth() === mesAtual && dataObj.getFullYear() === anoAtual) {
            kmAcumuladoMes += dados.dias[data].kmRodados;
        }
    });

    const percentual = Math.min((kmAcumuladoMes / metaMensal) * 100, 100);

    const metaMensalElement = document.getElementById("metaMensal");
    if (metaMensalElement) {
        metaMensalElement.textContent = `${kmAcumuladoMes.toFixed(0)} / ${metaMensal} KM`;
    }

    const progressElement = document.getElementById("metaMensalProgress");
    if (progressElement) {
        progressElement.style.width = `${percentual}%`;
    }

    const percentElement = document.getElementById("metaMensalPercent");
    if (percentElement) {
        percentElement.textContent = `${percentual.toFixed(1)}%`;
    }

    const dataHoje = getDataHoje();
    const dadosHoje = getDadosDia(dataHoje);
    const metaIndicatorDiaria = document.getElementById("metaIndicatorDiaria");
    
    if (metaIndicatorDiaria) {
      if (dadosHoje.kmRodados > 0) {
        if (dadosHoje.kmRodados >= dados.metaDiaria) {
          metaIndicatorDiaria.className = "meta-indicator meta-success";
          metaIndicatorDiaria.textContent = "Meta Batida!";
        } else {
          metaIndicatorDiaria.className = "meta-indicator meta-fail";
          metaIndicatorDiaria.textContent = `${(dados.metaDiaria - dadosHoje.kmRodados).toFixed(1)} km para a meta`;
        }
      } else {
        metaIndicatorDiaria.className = "meta-indicator meta-fail";
        metaIndicatorDiaria.textContent = "Ainda não iniciado";
      }
    }
}


function mostrarHistoricoDia(data) {
    const historyContent = document.getElementById("historyContent");
    const dadosDia = dados.dias[data];

    document.querySelectorAll(".day-card").forEach(card => card.classList.remove("active"));
    
    const selectedDayCard = document.querySelector(`.day-card[data-date="${data}"]`);
    if (selectedDayCard) {
        selectedDayCard.classList.add("active");
    }


    if (!dadosDia) {
        historyContent.innerHTML = "<div>Não há dados para esta data.</div>";
        return;
    }

    const totalGastos = dadosDia.gastoGasolina + dadosDia.gastoManutencao + (dadosDia.gastoAntecipacao || 0);
    const lucroDia = dadosDia.ganhos - totalGastos;

    historyContent.innerHTML = `
        <div class="history-item"><span class="history-label">Entrada:</span><span class="history-value">${dadosDia.entrada || "--"}</span></div>
        <div class="history-item"><span class="history-label">Saída:</span><span class="history-value">${dadosDia.saida || "--"}</span></div>
        <div class="history-item"><span class="history-label">KM Inicial:</span><span class="history-value">${dadosDia.kmInicial.toFixed(1)} km</span></div>
        <div class="history-item"><span class="history-label">KM Final:</span><span class="history-value">${dadosDia.kmFinal.toFixed(1)} km</span></div>
        <div class="history-item"><span class="history-label">KM Rodados:</span><span class="history-value">${dadosDia.kmRodados.toFixed(1)} km</span></div>
        <div class="history-item"><span class="history-label">Ganhos:</span><span class="history-value positive">R$ ${dadosDia.ganhos.toFixed(2)}</span></div>
        <div class="history-item"><span class="history-label">Gasto Gasolina:</span><span class="history-value negative">R$ ${dadosDia.gastoGasolina.toFixed(2)}</span></div>
        <div class="history-item"><span class="history-label">Gasto Manutenção:</span><span class="history-value negative">R$ ${dadosDia.gastoManutencao.toFixed(2)}</span></div>
        <div class="history-item"><span class="history-label">Gasto Antecipação:</span><span class="history-value negative">R$ ${(dadosDia.gastoAntecipacao || 0).toFixed(2)}</span></div>
        <div class="history-item"><span class="history-label">Lucro do Dia:</span><span class="history-value ${lucroDia >= 0 ? "positive" : "negative"}">R$ ${lucroDia.toFixed(2)}</span></div>
    `;
}


atualizarInterface();
