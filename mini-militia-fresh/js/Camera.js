/**
*CreatedbyAsimon4/15/2017.
*/
functionCamera(ctx,shyame){

var_this;
this._init=function(){

_this=this;
this.ctx=ctx;
this.shyame=shyame;
this.canvasMarginLeft=0;
this.cameraSpeed=_this.shyame.actor.speed;
};

this.move=function(){

//console.log(_this.shyame.actor.position.x);
//console.log(_this.canvasMarginLeft);
vardiffCurrPos=_this.shyame.actor.position.x-Math.abs(_this.canvasMarginLeft);
if(diffCurrPos!=600){
if(diffCurrPos>600){

_this.moveRight();
}else{
_this.moveLeft();
}
}
};

this.moveRight=function(){

//console.log('cameraismovingright');
//console.log(_this.ground.groundOffsets.x);
if(_this.canvasMarginLeft<=0&&_this.canvasMarginLeft>=-2635.0001)
_this.canvasMarginLeft-=_this.cameraSpeed;
_this.ctx.canvas.style.marginLeft=_this.canvasMarginLeft+'px';
};

this.moveLeft=function(){

//console.log('cameraismovingleft');
//console.log(_this.ground.groundOffsets.x);
if(_this.canvasMarginLeft<-_this.cameraSpeed&&_this.canvasMarginLeft>=(-2635-_this.cameraSpeed))
_this.canvasMarginLeft+=_this.cameraSpeed;
_this.ctx.canvas.style.marginLeft=_this.canvasMarginLeft+'px';
};

this._init();
};