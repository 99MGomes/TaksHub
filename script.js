// ==========================================
// CONFIGURAÇÃO DO SUPABASE (BANCO DE DADOS)
// ==========================================
const supabaseUrl = 'https://oobqohznlecgyahysyoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYnFvaHpubGVjZ3lhaHlzeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ3MzEsImV4cCI6MjA4OTg1MDczMX0.8N0XvDCRnfV-HKOo60vJjlMvr2Tczk-uIer32dGY4Z4';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
let usuarioAtual = null;
let tasks = [];
let currentEditingId = null;

// ==========================================
// 1. LÓGICA DE LOGIN E SESSÃO
// ==========================================
window.onload = async function() {
  // Verifica se já existe alguém logado quando a página abre
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    usuarioAtual = session.user;
    mostrarAplicativo();
  }
};

async function fazerLogin() {
  const email = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (email === "" || pass === "") {
    alert("Por favor, preencha seu e-mail e senha!");
    return;
  }

  // Tenta logar
  let { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });

  // Se der erro, tenta criar a conta
  if (error) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: pass });
    if (signUpError) {
      alert("Erro: " + signUpError.message);
      return;
    }
    data = signUpData;
    alert("Conta criada com sucesso! Bem-vindo!");
  }

  usuarioAtual = data.user;
  mostrarAplicativo();
}

async function sair() {
  await supabase.auth.signOut();
  location.reload(); // Recarrega a página para voltar à tela de login
}

function mostrarAplicativo() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "flex";
  document.getElementById("saudacao").innerText = `Tarefas de ${usuarioAtual.email.split('@')[0]}`;
  
  // Assim que logar, busca as tarefas do banco de dados
  buscarTarefas();
}

// ==========================================
// 2. LÓGICA DE TAREFAS (COM BANCO DE DADOS)
// ==========================================

// Busca as tarefas lá no Supabase
async function buscarTarefas() {
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .order('id', { ascending: true }); // Ordena pelas mais antigas primeiro

  if (error) {
    console.error("Erro ao buscar tarefas:", error);
    return;
  }

  tasks = data || [];
  render();
}

// Adiciona uma nova tarefa
async function addTask() {
  const input = document.getElementById("taskInput");
  const dateInput = document.getElementById("taskDate");
  const texto = input.value.trim();
  
  if (!texto) return;

  const novaTarefa = {
    user_id: usuarioAtual.id,
    text: texto,
    data_entrega: dateInput.value || null,
    descricao: "",
    concluida: false
  };

  const { data, error } = await supabase.from('tarefas').insert([novaTarefa]).select();

  if (!error && data) {
    tasks.push(data[0]); // Adiciona a tarefa devolvida pelo banco na lista
    input.value = "";
    dateInput.value = "";
    render();
  }
}

// Marca como concluída ou não
async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const novoStatus = !task.concluida;
  
  const { error } = await supabase.from('tarefas').update({ concluida: novoStatus }).eq('id', id);

  if (!error) {
    task.concluida = novoStatus;
    render();
  }
}

// Edita o título da tarefa
async function editTask(id) {
  const taskToEdit = tasks.find(t => t.id === id);
  if (!taskToEdit) return;
  
  const newText = prompt("Edite a sua tarefa:", taskToEdit.text);
  if (newText !== null && newText.trim() !== "") {
    
    const { error } = await supabase.from('tarefas').update({ text: newText.trim() }).eq('id', id);
    
    if (!error) {
      taskToEdit.text = newText.trim();
      render();
    }
  }
}

// Exclui a tarefa
async function deleteTask(id) {
  if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id);
    
    if (!error) {
      tasks = tasks.filter(t => t.id !== id);
      render();
    }
  }
}

// ==========================================
// 3. FUNÇÕES DO MODAL (DESCRIÇÃO)
// ==========================================
function openModal(id) {
  currentEditingId = id;
  const task = tasks.find(t => t.id === id);
  document.getElementById("taskDesc").value = task.descricao || "";
  document.getElementById("descModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("descModal").style.display = "none";
  currentEditingId = null;
}

async function saveDescription() {
  if (currentEditingId === null) return;
  const newDesc = document.getElementById("taskDesc").value;
  
  const { error } = await supabase.from('tarefas').update({ descricao: newDesc }).eq('id', currentEditingId);

  if (!error) {
    const task = tasks.find(t => t.id === currentEditingId);
    if (task) task.descricao = newDesc;
    closeModal();
    render();
  }
}

window.onclick = function(event) {
  const modal = document.getElementById("descModal");
  if (event.target === modal) closeModal();
}

// ==========================================
// 4. ARRASTAR E SOLTAR (DRAG AND DROP)
// ==========================================
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
  e.preventDefault(); 
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e, targetId) {
  e.preventDefault();
  if (draggedTaskId === null || draggedTaskId === targetId) return;

  const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
  const targetIndex = tasks.findIndex(t => t.id === targetId);

  // Reordena localmente na tela
  const [removedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, removedTask);
  
  render();
}

// ==========================================
// 5. RENDERIZAÇÃO
// ==========================================
function render() {
  const todo = document.getElementById("todo");
  const done = document.getElementById("done");
  
  todo.innerHTML = "";
  done.innerHTML = "";
  
  tasks.forEach(t => {
    const li = document.createElement("li");
    
    if (!t.concluida) {
      li.draggable = true;
      li.addEventListener("dragstart", (e) => handleDragStart(e, t.id));
      li.addEventListener("dragend", handleDragEnd);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("drop", (e) => handleDrop(e, t.id));
    }

    let dateHtml = "";
    if (t.data_entrega) {
      const [ano, mes, dia] = t.data_entrega.split("-");
      dateHtml = `<div class="task-date">📅 ${dia}/${mes}/${ano}</div>`;
    }

    li.innerHTML = `
      ${!t.concluida ? '<div class="drag-handle" title="Segure para arrastar">☰</div>' : ''}
      <input type="checkbox" ${t.concluida ? "checked" : ""} onchange="toggleTask(${t.id})">
      
      <div class="task-info">
        <span class="task-text">${t.text}</span>
        ${dateHtml}
      </div>

      <button class="icon-btn" onclick="openModal(${t.id})" title="Adicionar/Ver Descrição">📝</button>
      <button class="icon-btn" onclick="editTask(${t.id})" title="Editar título">✏️</button>
      <button class="icon-btn delete-btn" onclick="deleteTask(${t.id})" title="Excluir tarefa">🗑️</button>
    `;
    
    t.concluida ? done.appendChild(li) : todo.appendChild(li);
  });
}

document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});
