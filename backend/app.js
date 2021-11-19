const app = require("express")();
const { ok } = require("assert");
const bodyParser = require("body-parser");

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

io.on("connection", (socket) => {
  socket.on("Mensaje ASCP", (msg) => {
    console.log("Se recibio un mensaje: ", msg);
    io.emit("Mensaje ASCP", msg);

    if (msg.function === "1") {
      mensajes.push(msg);
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

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
  // res.sendStatus(200);
  res.send("Mensaje: " + req.body.data);
  socketOut.emit("Mensaje ASCP", req.body);
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
