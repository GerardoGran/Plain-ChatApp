const ENDPOINT = "http://localhost:2021";

const socket = io(ENDPOINT);

var pass = "";

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

  pass = document.querySelector("#pass-input").value;
  if (/\s/.test(pass) && pass === undefined) {
    alert(
      `${pass} is not a valid passphrase\nPlease insert a non-empty string.`
    );
    return false;
  }

  fetch(`${ENDPOINT}/conectar?host=http://${ip}:2021`).then((response) => {
    console.log(response.json());
  });

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
    // Encrypt message
    const encryptedMsg = encryptMessage(messageText, pass);

    // Check valid message
    const newMessage = {
      received: false,
      message: messageText,
    };

    document.querySelector("#chat-input").value = "";
    let data = JSON.stringify({ function: "1", data: encryptedMsg });

    fetch(`${ENDPOINT}/enviar_mensaje`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: data,
    }).then((res) => console.table(res));

    messages.push(newMessage);
    console.table(messages);
    renderChat();
  }
});

// Socket logic

socket.on("connect", () => {
  console.log(socket.id);
});

socket.on("Mensaje ASCP", (msgObj) => {
  const msg = msgObj.data;
  console.log(`Received Encrypted Message: ${msg}`);
  const decryptedMsg = decryptMsg(msg, pass);
  const newMessage = {
    received: true,
    message: decryptedMsg,
  };
  messages.push(newMessage);
  renderChat();
});

// Encryption

const encryptMessage = (msg, key) => {
  return CryptoJS.DES.encrypt(msg, key);
};

const decryptMsg = (msg, key) => {
  return CryptoJS.DES.decrypt(msg, key);
};
