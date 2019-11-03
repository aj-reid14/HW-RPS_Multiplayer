var firebaseConfig = {
    apiKey: "AIzaSyA6pCTHavcLWKgngWrzWBOLcUXTveCDD9Y",
    authDomain: "rps-multiplayer-7d6d7.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-7d6d7.firebaseio.com",
    projectId: "rps-multiplayer-7d6d7",
    storageBucket: "rps-multiplayer-7d6d7.appspot.com",
    messagingSenderId: "337347504629",
    appId: "1:337347504629:web:7707bf3251b547a3b758bc"
};

firebase.initializeApp(firebaseConfig);
let database = firebase.database();
let connectionsRef = database.ref("/connections");
let connectedRef = database.ref(".info/connected");

let mode;
let onlineMSGS = [];
let players = [];

$(document).ready(function () {

    SwitchPage("home");
    ConfigureButtons();
    ConfigureFirebase();
})

function ConfigureFirebase() {

    database.ref().set({
        connected: null
    })

    connectedRef.on("value", function(snapshot) {
        if (snapshot.val())
        {
            let con = connectionsRef.push(true);
            con.onDisconnect().remove();
        }
    })

    database.ref().on("value", function(snapshot)
    {
        console.log(snapshot.val());
    })
    
}

function ConfigureButtons() {
    $("#mode-solo").click(function () {
        mode = "solo";
        SwitchPage("solo");
        ResetSoloGame();
    })

    $("#mode-online").click(function () {
        mode = "online";
        SwitchPage("online-entry");
        OnlinePlay();
    })

    $(".home").click(function () {
        SwitchPage("home");
    })

    $(document.body).on("click", ".play-btn", function () {
        if (gameActive) {
            if (mode === "solo") {
                let playerChoice = $(this).val();
                EvaluateRound(playerChoice);
            }
        }
    })

    $("#rematch-btn").click(function () {
        ResetSoloGame();
    })

    $("#join").click(function(event) {

        event.preventDefault();
    
        let userText = $("#input-username").val().trim();
        let extraMSG = "";

        if (!userText) {
            extraMSG = " (EMPTY)";
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {

            let newPlayer = 
            {
                name: userText,
                state: "connected"
            }

            AddPlayer(newPlayer);            
            SwitchPage("online");

            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Enter a username");
        }

        console.log("-" + userText + "-" + extraMSG);
    })

    $("#test-btn").click(function() {
        let userText = $("#input-username").val().trim();
        
        console.log(userText);

        if (!userText) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {

            // if (onlineMSGS.length < 3) {
            //     onlineMSGS.push(userText);
            //     $("#online-text").val(onlineMSGS.join("\n"));
            //     console.log(onlineMSGS);
            // }
            // else {
            //     onlineMSGS.shift();
            //     onlineMSGS.push(userText);
            //     $("#online-text").val(onlineMSGS.join("\n"));
            //     console.log(onlineMSGS);
            // }
        }
    })

}

let gameActive = false;
let choices = ["rock", "paper", "scissors"];
let cpuChoice;
let game_msg;
let wins = 0;
let losses = 0;
let draws = 0;

let p1_wins = 0;
let p2_wins = 0;

function ResetSoloGame() {
    gameActive = true;
    cpuChoice = choices[Math.floor(Math.random() * 3)];

    console.log("CPU: " + cpuChoice);

    game_msg = "Make Your Move!";
    UpdateScore();
}

function UpdateScore() {

    switch (mode) {
        case "solo":
            $("#game-msg").text(game_msg);
            $("#win").text(wins);
            $("#loss").text(losses);
            $("#draw").text(draws);
            break;

        case "online":
            $("#game-msg").text(game_msg);
            $("#win").text(p1_wins);
            $("#loss").text(p2_wins);
            $("#draw").text("N/A");
            break;

        default:
            break;
    }
}

function EvaluateRound(pChoice) {
    //   Returns true if "pChoice" wins against "cpuChoice"
    //   Returns false if "cpuChoice" wins against "pChoice"

    console.log("PLAYER: " + pChoice);

    let result;

    switch (pChoice) {
        case "rock":
            switch (cpuChoice) {
                case "rock":
                    draws++;
                    game_msg = "Draw!";
                    break;
                case "paper":
                    losses++;
                    game_msg = "You Lose!";
                    break;
                case "scissors":
                    wins++;
                    game_msg = "You Win!";
                    break;
            }
            break;

        case "paper":
            switch (cpuChoice) {
                case "rock":
                    wins++;
                    game_msg = "You Win!";
                    break;
                case "paper":
                    draws++;
                    game_msg = "Draw!";
                    break;
                case "scissors":
                    losses++;
                    game_msg = "You Lose!";
                    break;
            }
            break;

        case "scissors":
            switch (cpuChoice) {
                case "rock":
                    losses++;
                    game_msg = "You Lose!";
                    break;
                case "paper":
                    wins++;
                    game_msg = "You Win!";
                    break;
                case "scissors":
                    draw++;
                    game_msg = "Draw!";
                    break;
            }
            break;
    }

    UpdateScore();
    gameActive = false;

}

function OnlinePlay() {

    connectionsRef.on("value", function (snapshot) {
        $("#player-count").text(snapshot.numChildren());
    })
}

function UpdateOnlineMSGS() {
    $("#online-text").val(onlineMSGS.join("\n"));
}

function AddPlayer(p) {
    players.push(p);
    onlineMSGS.push("-" + p.name + "- " + p.state);
    UpdateOnlineMSGS();

    database.ref().set(
        {connected: players}
    )

}

function SwitchPage(page) {
    switch (page) {
        case "home":
            $("#content-menu").css("display", "initial");
            $("#content-solo").css("display", "none");
            $("#content-entry").css("display", "none");
            $("#content-online").css("display", "none");
            break;
        case "solo":
            $("#content-menu").css("display", "none");
            $("#content-solo").css("display", "initial");
            $("#content-online").css("display", "none");
            break;
        case "online-entry":
            $("#content-menu").css("display", "none");
            $("#content-solo").css("display", "none");
            $("#content-entry").css("display", "initial");
            break;
        case "online":
            $("#content-menu").css("display", "none");
            $("#content-online").css("display", "initial");
            break;
    }
}