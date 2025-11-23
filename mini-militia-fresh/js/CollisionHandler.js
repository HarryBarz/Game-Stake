/**
*CreatedbyAsimon4/15/2017.
*/
functionCollisionHandler(ctx,camera,mapArray){

var_this;
this._init=function(){

_this=this;
this.ctx=ctx;
this.camera=camera;
this.mapArray=mapArray;
};

this.hasReachedGround=function(actor){

vary=Math.round((actor.position.y+actor.actorHeight)/TILE_SIZE)-1;
varx=Math.round((actor.position.x+actor.actorWidth)/TILE_SIZE)-2;

if(_this.mapArray[y]!==undefined){
if(_this.mapArray[y][x]!==undefined){
if(_this.mapArray[y][x].tileType==1){
returntrue;
}
}
if(_this.mapArray[y][x]!==undefined){
if(_this.mapArray[y][x].tileType==4){
returntrue;
}
}
}

returnfalse;
};

this.pushingAgainstWall=function(actor,direction){

varfromY=Math.round((actor.position.y)/TILE_SIZE)-1;
varx;
if(direction=='D')
x=Math.round((actor.position.x+actor.actorWidth)/TILE_SIZE);
elseif(direction=='A')
x=Math.round(actor.position.x/TILE_SIZE);
x=x-3;
vartoY=Math.round((actor.position.y+actor.actorHeight)/TILE_SIZE)-1;

for(vari=fromY;i<toY;i++){
if(_this.mapArray[i]!==undefined){
if(_this.mapArray[i][x]!==undefined){
if(_this.mapArray[i][x].tileType==1||_this.mapArray[i][x].tileType==2||_this.mapArray[i][x].tileType==4){
returntrue;
}
if(_this.mapArray[i][x+2]!==undefined)
if(_this.mapArray[i][x+2].tileType==3||_this.mapArray[i][x+2].tileType==5)
returntrue;
}
}
}

returnfalse;
};

this.objectIsOutBound=function(position){

vary=Math.round(position.y/TILE_SIZE);
varx=Math.round(position.x/TILE_SIZE);

if(_this.mapArray[y]!==undefined){
if(_this.mapArray[y][x]!==undefined){
if(_this.mapArray[y][x].tileType==1||_this.mapArray[y][x].tileType==4||_this.mapArray[y][x].tileType==2){
returntrue;
}
}
}
returnfalse;
};

this._init();
}