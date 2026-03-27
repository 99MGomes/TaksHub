// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const supabaseUrl = 'https://oobqohznlecgyahysyoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYnFvaHpubGVjZ3lhaHlzeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQ3MzEsImV4cCI6MjA4OTg1MDczMX0.8N0XvDCRnfV-HKOo60vJjlMvr2Tczk-uIer32dGY4Z4';

// NOME ALTERADO AQUI PARA EVITAR CONFLITO:
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let usuarioAtual = null;
let tasks = [];
let currentEditingId = null;

// ==========================================
// 1. LOGIN E SESSÃO
// ==========================================
window.onload = async function() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    usuarioAtual = session.user;
    mostrarAplicativo();
  }
};

async function fazerLogin() {
  const email = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!email || !pass) {
    alert("Preencha e-mail e senha!");
    return;
  }

  let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });

  if (error) {
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ email, password: pass });
    if (signUpError) {
      alert("Erro: " + signUpError.message);
      return;
    }
    data = signUpData;
    alert("Conta criada com sucesso!");
  }

  usuarioAtual = data.user;
  mostrarAplicativo();
}

async function sair() {
  await supabaseClient.auth.signOut();
  location.reload();
}

function mostrarAplicativo() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "flex";
  document.getElementById("saudacao").innerText = `Tarefas de ${usuarioAtual.email.split('@')[0]}`;
  buscarTarefas();
}

// ==========================================
// 2. TAREFAS
// ==========================================
async function buscarTarefas() {
  const { data, error } = await supabaseClient
    .from('tarefas')
    .select('*')
    .order('id', { ascending: true });

  if (!error) {
    tasks = data || [];
    render();
  }
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const dateInput = document.getElementById("taskDate");
  const texto = input.value.trim();
  
  if (!texto || !usuarioAtual) return;

  const novaTarefa = {
    user_id: usuarioAtual.id,
    text: texto,
    data_entrega: dateInput.value || null,
    descricao: "",
    concluida: false
  };

  const { data, error } = await supabaseClient.from('tarefas').insert([novaTarefa]).select();

  if (!error && data) {
    tasks.push(data[0]);
    input.value = "";
    dateInput.value = "";
    render();
  }
}

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const novoStatus = !task.concluida;
  const { error } = await supabaseClient.from('tarefas').update({ concluida: novoStatus }).eq('id', id);

  if (!error) {
    task.concluida = novoStatus;
    render();
  }
}

async function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  const newText = prompt("Edite a sua tarefa:", task.text);
  if (newText) {
    const { error } = await supabaseClient.from('tarefas').update({ text: newText.trim() }).eq('id', id);
    if (!error) {
      task.text = newText.trim();
      render();
    }
  }
}

async function deleteTask(id) {
  if (confirm("Excluir esta tarefa?")) {
    const { error } = await supabaseClient.from('tarefas').delete().eq('id', id);
    if (!error) {
      tasks = tasks.filter(t => t.id !== id);
      render();
    }
  }
}

// ==========================================
// 3. MODAL E RENDER
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
  const { error } = await supabaseClient.from('tarefas').update({ descricao: newDesc }).eq('id', currentEditingId);

  if (!error) {
    const task = tasks.find(t => t.id === currentEditingId);
    if (task) task.descricao = newDesc;
    closeModal();
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
    let dateHtml = t.data_entrega ? `<div class="task-date">📅 ${t.data_entrega.split('-').reverse().join('/')}</div>` : "";

    li.innerHTML = `
      <input type="checkbox" ${t.concluida ? "checked" : ""} onchange="toggleTask(${t.id})">
      <div class="task-info">
        <span class="task-text">${t.text}</span>
        ${dateHtml}
      </div>
      <button class="icon-btn" onclick="openModal(${t.id})">📝</button>
      <button class="icon-btn" onclick="editTask(${t.id})">✏️</button>
      <button class="icon-btn" onclick="deleteTask(${t.id})">🗑️</button>
    `;
    t.concluida ? done.appendChild(li) : todo.appendChild(li);
  });
}

document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});
