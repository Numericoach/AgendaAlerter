let globalToken;
let idCalendar;
let preview=0;
let preventTime=5;
let colorChoose;
let allEventsProgrammed;
let alertedEvent=[]; // The array of already alerted event

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: "welcome.html"
    });
  } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {

  } else if (details.reason === chrome.runtime.OnInstalledReason.CHROME_UPDATE) {

  } else if (details.reason === chrome.runtime.OnInstalledReason.SHARED_MODULE_UPDATE) {

  }
});

chrome.alarms.create("checkEvents", {periodInMinutes: 1});

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
     setGlobalToken(init);
    });
    chrome.storage.local.get("preferences", function(data) { 
      if(data.preferences.idCalendar)
      {
        idCalendar=data.preferences.idCalendar;
        preventTime=data.preferences.preventTime;
        colorChoose=data.preferences.colorChoose;
        setInterval(checkNewest, 5000);
        checkNewest();
      }
});
function getMinAndMaxISO()
{
  let exportRange=new Array();
  exportRange['dateMin']='';
  exportRange['dateMax']='';
  let dateMin=new Date();
  exportRange['dateMin']=dateMin.toISOString();
  let dateMax=new Date();
  dateMax.setUTCHours(23);
  dateMax.setUTCMinutes(59);
  exportRange['dateMax']=dateMax.toISOString();
  return exportRange;
}
function setGlobalToken(tokenObject)
{
  globalToken=tokenObject;
  console.log(globalToken);
}
function retrieveAllEvents()
{
  let datesUTC=getMinAndMaxISO();
  fetch('https://www.googleapis.com/calendar/v3/calendars/' + idCalendar + '/events?timeMin=' + datesUTC['dateMin'] + '&timeMax=' + datesUTC['dateMax'] + '', globalToken).then((response) => response.json()).then(function(data) {
    console.log(data);
    allEventsProgrammed=[];
    for(let i=0;i<data.items.length;i++)
    {
      let dateTimeTemp;
      try {
        dateTimeTemp=data.items[i].start['dateTime'];
      }
      catch(e) {
        dateTimeTemp='';
      }
      let meetLink=(data.items[i]['hangoutLink']) ? data.items[i]['hangoutLink'] : false;
      allEventsProgrammed.push({
        name: data.items[i]['summary'],
        id: data.items[i]['id'],
        date: dateTimeTemp,
        meet: meetLink,
        status: data.items[i]['status'],
        color: data.items[i]['colorId']
      });
    } 
    console.log("AllEventsProgrammed", allEventsProgrammed);
    });
  return allEventsProgrammed;
}
function sortFunction(a,b){  
  var dateA = new Date(a.date).getTime();
  var dateB = new Date(b.date).getTime();
  return dateA > dateB ? 1 : -1;  
};
function checkNewest()
{
  
  alertedEvent=chrome.storage.local.get("alertedEvent", function(data) {
    // Retrieving all alerted Event
    if(data.alertedEvent===undefined)
    {
      data=[];
    }
    else
    {
      data=JSON.parse(data.alertedEvent);
    }
    alertedEvent=data;
    allEventsProgrammed=retrieveAllEvents();
    if(typeof allEventsProgrammed=='object')
    {
      // Good return of the calendar
      for(let i=0;i<allEventsProgrammed.length;i++)
      {
        if(allEventsProgrammed[i].status=="confirmed")
        {
          let startTime=new Date();
          let endTime=new Date(allEventsProgrammed[i].date);
          var difference = endTime.getTime() - startTime.getTime();
          var resultInMinutes = Math.round(difference / 60000);
          if(Math.sign(resultInMinutes)!=-1)
          {
            if((resultInMinutes<=preventTime) && allEventsProgrammed[i].color==colorChoose)
            {
              if(!alertedEvent.includes(allEventsProgrammed[i].id))
              {
                alertedEvent.push(allEventsProgrammed[i].id);
                chrome.storage.local.set({alertedEvent: JSON.stringify(alertedEvent) }, function() {
                  if(chrome.runtime.lastError) {
                    console.error(
                      "Error setting " + key + " to " + JSON.stringify(data) +
                      ": " + chrome.runtime.lastError.message
                    );
                  }
                });
                chrome.tabs.create({url: 'alert.html' });
                chrome.notifications.create('', {
                  title: allEventsProgrammed[i].name,
                  message: "L'événement commence dans " + resultInMinutes + " minutes",
                  iconUrl: './images/icon.png',
                  type: 'basic'
                  });
              }
            }
          }
        }
      }
    }
    else
    {
      // BAD RETURN OF THE CALENDAR
      chrome.notifications.create('', {
        title: 'Problème de synchronisation agenda',
        message: "Un problème est survenu lors de la synchro, nouvelle tentative dans 1 minute",
        iconUrl: './images/icon.png',
        type: 'basic'
        });
    }
  });
}
chrome.alarms.onAlarm.addListener(function(alarme) {
  if (alarme.name === "checkEvents") {
    checkNewest();
  }
});