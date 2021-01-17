const USER1_JWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MTA4NjE3MjcsImp0aSI6ImNlNDljZDkwLTU4ODUtMTFlYi1iMDk0LTNkMzgxNjA4MTYyNiIsImV4cCI6MTYxMDk0ODEyNiwiYWNsIjp7InBhdGhzIjp7Ii8qL3VzZXJzLyoqIjp7fSwiLyovY29udmVyc2F0aW9ucy8qKiI6e30sIi8qL3Nlc3Npb25zLyoqIjp7fSwiLyovZGV2aWNlcy8qKiI6e30sIi8qL2ltYWdlLyoqIjp7fSwiLyovbWVkaWEvKioiOnt9LCIvKi9hcHBsaWNhdGlvbnMvKioiOnt9LCIvKi9wdXNoLyoqIjp7fSwiLyova25vY2tpbmcvKioiOnt9fX0sImFwcGxpY2F0aW9uX2lkIjoiMzFkMTc5YWItMzgzNS00YmQyLWFlMjUtZjk5MDgyN2MyZjFmIiwic3ViIjoiVVNFUjFfTkFNRSJ9.gduCFZ_f6DEAwwLBCNxn9DDLExCnrZphxb3P9eG6kdsfjI3Fi8zeiZHGSeDHuN8vDJIYVwiCAJ_Co8hKK_hdVggh6Cgw2CW4fGagxpfsFdfvgX0odCBfhK1k2Ori3uvRku4KR-dIU36HimM3tN3taXQ1R1-OmLbBcZlzdIacgYuAmbSw_Hqgj7-CoCUUTWhsSQix9Xm58cg42Ha2kVw8N94ehwAamgvkUf4BpQlhI-tG5nDL0RNupWVgHsEMsAXh4UdGHdRzf4fWmLl77TwpwtH-cRan2RtQIcpeJ0S79MjOlaLYOJXlOZgDFKVIhn67xcm6PUm9ip5q-UBW2PaseQ';
const USER2_JWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MTA4NjE3NzMsImp0aSI6ImU5OTQ3ZjUwLTU4ODUtMTFlYi04OTg5LWM3ZTI3YjM2ODUwZSIsImV4cCI6MTYxMDk0ODE3MiwiYWNsIjp7InBhdGhzIjp7Ii8qL3VzZXJzLyoqIjp7fSwiLyovY29udmVyc2F0aW9ucy8qKiI6e30sIi8qL3Nlc3Npb25zLyoqIjp7fSwiLyovZGV2aWNlcy8qKiI6e30sIi8qL2ltYWdlLyoqIjp7fSwiLyovbWVkaWEvKioiOnt9LCIvKi9hcHBsaWNhdGlvbnMvKioiOnt9LCIvKi9wdXNoLyoqIjp7fSwiLyova25vY2tpbmcvKioiOnt9fX0sImFwcGxpY2F0aW9uX2lkIjoiMzFkMTc5YWItMzgzNS00YmQyLWFlMjUtZjk5MDgyN2MyZjFmIiwic3ViIjoiVVNFUjJfTkFNRSJ9.OW7_dFM7jQIAfqFItRtYPlPIQS-Pe-NjBoIyKEFvi2RCyjCaFuaLoo0TDXHLvsZaHEHU_aR3z8gVzkDMDRPB_yU7J8yZHi0An2TZmDAj0DjW_V_1BXc3mEOtqWe3D4gPRoT7ZB-CRS1AJHWo-0Hfi3GZopUCCZ4su3xeHrT3POdBNcNDfEFACT9vGethFObOPrzS1T-u172zYaAoWHIcVmtKxBmXCqwoc_HjM0NaPKvsqOPzY9PGxc56UXsMjRKP2VLCsQTh8uSaURSeUtzEJOA8DJxd1HT4hjQMScEQbRjRbjxJWNovCyohGMP3EwulTCVeG3miLMcCONouyb1xqA';
const CONVERSATION_ID = 'CON-1472a48b-0ea2-4df3-ad22-faecf2f3db30';

const messageTextarea = document.getElementById('messageTextarea');
const messageFeed = document.getElementById('messageFeed');
const sendButton = document.getElementById('send');
const loginForm = document.getElementById('login');
const status = document.getElementById('status');

const loadMessagesButton = document.getElementById('loadMessages');
const messagesCountSpan = document.getElementById('messagesCount');
const messageDateSpan = document.getElementById('messageDate');

let conversation;
let listedEvents;
let messagesCount = 0;
let messageDate;

function authenticate(username) {
  if (username == "USER1_NAME") {
    return USER1_JWT;
  }
  if (username == "USER2_NAME") {
    return USER2_JWT;
  }
  alert("User not recognized");
}

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const userToken = authenticate(document.getElementById('username').value);
    if (userToken) {
      document.getElementById('messages').style.display = 'block';
      document.getElementById('login').style.display = 'none';
      run(userToken);
    }
  });
  
  loadMessagesButton.addEventListener('click', async (event) => {
    // Get next page of events
    let nextEvents = await listedEvents.getNext();
    listMessages(nextEvents);
  });
  
  async function run(userToken) {
    let client = new NexmoClient({ debug: true });
    let app = await client.login(userToken);
    conversation = await app.getConversation(CONVERSATION_ID);
    // Update the UI to show which user we are
document.getElementById('sessionName').innerHTML = conversation.me.user.name + "'s messages"

// Load events that happened before the page loaded
  let initialEvents = await conversation.getEvents({ event_type: "text", page_size: 10, order:"desc" });
  listMessages(initialEvents);

    // Any time there's a new text event, add it as a message
    conversation.on('text', (sender, event) => {
        const formattedMessage = formatMessage(sender, event, conversation.me);
        messageFeed.innerHTML = messageFeed.innerHTML +  formattedMessage;
        messagesCountSpan.textContent = `${messagesCount}`;
      });
      // Listen for clicks on the submit button and send the existing text value
sendButton.addEventListener('click', async () => {
    await conversation.sendText(messageTextarea.value);
    messageTextarea.value = '';
  });
  messageTextarea.addEventListener('keypress', (event) => {
    conversation.startTyping();
  });
  
  var timeout = null;
  messageTextarea.addEventListener('keyup', (event) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      conversation.stopTyping();
    }, 500);
  });
  conversation.on("text:typing:on", (data) => {
    if (data.user.id !== data.conversation.me.user.id) {
      status.innerHTML = data.user.name + " is typing...";
    }
  });
  
  conversation.on("text:typing:off", (data) => {
    status.innerHTML = "";
  });
  }

  function listMessages(events) {
    let messages = '';
  
    // If there is a next page, display the Load Previous Messages button
    if (events.hasNext()){
      loadMessagesButton.style.display = "block";
    } else {
      loadMessagesButton.style.display = "none";
    }
  
    // Replace current with new page of events
    listedEvents = events;
  
    events.items.forEach(event => {
      const formattedMessage = formatMessage(conversation.members.get(event.from), event, conversation.me);
      messages = formattedMessage + messages;
    });
  
    // Update UI
    messageFeed.innerHTML = messages + messageFeed.innerHTML;
    messagesCountSpan.textContent = `${messagesCount}`;
    messageDateSpan.textContent = messageDate;
  }

  function formatMessage(sender, message, me) {
    const rawDate = new Date(Date.parse(message.timestamp));
    const formattedDate = moment(rawDate).calendar();
    let text = '';
    messagesCount++;
    messageDate = formattedDate;
  
    if (message.from !== me.id) {
      text = `<span style="color:red">${sender.user.name} (${formattedDate}): <b>${message.body.text}</b></span>`;
    } else {
      text = `me (${formattedDate}): <b>${message.body.text}</b>`;
    }
  
    return text + '<br />';
  
  }