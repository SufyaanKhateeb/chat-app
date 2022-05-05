const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    // getting last message element
    const $lastMessage = $messages.lastElementChild;

    // Height of the last message element
    const lastMessageStyles = getComputedStyle($lastMessage);
    const lastMessageMargin = parseInt(lastMessageStyles.marginBottom);
    const lastMessageHeight = $lastMessage.offsetHeight + lastMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - lastMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm A"),
        color: message.color
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

// function to check if message is a url
function isValidURL(str) {
    var a = document.createElement("a");
    a.href = str;
    return a.host && a.host != window.location.host;
}

socket.on("updateComm", (message) => {
    if (message.text === "$clear") {
        $messages.innerHTML = "";
        return;
    }
    if (message.text === "monkeytype") {
        window.open("https://monkeytype.com/", "_blank");
        return;
    }
    if (message.text === "typeracer") {
        window.open("https://typeracer.com", "_blank");
        return;
    }

    // inserting link tag if the message is url
    if (isValidURL(message.text)) {
        message.url = message.text;
        message.text = "";
    }

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm A"),
        color: message.color
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = e.target.elements.message.value;

    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        e.target.elements.message.value = "";

        if (error) return alert(error);
        console.log("Message has been delivered.");
    });
});

$locationButton.addEventListener("click", () => {
    if (!navigator.geolocation)
        return alert("Geolocation is not supported by your browser.");

    $locationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position = {}) => {
        socket.emit(
            "sendLocation",
            {
                lat: position.coords.latitude,
                long: position.coords.longitude,
            },
            (message) => {
                $locationButton.removeAttribute("disabled");
                console.log(message);
            }
        );
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});

// for responsiveness
function myFunction(x) {
    if (x.matches) {
        // If media query matches
        const sendIcon = document.createElement("img");
        sendIcon.src = "/img/send.svg";
        sendIcon.setAttribute("width", "15");
        sendIcon.setAttribute("height", "15");
        const locationIcon = document.createElement("img");
        locationIcon.src = "/img/location.svg";
        locationIcon.setAttribute("width", "15");
        locationIcon.setAttribute("height", "15");
        document.querySelector('#send-button').replaceChildren(sendIcon)
        document.querySelector('#send-location').replaceChildren(locationIcon)
    } else {
    }
}

var x = window.matchMedia("(max-width: 700px)");
myFunction(x); // Call listener function at run time
x.addListener(myFunction); // Attach listener function on state changes
