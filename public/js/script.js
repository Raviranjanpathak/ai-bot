console.log("JS LOADED ");

//  GLOBAL STATE
let recognition;
let isListening = false;
let voiceEnabled = false;
let isSpeaking = false;
let forceStop = false;
let currentChatId = null;
let speechLock = false;
let recognitionActive = false;

const wave = document.getElementById("wave");
const micBtn = document.querySelector(".mic-btn");
let voices = [];

speechSynthesis.onvoiceschanged = () => {
  voices = speechSynthesis.getVoices();
};

// Add message
function addMessage(text, sender) {
  const messages = document.getElementById("messages");
  document.getElementById("emptyState").style.display = "none";

  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = formatMessage(text);

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
// ------------Formatting message------------
function formatMessage(text) {
  if (!text) return "";
  // escape first (important)
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  formatted = formatted.replace(/\n/g, "<br>");
  // EMAIL
  formatted = formatted.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    (email) => `<a href="mailto:${email}">${email}</a>`
  );

  // URL
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" target="_blank">${url}</a>`
  );

  return formatted;
}
// ---------cleaning bot rply--------
function cleanTextForSpeech(text) {
  text = text.replace(/([^\x00-\x7F]+)\s+[A-Za-z]+/g, "$1");
  text = text.trim();
  return text;
}

//  Speak
function speak(text) {
  const cleanText = cleanTextForSpeech(text);

  //  HARD STOP mic (mobile fix)
  if (recognition && recognitionActive) {
    try {
      recognition.onend = null;
      recognition.stop();
      recognitionActive = false;
    } catch (e) {}
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = speechSynthesis.getVoices();

  let voice =
    voices.find(v => v.name.includes("Google") && v.name.includes("Female")) ||
    voices.find(v => v.name.includes("Zira")) ||
    voices.find(v => v.lang === "hi-IN") ||
    voices[0];

  utterance.voice = voice;
  utterance.lang = /[\u0900-\u097F]/.test(cleanText) ? "hi-IN" : "en-US";

  utterance.rate = 0.9;
  utterance.pitch = 1.1;

  isSpeaking = true;
  speechLock = true;

  utterance.onend = () => {
    console.log("Speech done");

    setTimeout(() => {
      isSpeaking = false;
      speechLock = false;

      // 🎤 restart mic safely
      if (voiceEnabled && !forceStop) {
        startVoice();
      }
    }, 1200); // 🔥 BIG delay for mobile stability
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

//  Send message
async function sendMessage() {
  const input = document.getElementById("input");
  const typing = document.getElementById("typing");

  const msg = input.value.trim();
  if (!msg) return;

  //  AUTO CREATE CHAT IF NOT EXISTS
  // if (!currentChatId) {
  //   await createNewChat();
  // }
  // ONLY CREATE CHAT IF USER LOGGED IN
  if (!currentChatId && window.isLoggedIn) {
    await createNewChat();
  }

  addMessage(msg, "user");
  input.value = "";

  typing.innerHTML = "AI is typing <span>.</span><span>.</span><span>.</span>";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: msg,
        chatId: window.isLoggedIn ? currentChatId : null
      })
    });

    const data = await res.json();

    typing.innerText = "";

    if (data.error) {
  addMessage("🔐 Please login to continue", "bot");

  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);

  return;
}

    const reply = data.reply || "⚠️ No response";

    addMessage(reply, "bot");

    // refresh sidebar
    loadChats();

    if (voiceEnabled && !forceStop) {
      speak(reply);
    }

  } catch (err) {
    typing.innerText = "";
    addMessage(" Server error", "bot");
  }
}

//  START VOICE
function startVoice() {
  console.log("MIC STARTED");

  forceStop = false;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(" Use Chrome browser");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = true;

  const input = document.getElementById("input");
  const typing = document.getElementById("typing");

  isListening = true;
  voiceEnabled = true;

  recognition.onspeechstart = () => {
  console.log("🎤 User started speaking");

  interruptSpeech(); 
};

  recognition.onstart = () => {
    typing.innerText = "🎤 Listening...";
    micBtn.classList.add("listening");
    wave.classList.remove("hidden");
  };

  recognition.onresult = function (event) {

  //  ignore bot voice
  if (isSpeaking || speechLock) return;

  const text =
    event.results[event.results.length - 1][0].transcript;

  console.log("You said:", text);

  if (forceStop) return;

  input.value = text;

  setTimeout(() => {
    if (!forceStop) sendMessage();
  }, 400);
};

 recognition.onerror = function (event) {
  console.error("Mic error:", event.error);

  let msg = "❌ Mic error";

  if (event.error === "not-allowed") {
    msg = "🎤 Microphone permission denied";
  } else if (event.error === "no-speech") {
    msg = "🎤 No speech detected";
  } else if (event.error === "audio-capture") {
    msg = "🎤 Mic not found or busy";
  }

  document.getElementById("typing").innerText = msg;
};

  recognition.onend = function () {
  recognitionActive = false;

  if (isListening && !forceStop && !speechLock) {
    setTimeout(() => {
      try {
        recognition.start();
        recognitionActive = true;
      } catch (e) {}
    }, 700);
  }
};

  recognition.start();
  recognitionActive = true;
}

//  STOP VOICE
function stopVoice() {
  forceStop = true;

  if (recognition) {
    recognition.onend = null;
    recognition.stop();
  }

  isListening = false;
  voiceEnabled = false;
  isSpeaking = false;

  //  Stop bot speaking
  window.speechSynthesis.cancel();
  //  Remove mic glow
  micBtn.classList.remove("listening");
  const wave = document.getElementById("wave");
  if (wave) {
    wave.classList.add("hidden");
  }
  document.getElementById("typing").innerText = "";
}

//  TOGGLE MIC
function toggleVoice() {
  if (isListening) {
    stopVoice();
  } else {
    startVoice();
  }
}

//------  CREATE NEW CHAT
async function createNewChat() {
  console.log(" New Chat Clicked");

  const res = await fetch("/new-chat", { method: "POST" });
  const chat = await res.json();

  console.log(" New Chat ID:", chat._id);

  currentChatId = chat._id;

  document.getElementById("messages").innerHTML = "";

  openChat(chat);
  loadChats();
}

//----------Loading chats in sidebar-------------
async function loadChats() {
  const res = await fetch("/chats");
  const chats = await res.json();

  const list = document.getElementById("chatList");
  list.innerHTML = "";

  chats.forEach(chat => {
  const div = document.createElement("div");
  div.className = "history-item";

  let title = chat.title;

  if (title === "New Chat" && chat.messages.length > 0) {
    title = chat.messages[0].content.substring(0, 25);
  }

  div.innerText = title;

  //  active highlight
  if (chat._id === currentChatId) {
    div.classList.add("active");
  }

  //  open chat
  div.onclick = () => openChat(chat);

  //  DELETE BUTTON
  const delBtn = document.createElement("span");
  delBtn.innerText = "🗑️";
  delBtn.style.float = "right";
  delBtn.style.cursor = "pointer";

  delBtn.onclick = (e) => {
    e.stopPropagation(); // 
    deleteChat(chat._id);
  };

  div.appendChild(delBtn);

  list.appendChild(div);
});
}

// ----------Open chat on bot page=======
function openChat(chat) {
  currentChatId = chat._id;

  const messages = document.getElementById("messages");
  messages.innerHTML = "";

  const emptyState = document.getElementById("emptyState");

  if (chat.messages && chat.messages.length > 0) {
    emptyState.style.display = "none";

    chat.messages.forEach(msg => {
      addMessage(
        msg.content,
        msg.role === "user" ? "user" : "bot"
      );
    });
  } else {
    emptyState.style.display = "block";
  }
}
// -----------deleting chat--------
async function deleteChat(chatId) {
  if (!confirm("Delete this chat?")) return;

  try {
    await fetch(`/delete-chat/${chatId}`, {
      method: "DELETE"
    });

    //  if deleted chat is active
    if (chatId === currentChatId) {
      currentChatId = null;
      document.getElementById("messages").innerHTML = "";
    }

    loadChats(); // refresh sidebar

  } catch (err) {
    console.error("Delete failed");
  }
}
//  INITIAL LOAD
window.onload = () => {
  loadChats();
};
// -----------sidebar-----------
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");

  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
}

document.addEventListener("click", (e) => {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  const menuBtn = document.querySelector(".menu-btn");

  if (
    sidebar.classList.contains("active") &&
    !sidebar.contains(e.target) &&
    !menuBtn.contains(e.target)
  ) {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
});

// =============image
const imageInput = document.getElementById("imageInput");

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  // show preview in chat
  const imgURL = URL.createObjectURL(file);
  addMessage(`<img src="${imgURL}" style="max-width:200px;">`, "user");

  document.getElementById("typing").innerText = "🤖 Analyzing image...";

  try {
    const res = await fetch("/analyze-image", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    document.getElementById("typing").innerText = "";

    addMessage(data.reply, "bot");

  } catch (err) {
    console.error(err);
    addMessage("Error analyzing image", "bot");
  }
});
// =====intrupting bot in between=============
function interruptSpeech() {
  if (isSpeaking) {
    console.log(" Interrupting bot speech");

    speechSynthesis.cancel();
    isSpeaking = false;
  }
}
// ----------press enter to send message-----
document.getElementById("input").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault(); 
    sendMessage(); 
  }
});