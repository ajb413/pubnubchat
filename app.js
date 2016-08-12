$(function ()
{
	var PUBNUB_demo;
	var welcomeModal = $('#welcome');
	var username = $('#username');
	var startButton = $('#start');
	var chatModal = $('#chat');

	//hide chat until username is selected
	chatModal.hide()

	//User enters a name
	startButton.on("click", initialize);
	username.keypress(function(e)
	{
		if (e.which === 13)
		{
			e.preventDefault();
			initialize();
		}
	});

	var messageInput = $('#messageInput');
	var submitButton = $('#submit');

	//initialize the pubnub instance and chat after username is selected
	function initialize ()
	{
		//collect the username
		username = username.val();

		//remove the welcome modal
		welcomeModal.remove();

		//show the chat
		chatModal.show();

		//intialize pubnub
		PUBNUB_demo = PUBNUB.init({
			publish_key: 'pub-c-648cb7fb-8634-4fb4-a629-474b725d401b',
			subscribe_key: 'sub-c-fa9f5a00-5f64-11e6-bca9-0619f8945a4f'
		});

		//pubnub subscribe
		PUBNUB_demo.subscribe({
			channel: 'msgappdemo',
			message: messageReceived
		});

		//get message from the past 5 minutes (max 100 messages)
		var now = new Date().getTime();
		var fiveMinutesAgo = now - 300000;
		PUBNUB_demo.history({
			channel: 'msgappdemo',
			start: fiveMinutesAgo,
			end: now,
			callback: writeMessageHistory
		});

		submitButton.on("click", submitMessage);
		messageInput.keypress(function(e)
		{
			if (e.which === 13)
			{
				e.preventDefault();
				submitMessage();
			}
		});

	}

	function messageReceived (message)
	{
		//create the HTML that represents the message on the screen
		var messageComponent = createMessageComponent(message);

		//add the new message to the chat modal
		chatModal.append(messageComponent);
	}

	function submitMessage ()
	{
		var newMessage = {
			"user": username,
			"time": new Date().getTime(),
			"text": messageInput.val()
		}

		//pubnub publish
		PUBNUB_demo.publish({
			channel: 'msgappdemo',
			message: newMessage
		});
	}

	function createMessageComponent (message)
	{
		//make a div that contains the message time, user, and content
		var messageComponent = $('<div>');
		messageComponent.text("At " + new Date(message.time).toString() + ", " + message.user + " says: " + message.text);
		return messageComponent;
	}

	function writeMessageHistory (historyResponse)
	{
		for (var i=0; i<historyResponse[0].length; i++)
		{
			messageReceived(historyResponse[0][i]);
		}
	}

});