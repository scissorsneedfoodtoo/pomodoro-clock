$(document).ready(function() {

  var sessionLength = 25;
  var breakLength = 5;
  var pauseSwitch = 1;
  var breakSwitch = 0;
  var runOnce = 0;
  var timeInterval; // global var for now to make pausing and unpausing easier
  var baseTime; // global baseTime object
  var updateClock; // houses updateClock function as global var to allow for easy resuming
  var beep = new Audio('https://onlineclock.net/audio/options/default.mp3'); // global var so audio file loads with the page--the file can then be played even when the tab is inactive

  function processTime(time) {
    if (typeof time === 'object') { // processes the arg differently if it's an int like sessionLength or breakLength, or an object like baseTime
      var t = time.total;
    } else {
      var t = time * 60000;
    }

    var seconds = Math.floor((t / 1000) % 60);
    var minutes = Math.floor((t / 1000 / 60) % 60);
    var orgSessionLength = sessionLength * 60000;
    var orgBreakLength = breakLength * 60000;
    var percentSession = Math.floor((t / orgSessionLength) * 100);
    var percentBreak = Math.floor((t / orgBreakLength) * 100);
    
    if (breakSwitch === 0) {
      var timeObj = {
        'total': t,
        'seconds': seconds,
        'minutes': minutes,
        'percentSession': percentSession
      };
    } else if (breakSwitch === 1) {
      var timeObj = {
        'total': t,
        'seconds': seconds,
        'minutes': minutes,
        'percentBreak': percentBreak
      };
    }

    return timeObj;
  }

  function initializeClock(time) {
    baseTime = processTime(time); // updates the global baseTime object to prevent errors with pausing and resuming
    var newTime = processTime(time);
    
    updateClock = function() {
      newTime = processTime(newTime); // creates an updated time object for display
      // baseTime = newTime; // updates baseTime based on newTime object
      // console.log(newTime);
      console.log(newTime.total);

      $('.countdown-mins').html('<h2>' + ('0' + newTime.minutes).slice(-2) + '</h2>');
      $('.countdown-secs').html('<h2>' + ('0' + newTime.seconds).slice(-2) + '</h2>');

      if (newTime.total < 0) { // handles cases where either the work or break timer is < 0 to allow the clock to properly zero out (originally was newTime.total <= 0 which caused instant clock switching)
        if (breakSwitch === 0) { // initializes the clock with the breakLength if the current work session ends
          pause();
          playSound(); // triggered here to prevent the endless looping of the alarm sound
          initializeClock(breakLength);
          $('.countdown .title').html('Break');
          startClock();
          breakSwitch = 1;
        } else if (breakSwitch === 1) { // initializes the clock with the sessionLength if the current break ends and pauses the clock
          initializeClock(sessionLength);
          $('.countdown .title').html('Session');
          pause();
          playSound();
          breakSwitch = 0;
        }
      } else {
        newTime.total -= 1000; // subtracts 1000 ms from the baseTime object for the next pass of the function
      } // end if/else
      console.log(baseTime, newTime);
      return pieCountdown(newTime);
    } // end updateClock
    
    updateClock(); // run function once here to prevent a 1000 ms delay
  } // end initializeClock

  function controls() {

    $('.break-minus').click(function() {
      
       if (breakLength <= 0) { // returns 0 to prevent errors
        breakLength = 0;
      } else if (pauseSwitch === 1) { // subtracts 1 minutes from break length and rounds off the clock to the minute automatically when the clock is paused
        breakLength--;
        updateSettings(breakLength, sessionLength);
        if (breakSwitch === 1) {  // only updates the current clock if it's the break clock
          initializeClock(breakLength);
        }
      }
    }); // end break-minus

    $('.break-plus').click(function() {     
      if (pauseSwitch === 1) { // adds 1 minute to break length and rounds off the clock to the minute automatically when the clock is paused
        breakLength++;
        updateSettings(breakLength, sessionLength);
        if (breakSwitch === 1) { // only updates the current clock if it's the break clock
          initializeClock(breakLength);
        }
      }
    });

    $('.timer-minus').click(function() {
      if (sessionLength <= 0) { // returns 0 to prevent errors
        sessionLength = 0;
      } else if (pauseSwitch === 1) { // subtracts 1 minutes from session length and rounds off the clock to the minute automatically when the clock is paused
        sessionLength--;
        updateSettings(breakLength, sessionLength);
        if (breakSwitch === 0) {  // only updates the current clock if it's not the break clock
          initializeClock(sessionLength);
        }
      }
    }); // end timer-minus click

    $('.timer-plus').click(function() {
      if (pauseSwitch === 1) { // adds 1 minute to session length and rounds off the clock to the minute automatically when the clock is paused
        sessionLength++;
        updateSettings(breakLength, sessionLength);
        if (breakSwitch === 0) { // only updates the current clock if it's not the break clock
          initializeClock(sessionLength);
        }
      }
    }); // end timer-plus click

    $('.countdown').click(function() { // controls clock start and stop
      if (pauseSwitch === 0) { // if clock is running and isn't paused
        pause();
      } else if (pauseSwitch === 1) { // if clock has been run once and is currently paused -- resume
        startClock();
      }
    }); // end countdown click

  } // end controls

  function updateSettings(breakLength, sessionLength) {

    $('.break-length').html('<p>' + breakLength + '</p>');
    $('.timer-length').html('<p>' + sessionLength + '</p>');

  } // end updateScreen
  
  function pieCountdown(timeObj) {
    var deg;
    var percentSession = timeObj.percentSession / 100;
    var percentBreak = timeObj.percentBreak / 100;
    var totalSessionRatio = (sessionLength * 60000) / (sessionLength * 60000);
    var totalBreakRatio = (breakLength * 60000) / (breakLength * 60000);
    
    if (breakSwitch === 0) { // handles animation during work session
      colorSwitcher();
      if (percentSession < (totalSessionRatio / 2)) {
        deg = 90 + (360 * percentSession);
        $('.pie').css('background-image', 'linear-gradient('+deg+'deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)');
      } else if (percentSession >= (totalSessionRatio / 2)) {
        deg = -90 + (360 * percentSession);
        $('.pie').css('background-image', 'linear-gradient('+deg+'deg, transparent 50%, #c62828 50%),linear-gradient(90deg, white 50%, transparent 50%)');
      }
    } else if (breakSwitch === 1) {
      colorSwitcher();
      if (percentBreak < (totalBreakRatio / 2)) {
        deg = 90 + (360 * percentBreak);
        $('.pie').css('background-image', 'linear-gradient('+deg+'deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)');
      } else if (percentBreak >= (totalBreakRatio / 2)) {
        deg = -90 + (360 * percentBreak);
        $('.pie').css('background-image', 'linear-gradient('+deg+'deg, transparent 50%, #2c7d56 50%),linear-gradient(90deg, white 50%, transparent 50%)');
      }
    } // end if breakSwitch === 0;
    // console.log(deg, percentSession, totalSessionRatio, sessionLength);
    // console.log(baseTime.total);
  } // end PieCountdown
  
  function pause() {
    pauseSwitch = 1;
    clearInterval(timeInterval);
  } // end pause
  
  function startClock() {
    pauseSwitch = 0;
    timeInterval = setInterval(updateClock, 1000);
  } // end startClock
  
  function colorSwitcher() {
    if (breakSwitch === 0) {
      $('body').css('background-color', '#dcabab');
      $('.pie').css('background-color', '#c62828');
      $('.pie').css('background-image', 'linear-gradient(90deg, transparent 50%, #c62828 50%)');
      $('.footer a').hover(function() {
        $(this).css('color', '#c62828');
      }, function() {
        $(this).css('color', 'rgba(0,0,0,.75)')
      });
    } else if (breakSwitch === 1) {
      $('body').css('background-color', '#7af0c1');
      $('.pie').css('background-color', '#2c7d56');
      $('.pie').css('background-image', 'linear-gradient(90deg, transparent 50%, #2c7d56 50%)');
      $('.footer a').hover(function() {
        $(this).css('color', '#2c7d56');
      }, function() {
        $(this).css('color', 'rgba(0,0,0,.75)')
      });
    }
  } // end colorSwitcher
  
  function playSound() {
    beep.play();
  } // end playSound

  controls();
  updateSettings(breakLength, sessionLength);
  initializeClock(sessionLength); // to display the initial sessionLength

}); // end ready