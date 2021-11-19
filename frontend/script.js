const ENDPOINT = "http://localhost:2021";

const socket = io(ENDPOINT);

BigInt.prototype.toJSON = function() { return this.toString()  }

const a = 17123207n;

const q = 2426697107n;

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
    });

    messages.push(newMessage);
    renderChat();
  }
});

$("#init-form").submit((e) => {
  // Initiates Diffie-Hellman key exchange
  e.preventDefault();

  const x = generateRandomBigInt(0n, q);
  const y = modExp(a, x, q);

  let numbers = JSON.stringify({q: q, a: a, y: y})
  let data = JSON.stringify({ function: "2", data: numbers})
  
  fetch(`${ENDPOINT}/enviar_mensaje`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: data,
  });

});

// Socket logic
socket.on("connect", () => {
  console.log(socket.id);
});

socket.on("Mensaje ASCP", (msgObj) => {
  const msg = msgObj.data;
  console.log(`Received Encrypted Message: ${msg}`);
  const decryptedMsg = decryptMessage(msg, pass);
  console.log(`Plaintext Message ${decryptedMsg}`);
  const newMessage = {
    received: true,
    message: decryptedMsg,
  };
  messages.push(newMessage);
  renderChat();
});

// Encryption
const encryptMessage = (msg, key) => {
  return CryptoJS.DES.encrypt(msg, key).toString();
};

const decryptMessage = (msg, key) => {
  return CryptoJS.DES.decrypt(msg, key).toString(CryptoJS.enc.Utf8);
};

// Diffie-Hellman functions
const modExp = function (base, exponent, modulus) {
  base = base % modulus;
  var result = 1n;
  var x = base;
  while (exponent > 0) {
      var leastSignificantBit = exponent % 2n;
      exponent = exponent / 2n;
      if (leastSignificantBit == 1n) {
          result = result * x;
          result = result % modulus;
      }
      x = x * x;
      x = x % modulus;
  }
  return result;
};

const generateRandomBigInt = function (lowBigInt, highBigInt) {
  if (lowBigInt >= highBigInt) {
    throw new Error('lowBigInt must be smaller than highBigInt');
  }

  const difference = highBigInt - lowBigInt;
  const differenceLength = difference.toString().length;
  let multiplier = '';
  while (multiplier.length < differenceLength) {
    multiplier += Math.random()
      .toString()
      .split('.')[1];
  }
  multiplier = multiplier.slice(0, differenceLength);
  const divisor = '1' + '0'.repeat(differenceLength);
  const randomDifference = (difference * BigInt(multiplier)) / BigInt(divisor);

  return lowBigInt + randomDifference;
}
