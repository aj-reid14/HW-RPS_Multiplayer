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

  $(document).ready(function()
  {
      $("#content-game").css("display", "none");
      ConfigureButtons();
  })

  function ConfigureButtons()
  {
      $("#mode-solo").click(function()
      {
          $("#content-menu").css("display", "none");
          $("#content-game").css("display", "initial");
      })

      $("#mode-online").click(function()
      {
          $("#content-menu").css("display", "none");
          $("#content-game").css("display", "initial");
      })

      $("#home-btn").click(function()
      {
          $("#content-game").css("display", "none");
          $("#content-menu").css("display", "initial");
      })
  }
