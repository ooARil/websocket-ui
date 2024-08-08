let stompClient = null;
let subscriptions = {};

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    $("#subscribe").prop("disabled", !connected || !$("#topic").val().trim());
    $("#send").prop("disabled", !connected || !$("#name").val().trim());

    $("#conversation").toggle(connected);

    // Show the subscription section if there are any active subscriptions
    if (Object.keys(subscriptions).length > 0) {
        $("#subscription-section").show();
    } else {
        $("#subscription-section").hide();
    }
}

function connect() {
    const webSocketUrl = $("#websocket-url").val();

    stompClient = new StompJs.Client({
        brokerURL: webSocketUrl,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
    });

    stompClient.onConnect = (frame) => {
        setConnected(true);
        console.log('Connected: ' + frame);
    };

    stompClient.onWebSocketError = (error) => {
        console.error('Error with websocket', error);
    };

    stompClient.onStompError = (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.deactivate();
    }
    subscriptions = {};
    updateSubscriptionTable();
    setConnected(false);
	$("#conversation").closest('.mb-4').hide();
    console.log("Disconnected");
}

function subscribe() {
    const topic = $("#topic").val().trim();

    if (stompClient && stompClient.connected && !subscriptions[topic]) {
        const subscription = stompClient.subscribe(topic, (message) => {
            console.log("Received message:", message);
            showGreeting(topic, message.body);
        });

        subscriptions[topic] = subscription;
        console.log("Subscribed to topic: " + topic);
        updateSubscriptionTable();
        setConnected(true);
    }
}

function unsubscribe(topic) {
    if (subscriptions[topic]) {
        subscriptions[topic].unsubscribe();
        delete subscriptions[topic];
        console.log("Unsubscribed from topic: " + topic);
        updateSubscriptionTable();
        setConnected(true);
    }
}

function updateSubscriptionTable() {
    const tbody = $("#subscription-table-body");
    tbody.empty();
    for (const topic in subscriptions) {
        tbody.append(`
            <tr>
                <td>${topic}</td>
                <td><button class="btn btn-warning unsubscribe-btn" onclick="unsubscribe('${topic}')">Unsubscribe</button></td>
            </tr>
        `);
    }
}

function sendName() {
    if (stompClient && stompClient.connected) {
        stompClient.publish({
            destination: "/app/16808608-0bb5-4d22-8237-26bbcca1df4d/createMessage",
            body: JSON.stringify({'name': $("#name").val()})
        });
    }
}

function showGreeting(topic, message) {
    // Show the Messages section if it's not already visible
    $("#conversation").closest('.mb-4').show(); // Ensure the container is shown

    $("#greetings").append("<tr><td>" + topic + "</td><td>" + message + "</td></tr>");
}

$(function () {
    $("form").on('submit', (e) => e.preventDefault());
    $("#connect").click(() => connect());
    $("#disconnect").click(() => disconnect());
    $("#subscribe").click(() => subscribe());
    $("#send").click(() => sendName());

    // Initially hide the Messages section
    $("#conversation").closest('.mb-4').hide();

    // Enable subscribe and send buttons when input fields have values and are connected
    $("#topic").on('input', () => setConnected(stompClient && stompClient.connected));
    $("#name").on('input', () => setConnected(stompClient && stompClient.connected));
});