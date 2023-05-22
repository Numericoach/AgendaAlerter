// For first launch, chrome set variable to know if user ever log
let globalToken='';
let allEventsProgrammed=new Array();
let alertBefore=5; // in minutes
let idCalendar;
let preventTime;
let colorChoose;

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
      }
      console.log(colorChoose);
    });
    document.getElementById('options').addEventListener('click', function() {   chrome.tabs.create({url: 'settings.html'});  });
};
function setGlobalToken(tokenObject)
{
  globalToken=tokenObject;
  console.log(globalToken);
}
function sortFunction(a,b){  
  var dateA = new Date(a.date).getTime();
  var dateB = new Date(b.date).getTime();
  return dateA > dateB ? 1 : -1;  
};
function checkNewest()
{
  allEventsProgrammed=allEventsProgrammed.sort(sortFunction);
  console.log('Triage');
  console.log(allEventsProgrammed);
  let containerFurther=document.getElementById('furtherEvents');
  containerFurther.innerHTML='';
  for(let i=0;i<allEventsProgrammed.length;i++)
  {
    let startTime=new Date();
    let endTime=new Date(allEventsProgrammed[i].date);
    var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
    var resultInMinutes = Math.round(difference / 60000);
    if(resultInMinutes>0 && allEventsProgrammed[i].color==colorChoose)
    {
      let cardContainer=document.createElement('div');
      cardContainer.setAttribute('class', 'card border-primary mb-1');
      meetLink=(allEventsProgrammed[i].meet) ? '<button class="btn btn-primary btn-sm" id="meet' + i + '" href="' + allEventsProgrammed[i].meet + '">Rejoindre la réunion Meet</button>' : '<small style="font-size: 13px;">Aucun lien meet associé à l\'évenement</small>';
      cardContainer.innerHTML=`
      <div class="card-header text-primary">Dans ` + resultInMinutes + ` minutes</div>
      <div class="card-body text-primary">
        <h5 class="card-title">` + allEventsProgrammed[i].name + `</h5>
        ` + meetLink + `
      </div>
      `;
      containerFurther.appendChild(cardContainer);
      if(allEventsProgrammed[i].meet)
      {
        document.getElementById('meet' + i).addEventListener('click', function(el) { chrome.tabs.create({url: el.target.getAttribute('href') }); });
      }
    }
  }
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
        color: data.items[i]['colorId']
      });
      checkNewest();
    } 
    console.log(allEventsProgrammed);
    });
}
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
function applyConfigLocal()
{
  
}
function retrieveAllCalendars()
{
  console.log(globalToken);
  let calendarList=document.getElementById('allCalendars');
  fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', globalToken).then((response) => response.json()).then(function(data) {
    console.log(data.items);
    for(let i=0;i<data.items.length;i++)
    {
      let tempOption=document.createElement('option');
      tempOption.setAttribute('value', data.items[i]['id']);
      tempOption.innerHTML=data.items[i]['summary'];
      calendarList.appendChild(tempOption);
    }
  });
}
chrome.storage.onChanged.addListener(applyConfigLocal);
