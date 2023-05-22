let globalToken;
let idCalendar;
let preview=0;
let preventTime=5;
let colorChoose;
chrome.tabs.create({url: 'settings.html', pinned: true});
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
      console.log(data.preferences);
      if(data.preferences.idCalendar)
      {
        idCalendar=data.preferences.idCalendar;
        preventTime=data.preferences.preventTime;
        colorChoose=data.preferences.colorChoose;
        retrieveAllEvents();
        setInterval(retrieveAllEvents, 300000);
        setInterval(checkNewest, 10000);
        setInterval(function() { console.log('heull');preview+=1; }, 1000);
      }
      console.log(colorChoose);
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
      allEventsProgrammed.push({
        name: data.items[i]['summary'],
        id: data.items[i]['id'],
        date: dateTimeTemp
      });
    } 
    console.log(allEventsProgrammed);
    });
}
function sortFunction(a,b){  
  var dateA = new Date(a.date).getTime();
  var dateB = new Date(b.date).getTime();
  return dateA > dateB ? 1 : -1;  
};
function checkNewest()
{
  allEventsProgrammed=allEventsProgrammed.sort(sortFunction);
  for(let i=0;i<allEventsProgrammed.length;i++)
  {
    let startTime=new Date();
    let endTime=new Date(allEventsProgrammed[i].date);
    var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
    var resultInMinutes = Math.round(difference / 60000);
    console.log(resultInMinutes + " / " + preventTime);
    if(resultInMinutes==preventTime)
    {
      chrome.notifications.create('', {
        title: allEventsProgrammed[i].name,
        message: "L'événement commence dans " + preventTime + " minutes",
        iconUrl: './images/icon.png',
        type: 'basic'
      });
    }
  }
}