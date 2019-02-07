document.addEventListener("deviceready", onDeviceReady, false)

function onDeviceReady() {
  document.addEventListener("pause", onPause, false)
  document.addEventListener("resume", onResume, false)
  document.addEventListener("backbutton", onBackKeyDown, false)

  import("./app")
}

function onPause() {
  // Handle the pause event
}

function onResume() {
  // Handle the resume event
}

function onBackKeyDown() {
  // Handle the back button
}
