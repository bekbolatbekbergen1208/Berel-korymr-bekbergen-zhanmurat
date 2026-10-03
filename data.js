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
export const components=[['ESP32 DevKit','Топырақтың электрлік жауабын оқып, базалық мәнмен салыстырады.'],['LCD 1602 I2C','Өлшеу мәні мен NORMAL / ANOMALY күйін көрсетеді.'],['4 металл электрод','A, M, N, B электродтары топырақпен электрлік байланыс жасайды.'],['Active buzzer','Ауытқу кезінде дыбыстық белгі береді.'],['LED','Өлшеу күйін жарықпен көрсетеді.'],['Button','Калибровка мен өлшеуді іске қосады.'],['Breadboard','Компоненттерді дәнекерлеусіз жалғайды.'],['1 kΩ резистор','A электродына берілетін токты шектейді.'],['2 × 10 kΩ резистор','M және N өлшеу жолдарында қолданылады.'],['220 Ω резистор','LED тогын шектейді.'],['Jumper wires','Компоненттер арасындағы электрлік байланыс.'],['USB power','Прототипті қуатпен қамтамасыз етеді.']];
export const steps=[['Калибровка','Қалыпты топырақтың бірнеше өлшемі алынып, орташа базалық мән сақталады.'],['Базалық өлшем','Базалық мән келесі өлшеулерді салыстыру үшін қолданылады.'],['Жаңа нүктені өлшеу','Жаңа нүктедегі көрсеткіш базалық мәнмен салыстырылады.'],['ESP32 салыстыруы','Электрлік жауаптағы айырмашылық есептеледі.'],['Нәтижені анықтау','NORMAL — базалық мәнге жақын. ANOMALY — қайта тексеруді қажет ететін ауытқу.'],['Картаға енгізу','Нүктенің көрсеткіштері цифрлық зерттеу картасына сақталады.']];
// Future integration boundary: return { signal, deviation, status } from an ESP32 API.
export async function measureDemo(index,baseline=46){await new Promise(r=>setTimeout(r,1800));const signal=[74,48,63,77,45][index%5];const deviation=Math.abs(signal-baseline);return {signal,deviation,status:deviation>=20?'ANOMALY':deviation>=10?'RECHECK':'NORMAL'};}

// Approximate site-level location from the published Berel archaeological monograph.
// Individual mound coordinates are intentionally absent until verified surveying data is supplied.
export const berelSite={lat:49.333333,lng:86.366667,zoom:13,source:'https://ipae.uran.ru/sites/default/files/publications/Kosintsev_PA/Косинцев_2014_5.pdf'};
export const berelMounds=[
  {id:'K-02',name:'№2 қорған',x:28,y:63,description:'Музейлендірілген қорған. Қорған үстіне қорғау құрылысы орнатылған.',source:'https://www.berelmuseum.kz/ru/infotsentr/smi-o-nas/439-muzeefikatsiya-nekropolya-berel-v-vko-prodolzhaetsya.html'},
  {id:'K-10',name:'№10 қорған',x:52,y:44,description:'Археологиялық зерттеулерде №11 қорғанмен бір тізбекте сипатталған нысан.',source:'https://archaeology.kz/heritages/295-berel-qorymy'},
  {id:'K-11',name:'№11 қорған',x:74,y:28,description:'1998 жылдан бастап зерттелген маңызды қорған. Қорғау құрылысы арқылы музейлендірілген.',source:'https://archaeology.kz/heritages/295-berel-qorymy'}
];
