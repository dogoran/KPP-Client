function serverRequest(method, url, sendData, callback) {
  const xmr = new XMLHttpRequest();

  xmr.onreadystatechange = function() {
    if (this.readyState !== 4) {
      return;
    }

    if (this.status !== 200) {
      const response = {};

      response.successful = false;
      response.resposeText = 'ERROR: '
      + (this.status ? this.statusText : 'request failed');

      return;
    }

    if (this.readyState === 4) {
      const response = {};

      response.successful = true;
      callback(sendData);
    }
  };

  xmr.open(method, url);
  xmr.setRequestHeader('Content-Type', 'application/json');
  xmr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xmr.send(JSON.stringify(sendData));
}

function parseForm() {
  const sendData = {};
  const formFields = form.childNodes;

  formFields.forEach((field) => {
    if (field.tagName === 'INPUT') {
      sendData[field.name] = field.value;
    }
  });

  serverRequest('POST', 'http://18.225.6.26/api/auth/register', sendData, setWesocket);
}

function setupEventListeners() {
  const register = document.getElementById('register');
  const formWrapper = document.getElementById('reg-form');
  const form = document.getElementById('reg-form-fields');

  formWrapper.addEventListener('submit', (event) => event.preventDefault());

  register.addEventListener('click', parseForm);
}

function removeRegForm() {
  document.getElementById('reg-form').remove();

  messagesForm.style.display = 'block';
}

function setWesocket(userData) {
  const socket = new WebSocket("ws://18.225.6.26:8091/");

  const sendData = {
    command: 'login',
    email: userData.email,
    password: userData.password,
  };

  socket.onopen = () => {
    socket.send(JSON.stringify(sendData));
  };


  socket.onmessage = function(event) {
    const incomingMessage = JSON.parse(event.data);

    if (incomingMessage.type === 'token') {
      removeRegForm();

      register.addEventListener('click', parseForm);

      window.token = incomingMessage.token;
      const sendMessageButt = document.getElementById('sendMessageButton');

      sendMessageButt.addEventListener('click', () => {

        const text = sendMessageInput.value;
        sendMessageInput.value = '';

        const sendData = {
          command: "message",
          message: text,
          token: window.token,
        };

        socket.send(JSON.stringify(sendData));
      });

      const mess = JSON.parse(incomingMessage.messages);
      for (let index = mess.length - 1; index >= 0; index--) {
        showMessage(mess[index]);
      }

      return;
    }

    showMessage(incomingMessage);
  };

  function showMessage(message) {
    const messageElem = document.createElement('p');
    messageElem.className = 'messages__item-response';

    const messageInfo = document.createElement('span');
    messageInfo.className = 'messages__item-info';

    messageElem.appendChild(document.createTextNode(message.message));
    messageInfo.appendChild(document.createTextNode(message.name +
    ' - ' + message.date));

    messageElem.appendChild(messageInfo);

    document.getElementById('messages').appendChild(messageElem);
    messages.scrollTop = messages.scrollHeight;
  }
}

setupEventListeners();
