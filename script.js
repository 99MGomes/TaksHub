// ==========================================
// LÓGICA DA LISTA DE TAREFAS
// ==========================================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentEditingId = null;

function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const input = document.getElementById("taskInput");
  const dateInput = document.getElementById("taskDate");
  
  if (!input.value.trim()) return;

  tasks.push({ 
    id: Date.now(), 
    text: input.value.trim(), 
    date: dateInput.value,
    desc: "", // Novo campo para descrição
    done: false 
  });

  input.value = "";
  dateInput.value = "";
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

// --- FUNÇÕES DO MODAL (DESCRIÇÃO) ---
function openModal(id) {
  currentEditingId = id;
  const task = tasks.find(t => t.id === id);
  document.getElementById("taskDesc").value = task.desc || "";
  document.getElementById("descModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("descModal").style.display = "none";
  currentEditingId = null;
}

function saveDescription() {
  if (currentEditingId === null) return;
  const newDesc = document.getElementById("taskDesc").value;
  
  tasks = tasks.map(t => t.id === currentEditingId ? { ...t, desc: newDesc } : t);
  save();
  closeModal();
}

// Fecha o modal se clicar fora da caixinha branca
window.onclick = function(event) {
  const modal = document.getElementById("descModal");
  if (event.target === modal) {
    closeModal();
  }
}

// --- FUNÇÕES DE ARRASTAR E SOLTAR (DRAG AND DROP) ---
let draggedTaskId = null;

function handleDragStart(e, id) {
  draggedTaskId = id;
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  draggedTaskId = null;
}

function handleDragOver(e) {
  e.preventDefault(); // Necessário para permitir o drop
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e, targetId) {
  e.preventDefault();
  if (draggedTaskId === null || draggedTaskId === targetId) return;

  const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
  const targetIndex = tasks.findIndex(t => t.id === targetId);

  // Reordena o array
  const [removedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, removedTask);

  save();
  render();
}

// --- RENDERIZAÇÃO ---
function render() {
  const todo = document.getElementById("todo");
  const done = document.getElementById("done");
  
  todo.innerHTML = "";
  done.innerHTML = "";
  
  tasks.forEach(t => {
    const li = document.createElement("li");
    
    // Configurações de Drag and Drop (apenas para tarefas não concluídas)
    if (!t.done) {
      li.draggable = true;
      li.addEventListener("dragstart", (e) => handleDragStart(e, t.id));
      li.addEventListener("dragend", handleDragEnd);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("drop", (e) => handleDrop(e, t.id));
    }

    // Formatação da data (se existir)
    let dateHtml = "";
    if (t.date) {
      const [ano, mes, dia] = t.date.split("-");
      dateHtml = `<div class="task-date">📅 ${dia}/${mes}/${ano}</div>`;
    }

    li.innerHTML = `
      ${!t.done ? '<div class="drag-handle" title="Segure para arrastar">☰</div>' : ''}
      <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${t.id})">
      
      <div class="task-info">
        <span class="task-text">${t.text}</span>
        ${dateHtml}
      </div>

      <button class="icon-btn" onclick="openModal(${t.id})" title="Adicionar/Ver Descrição">📝</button>
      <button class="icon-btn" onclick="editTask(${t.id})" title="Editar título">✏️</button>
      <button class="icon-btn delete-btn" onclick="deleteTask(${t.id})" title="Excluir tarefa">🗑️</button>
    `;
    
    t.done ? done.appendChild(li) : todo.appendChild(li);
  });
}

document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

render();