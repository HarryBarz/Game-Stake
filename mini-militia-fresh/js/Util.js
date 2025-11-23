/**
*Createdbyasimon4/5/17.
*/
functionUtil(){}

Util.calculateDistance=function(x1,y1,x2,y2){

returnMath.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
};

Util.getRandomInt=function(min,max){

returnMath.floor(Math.random()*(max-min+1))+min;
};
