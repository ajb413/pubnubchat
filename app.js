$(function ()
{
  var PUBNUB_demo, clientId;
  var welcomeModal = $('#welcome');
  var username = $('#username');
  var startButton = $('#start');
  var chatModal = $('#chat');
  var messageBox = $('#messageBox');
  var messageInput = $('#messageInput');
  var submitButton = $('#submit');
  var sounds = {
    signon: $('#signon').get(0),
    signoff: $('#signoff').get(0),
    sent: $('#sent').get(0),
    received: $('#received').get(0)
  };

  //hide chat until username is entered
  chatModal.hide();

  //User enters a name
  startButton.on("click", initialize);
  username.on("keypress", function(e)
  {
    e.which === 13 ? initialize() : null; //enter key
  });

  //initialize the pubnub instance and chat after username is selected
  function initialize ()
  {
    //disallow blank user names
    if (!username.val()) return;
    username = username.val();

    //display chat ui
    welcomeModal.remove();
    chatModal.show();

    startPubNub();
    bindUIEvents();
  }

  function startPubNub ()
  {
    //make an id so the app can differentiate who published a message
    clientId = PUBNUB.uuid();

    //intialize pubnub
    PUBNUB_demo = PUBNUB.init({
      publish_key: 'pub-c-648cb7fb-8634-4fb4-a629-474b725d401b',
      subscribe_key: 'sub-c-fa9f5a00-5f64-11e6-bca9-0619f8945a4f',
      uuid: clientId
    });

    //pubnub subscribe
    PUBNUB_demo.subscribe({
      channel: 'msgappdemo',
      message: messageReceived,
      connect: function(){ submitMessage('signon'); },
      disconnect: function(){ submitMessage('signoff'); }
    });

    //get messages from the past 5 minutes (max 100 messages)
    //milliseconds * 10000 to convert to pubnub time
    var fiveMinutesAgo = new Date().getTime()*10000 - 3000000000; 
    
    //pubnub history
    PUBNUB_demo.history({
      channel: 'msgappdemo',
      end: fiveMinutesAgo,
      callback: function (history) {
        writeMessageHistory(history[0]);
      }
    });
  }

  function bindUIEvents ()
  {
    //send a sign off message before leaving
    $(window).on("beforeunload", function ()
    {
      submitMessage('signoff');
    });

    submitButton.on("click", function ()
    {
      submitMessage('sent');
    });
    
    messageInput.on("keypress", function(e)
    {
      e.which === 13 ? submitMessage('sent') : null; //enter key
    });
  }

  function messageReceived (message)
  {
    //if the message is not from this client, change it to recieved
    if (message.uuid !== clientId && message.type === 'sent')
    {
      message.type = 'received';
    }

    //create the HTML that represents the message
    var messageComponent = createMessageComponent(message);
    //add the new message to the chat modal
    messageBox.append(messageComponent);
    //scroll the div down as messages are added
    messageBox.scrollTop(messageBox.prop("scrollHeight"));
  }

  function submitMessage (type)
  {
    var newMessage = {
      "user": username,
      "time": new Date().getTime(),
      "text": messageInput.val(),
      "type": type,
      "uuid": clientId
    };

    //pubnub publish
    PUBNUB_demo.publish({
      channel: 'msgappdemo',
      message: newMessage
    });

    //clear the textbox
    messageInput.val("");
  }

  function createMessageComponent (message)
  {
    if (!message.type)
    {
      console.error("Message type missing.");
      return;
    }

    //make a div that contains the sn, message, and time in a tooltip
    var currentTime = new Date(message.time).toLocaleString();
    var messageComponent = $('<div>', {
      'class': 'messageComponent',
      'title': currentTime
    });
    var screenNameComponent = $('<div>', {
      'class': 'screenName ' + message.type,
      'text': message.user + ": "
    });
    var messageTextComponent = $('<div>', {
      'text': message.text
    });

    if (message.type === "signon")
    {
      screenNameComponent.get(0).innerHTML += "signed on at " + currentTime;
    }

    if (message.type === "signoff")
    {
      screenNameComponent.get(0).innerHTML += "signed off at " + currentTime;
    }

    //reset and play the sound for this message type
    sounds[message.type].currentTime = 0;
    sounds[message.type].play();

    //put together the HTML components
    messageComponent
      .append(screenNameComponent)
      .append(messageTextComponent);

    return messageComponent;
  }

  function writeMessageHistory (historyResponse)
  {
    historyResponse.forEach(function(messageObject)
    {
      messageReceived(messageObject);
    });
  }
});