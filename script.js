// ==========================================
// LÓGICA DA LISTA DE TAREFAS
// ==========================================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById("taskInput");
  if (!input.value.trim()) return;

  tasks.push({ 
    id: Date.now(), 
    text: input.value, 
    done: false 
  });

  input.value = "";
  save();
  render();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  save();
  render();
}

function editTask(id) {
  const taskToEdit = tasks.find(t => t.id === id);
  if (!taskToEdit) return;
  
  const newText = prompt("Edite a sua tarefa:", taskToEdit.text);
  if (newText !== null && newText.trim() !== "") {
    tasks = tasks.map(t => t.id === id ? { ...t, text: newText.trim() } : t);
    save();
    render();
  }
}

function deleteTask(id) {
  if (confirm("Tem a certeza que deseja excluir esta tarefa?")) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }
}

function render() {
  const todo = document.getElementById("todo");
  const done = document.getElementById("done");
  
  todo.innerHTML = "";
  done.innerHTML = "";
  
  tasks.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${t.id})">
      <span>${t.text}</span>
      <button class="icon-btn" onclick="editTask(${t.id})" title="Editar tarefa">✏️</button>
      <button class="icon-btn delete-btn" onclick="deleteTask(${t.id})" title="Excluir tarefa">🗑️</button>
    `;
    t.done ? done.appendChild(li) : todo.appendChild(li);
  });
}

document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

render();

// ==========================================
// LÓGICA DO JOGO DA VELHA (PvP e PvIA Inteligente)
// ==========================================
let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let gameMode = "pvp";

const cells = document.querySelectorAll('.cell');

function setMode(mode, element) {
    gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    resetGame();
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));

function handleCellClick(e) {
    const clickedCell = e.target;
    const cellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (boardState[cellIndex] !== "" || !gameActive) return;

    makeMove(cellIndex, currentPlayer);

    if (gameActive && gameMode === "pvia" && boardState.includes("")) {
        currentPlayer = "O";
        setTimeout(machineMove, 500);
    } else if (gameActive && gameMode === "pvp") {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
    }
}

function makeMove(index, player) {
    boardState[index] = player;
    cells[index].innerText = player;
    cells[index].style.color = player === 'X' ? '#3498db' : '#e74c3c';
    checkWin(player);
}

function machineMove() {
    if (!gameActive) return;

    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
    ];

    // 1. Tentar GANHAR
    for (let pattern of winPatterns) {
        let [a, b, c] = pattern;
        if (boardState[a] === "O" && boardState[b] === "O" && boardState[c] === "") return finalizaJogadaIA(c);
        if (boardState[a] === "O" && boardState[c] === "O" && boardState[b] === "") return finalizaJogadaIA(b);
        if (boardState[b] === "O" && boardState[c] === "O" && boardState[a] === "") return finalizaJogadaIA(a);
    }

    // 2. BLOQUEAR o jogador (X)
    for (let pattern of winPatterns) {
        let [a, b, c] = pattern;
        if (boardState[a] === "X" && boardState[b] === "X" && boardState[c] === "") return finalizaJogadaIA(c);
        if (boardState[a] === "X" && boardState[c] === "X" && boardState[b] === "") return finalizaJogadaIA(b);
        if (boardState[b] === "X" && boardState[c] === "X" && boardState[a] === "") return finalizaJogadaIA(a);
    }

    // 3. CENTRO
    if (boardState[4] === "") return finalizaJogadaIA(4);

    // 4. ALEATÓRIO
    let availableCells = boardState.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
    if (availableCells.length > 0) {
        const randomIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
        finalizaJogadaIA(randomIndex);
    }
}

function finalizaJogadaIA(index) {
    makeMove(index, "O");
    if (gameActive) currentPlayer = "X";
}

function checkWin(player) {
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
    ];

    let roundWon = winningConditions.some(condition => {
        return condition.every(index => boardState[index] === player);
    });

    if (roundWon) {
        gameActive = false;
        setTimeout(() => alert(`Fim de Jogo! O ${player} venceu!`), 100);
        return;
    }

    if (!boardState.includes("")) {
        gameActive = false;
        setTimeout(() => alert("Empate!"), 100);
    }
}

function resetGame() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";
    cells.forEach(cell => cell.innerText = "");
}