const app = require("express")();
const { ok } = require("assert");
const bodyParser = require("body-parser");
const express = require('express');
const crypto = require("crypto")

// Servidor HTTP
const http = require("http").Server(app);

// Servidor para socket.io, aquí RECIBIMOS mensajes
// Nos aseguramos que podemos recibir referencias cruzadas
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// CORS settings
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Use this after the variable declaration

// Se almacenan los mensajes recibidos
var mensajes = [];

const messageDict = {SIMP_INIT_COMM: 2, SIMP_KEY_COMPUTED: 3};
const a = 17123207n;
const q = 2426697107n;

var pass = "";
var ownX = 0n;
var foreignY = 0n;

BigInt.prototype.toJSON = function() { return this.toString()  }

io.on("connection", (socket) => {
  socket.on('enviar-mensaje', (msg) => {
    socket.emit("Mensaje ASCP", msg);
  });

  socket.on("Mensaje ASCP", (msgObj) => {
    const msg = msgObj.data;

    if (msgObj.function === 1) {
      const decryptedMsg = decryptMessage(msg, pass);
      
      socket.broadcast.emit("receive-msg", {
        function: 1,
        data: decryptedMsg
      });
    }
    else if (msgObj.function === 2) {
      let data = calculateDiffieHellman(messageDict.SIMP_KEY_COMPUTED);

      foreignY = BigInt(msg.y);
      pass = modExp(foreignY, ownX, q).toString().substring(0, 8);
      console.log("SIMP_INIT_COMM: " + pass);

      socket.broadcast.emit("set-key", data);
    }
    else if (msgObj.function === 3) {
      foreignY = BigInt(msg.y);
      pass = modExp(foreignY, ownX, q).toString().substring(0, 8);

      console.log("SIMP_KEY_COMPUTED: " + pass);
    }
  });
});

// Cliente
const ioc = require("socket.io-client");

const port = 2021;

// Se usa para ENVIAR mensajes
var socketOut = null;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Permitimos JSON
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(express.raw());

app.post("/test", (req, res) => {
  console.log("Got body:", req.body);
  res.sendStatus(200);
});

// Conectar a otro host
app.get("/conectar", (req, res) => {
  console.log(req.query.host);
  res.send("Host " + req.query.host);
  socketOut = ioc.connect(req.query.host);
  console.log(socketOut);
});

// Enviar mensaje al host al que se encuentra conectado
app.get("/enviar_mensaje", (req, res) => {
  res.send("Mensaje " + req.query.msg);
  socketOut.emit("Mensaje ASCP", req.query.msg);
});

//Enviar mensaje al host al que se encuentra conectado
app.post("/enviar_mensaje", (req, res) => {
  console.log("Got body:", req.body);
  res.send("Mensaje: " + req.body.data);

  if (req.body.function === 1) {
    let newBody = {
      function: req.body.function,
      data: encryptMessage(req.body.data, pass)
    }
    socketOut.emit("Mensaje ASCP", newBody);
  } else {
    socketOut.emit("Mensaje ASCP", req.body);
  }
});

app.get("/diffie", (req, res) => {
  let data = calculateDiffieHellman(messageDict.SIMP_INIT_COMM);
  socketOut.emit("Mensaje ASCP", data)
});

// Obtener el último mensaje
app.get("/obtener_ultimo_mensaje", (req, res) => {
  res.send("Ultimo: " + mensajes[mensajes.length - 1]);
});

// Obtener todos los mensajes
app.get("/mensajes", (req, res) => {
  res.send(mensajes);
});

// Escuchar en el puerto especificado en la línea de comandos
http.listen(port, () => {
  console.log(`Escuchando en http://localhost:${port}/`);
});

// Encryption
const encryptMessage = (plainText, key) => {
  if (key === null) {
    return plainText;
  }

  var keyBuffer = Buffer.from(key.toString().substring(0, 8), "utf-8");
  var cipher = crypto.createCipheriv("des-ecb", keyBuffer, "");
  var c = cipher.update(plainText, "utf8", "base64");
  c += cipher.final("base64");

  return c;
};

const decryptMessage = (cipherText, key) => {
  if (key === null) {
    return cipherText;
  } 

  const keyBuffer = Buffer.from(key.toString().substring(0, 8), "utf-8");
  const cipher = crypto.createDecipheriv("des-ecb", keyBuffer, "");
  let c = cipher.update(cipherText, "base64", "utf8");

  try {
    c += cipher.final("utf8");
  } catch (e) {
    console.error(e);
    return "Could not decrypt ciphertext: " + cipherText;
  }

  return c;
};

// Diffie-Hellman functions
const calculateDiffieHellman = (messageValue) => {
  ownX = generateRandomBigInt(0n, q);
  const y = modExp(a, ownX, q);

  return { function: messageValue, data: {q: Number(q), a: Number(a), y: Number(y)}};
}

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
