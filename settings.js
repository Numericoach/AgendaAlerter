let globalToken='';
let idCalendar=false;
let preventTime=false;
let colorChoose=false;
window.onload = function() {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
    let init = {
      method: 'GET',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
       'Content-Type': 'application/json'
      },
      'contentType': 'json'
      };
      document.getElementById('temoinConnexion').style.display='none';
      document.getElementById('lastStep').style.display='block';
      document.getElementById('save').addEventListener('click', savePreferences);
      setGlobalToken(init);
      retrieveAllCalendars();
      });
};
function setGlobalToken(tokenObject)
{
  globalToken=tokenObject;
  console.log(globalToken);
}
function retrieveAllCalendars()
{
  console.log(globalToken);
  let calendarList=document.getElementById('calendarChoose');
  calendarList.innerHTML='';
  fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', globalToken).then((response) => response.json()).then(function(data) {
    console.log(data.items);
    for(let i=0;i<data.items.length;i++)
    {
      let tempOption=document.createElement('option');
      tempOption.setAttribute('value', data.items[i]['id']);
      tempOption.innerHTML=data.items[i]['summary'];
      calendarList.appendChild(tempOption);
    }
    retrievePreferences('calendar');
  });
  retrieveAllColors();
}
function retrieveAllColors()
{
    let containerColor=document.getElementById('colorChoose');
    containerColor.addEventListener('change', function(event) { document.getElementById('colorChoose').style.color=document.querySelector('option[value="' + event.target.value + '"]').getAttribute('data-color'); });
    containerColor.innerHTML='';
    fetch('https://www.googleapis.com/calendar/v3/colors', globalToken).then((response) => response.json()).then(function(data) {
        containerColor.style.color=data.event[1].background;
        for(let i=1;i<Object.keys(data.event).length;i++)
        {
          containerColor.innerHTML+='<option value="' + i + '" style="color: ' + data.event[i].background + ';" data-color="' + data.event[i].background + '">⬤</option>';
        }
        retrievePreferences('color');
    });
}
function savePreferences()
{
    chrome.storage.local.set({preferences: { idCalendar: document.getElementById('calendarChoose').value, preventTime: document.getElementById('minutesPrevent').value, colorChoose: document.getElementById('colorChoose').value }}, function() {
        if(chrome.runtime.lastError) {
          console.error(
            "Error setting " + key + " to " + JSON.stringify(data) +
            ": " + chrome.runtime.lastError.message
          );
        }
      });
    alert('Préférences sauvegardées');
}
function retrievePreferences(pref='')
{
  chrome.storage.local.get("preferences", function(data) { 
    if(data.preferences.idCalendar)
    {
      idCalendar=data.preferences.idCalendar;
      preventTime=data.preferences.preventTime;
      colorChoose=data.preferences.colorChoose;
      switch(pref)
      {
        case "color":
          document.querySelector('select#colorChoose option[value="' + colorChoose + '"]').setAttribute('selected', 'true');
          document.getElementById('colorChoose').style.color=document.querySelector('option[value="' + document.getElementById('colorChoose').value + '"]').getAttribute('data-color');
        break;
        case "calendar":
          document.querySelector('select#calendarChoose option[value="' + idCalendar + '"]').setAttribute('selected', 'true');
        break;
      }
      document.querySelector('input#minutesPrevent').value=preventTime;
    }
  });
}