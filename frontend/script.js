const ENDPOINT = "http://localhost:2021";

const socket = io(ENDPOINT);

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
