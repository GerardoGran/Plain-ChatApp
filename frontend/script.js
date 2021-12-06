const ENDPOINT = "http://localhost:2021";
const socket = io(ENDPOINT);

const messageDict = { SIMP_INIT_COMM: 2, SIMP_KEY_COMPUTED: 3 };
const a = 17123207n;
const q = 2426697107n;

var pass = "";
var ownX = 0n;
var foreignY = 0n;

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Connect and Pass Modal
$(window).on("load", () => {
  // Show modal on page load
  $("#connection-modal").modal("show");
});

$("#ip-form").submit(function (e) {
  // Hides modal, calls get /connect?host="{ip}"
  e.preventDefault();

  const ip = document.querySelector("#ip-input").value;

  if (!validateIP(ip)) {
    alert(`${ip} is not a valid IP\nXXX.XXX.XXX.XXX`);
    return false;
  }

  fetch(`${ENDPOINT}/conectar?host=http://${ip}:2021`);

  $("#connection-modal").modal("hide");
});

const validateIP = (ip) => {
  // Validates IP against regex
  return /^(?:[\d]{1,3}\.){3}[\d]{1,3}$/.test(ip);
};

// Messages
let messages = [];

const renderChat = () => {
  // Updates Chat Window
  let nHTML = "";
  messages.forEach((msg) => {
    nHTML +=
      `<div class=${msg.received ? "received-text" : "sent-text"}>` +
      msg.message +
      "</div>";
  });

  let chatWindow = document.getElementById("chat-window");
  chatWindow.innerHTML = nHTML;
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

$("#chat-form").submit((e) => {
  // Send Message
  e.preventDefault();

  const messageText = document.querySelector("#chat-input").value;

  if (/\S/.test(messageText) && messageText !== undefined) {
    // Check valid message
    const newMessage = {
      received: false,
      message: messageText,
    };

    document.querySelector("#chat-input").value = "";
    let data = JSON.stringify({ function: 1, data: messageText });
    let badMAC = document.getElementById("MAC-check").checked;

    if (!badMAC) {
      fetch(`${ENDPOINT}/enviar_mensaje`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: data,
      });
    } else {
      fetch(`${ENDPOINT}/enviar_mal`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: data,
      });
    }

    messages.push(newMessage);
    renderChat();
  }
});

$("#init-form").submit((e) => {
  // Initiates Diffie-Hellman key exchange
  e.preventDefault();

  fetch(`${ENDPOINT}/diffie`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
});

// Socket logic
socket.on("connect", () => {
  console.log(socket.id);
});

socket.on("set-key", (msgObj) => {
  console.log(msgObj);

  fetch(`${ENDPOINT}/enviar_mensaje`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msgObj),
  });
});

socket.on("receive-msg", (msgObj) => {
  const msg = msgObj.data;
  console.log(msgObj);

  const newMessage = {
    received: true,
    message: msg,
  };

  messages.push(newMessage);
  renderChat();
});

socket.on("wrong-mac", () => {
  window.alert("Mismatch in MAC! Be careful!");
});
