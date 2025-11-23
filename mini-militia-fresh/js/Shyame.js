/**
*CreatedbyAsimon4/6/2017.
*/
functionShyame(ctx,startPosition,canvas,camera,collisionHandler,resources){

this._init=function(){
this.actor=newActor(ctx,startPosition,canvas,camera,collisionHandler,resources);
};

this._init();
}