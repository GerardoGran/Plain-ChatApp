const ENDPOINT = "http://localhost:2021";

const socket = io(ENDPOINT);

// Connect Modal

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

  fetch(`${ENDPOINT}/conectar?host=http://${ip}`).then((response) => {
    console.log(response);
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
    // Check valid message
    const newMessage = {
      received: false,
      message: messageText,
    };

    // setSentMessage(true);
    // setSentText(messageText);

    document.querySelector("#chat-input").value = "";
    let data = JSON.stringify({ function: "1", data: messageText });

    fetch(`${ENDPOINT}/enviar_mensaje`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    messages.push(newMessage);
    console.table(messages);
    renderChat();
  }
});

// Socket logic

socket.on("Mensaje ASCP", (msgObj) => {
  const msg = msgObj.data;
  console.log(`Received Message: ${msg}`);
  // if (msg === sentText && sentMessage) {
  const newMessage = {
    received: true,
    message: msg,
  };
  messages.push(newMessage);
  // setSentMessage(false);
  // } else {
  //   console.log(`RECEIVED ${msg}`);
  //   const newMessage: Message = {
  //     received: true,
  //     // received: false,
  //     message: msg,
  //   } as Message;
  //   setMessages([...messages, newMessage]);
  // }
});
