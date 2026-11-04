// Demonstration data only. Replace with repeated, validated experimental results.
export const researchPoints = [
{id:'B-01',x:20,y:33,signal:47,deviation:1,status:'NORMAL'},
{id:'B-02',x:35,y:48,signal:49,deviation:3,status:'NORMAL'},
{id:'B-03',x:46,y:24,signal:58,deviation:12,status:'RECHECK'},
{id:'B-04',x:58,y:54,signal:45,deviation:1,status:'NORMAL'},
{id:'B-05',x:72,y:31,signal:65,deviation:19,status:'RECHECK'},
{id:'B-06',x:31,y:73,signal:48,deviation:2,status:'NORMAL'},
{id:'B-07',x:64,y:73,signal:74,deviation:28,status:'ANOMALY'},
{id:'B-08',x:83,y:60,signal:77,deviation:31,status:'ANOMALY'}];
export const experiments=[{name:'Қалыпты топырақ',signal:46,deviation:0,tests:5},{name:'Тас қабаты',signal:62,deviation:16,tests:5},{name:'Бос кеңістік',signal:74,deviation:28,tests:5},{name:'Өзге материал',signal:67,deviation:21,tests:5}];
export const components=[['ESP32 DevKit','Топырақтың электрлік жауабын оқып, базалық мәнмен салыстырады.'],['LCD 1602 I2C','Өлшеу мәні мен NORMAL / ANOMALY күйін көрсетеді.'],['5 металл электрод','Бес металл электрод топырақпен электрлік байланыс жасайды.'],['Active buzzer','Ауытқу кезінде дыбыстық белгі береді.'],['LED','Өлшеу күйін жарықпен көрсетеді.'],['Button','Калибровка мен өлшеуді іске қосады.'],['Breadboard','Компоненттерді дәнекерлеусіз жалғайды.'],['1 kΩ резистор','Электрод тізбегіндегі токты шектеуге арналған.'],['2 × 10 kΩ резистор','Өлшеу тізбегінде қолданылады.'],['220 Ω резистор','LED тогын шектейді.'],['Jumper wires','Компоненттер арасындағы электрлік байланыс.'],['USB power','Прототипті қуатпен қамтамасыз етеді.']];
export const steps=[['Калибровка','Қалыпты топырақтың бірнеше өлшемі алынып, орташа базалық мән сақталады.'],['Базалық өлшем','Базалық мән келесі өлшеулерді салыстыру үшін қолданылады.'],['Жаңа нүктені өлшеу','Жаңа нүктедегі көрсеткіш базалық мәнмен салыстырылады.'],['ESP32 салыстыруы','Электрлік жауаптағы айырмашылық есептеледі.'],['Нәтижені анықтау','NORMAL — базалық мәнге жақын. ANOMALY — қайта тексеруді қажет ететін ауытқу.'],['Картаға енгізу','Нүктенің көрсеткіштері цифрлық зерттеу картасына сақталады.']];
// Future integration boundary: return { signal, deviation, status } from an ESP32 API.
export async function measureDemo(index,baseline=46){await new Promise(r=>setTimeout(r,1800));const signal=[74,48,63,77,45][index%5];const deviation=Math.abs(signal-baseline);return {signal,deviation,status:deviation>=20?'ANOMALY':deviation>=10?'RECHECK':'NORMAL'};}

// Initial overview only; no archaeological site coordinates are implied.
export const researchRegion={lat:48,lng:67,zoom:5};
// Fictional learning examples, without GPS coordinates.
export const researchObjects=[
  {id:'K-02',name:'Қорған',x:28,y:63,description:'Шартты оқу нысаны: жерлеу құрылысының айналасындағы электрлік ауытқуларды салыстыру. Нақты ескерткіш туралы дерек емес.'},
  {id:'K-10',name:'Көне қоныс',x:52,y:44,description:'Шартты оқу нысаны: топырақ қабаттары мен құрылыс қалдықтары ықтимал ауытқуларды талқылауға арналған мысал.'},
  {id:'K-11',name:'Көне қала орны',x:74,y:28,description:'Шартты оқу нысаны: зерттеу торын құру және өлшемдерді салыстыру мысалы. Құрылыс қалдықтарын растау үшін кәсіби зерттеу қажет.'}
];
