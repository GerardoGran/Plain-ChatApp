# Plain-ChatApp

Simple chat app for p2p communication using socket.io and expressjs

## Run backend

From the parent folder run on the command line

```bash
  node backend/app.js
```

This MUST be done first, the frontend depends on the backend to work properly

## Run frontend

Open the plain html file in any browser.
Insert the other user's IP
One of the two users must press the INIT button to agree on a key

## Send Wrong MAC on purpose

By checking the Incorrect MAC checkbox, the MAC will be modified and the message won't be displayed by the other client.
