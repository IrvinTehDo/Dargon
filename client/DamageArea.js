//Class for damage areas where the player can be hurt if they stand within it for too long
class DamageArea {
  constructor(dimensions, progress) {
    //Set the general status
    this.status = {
      opacity: 0.2 + (0.6 * progress)
    };
    
    //Define the boxes dimensions (start as a 0 pixel box)
    this.dimensions = {
      x: dimensions.x,
      y: dimensions.y,
      w: 0 + (progress * dimensions.w),
      h: 0 + (progress * dimensions.h),
    };
    
    this.fullSize = {
      w: dimensions.w,
      h: dimensions.h,
    };
    
    //Define some phrases that will show up in arcane script
    this.phrases = [
      {
        text: "Great Power",
        textOffset: 0,
        speed: 1,
      },
      {
        text: "Danger",
        textOffset: 0,
        speed: -2,
      },
      {
        text: "Stay Away",
        textOffset: 0,
        speed: 2,
      },
      {
        text: "Binding Agreement",
        textOffset: 0,
        speed: -1,
      }
    ];
  };
  
  //Grow the box by a given amount (constrain to the max box size)
  growBox(amount){
    this.dimensions.w += amount;
    this.dimensions.h += amount;
    
    if(this.dimensions.w > this.fullSize.w){
      this.dimensions.w = this.fullSize.w;
    }
    
    if(this.dimensions.h > this.fullSize.h){
      this.dimensions.h = this.fullSize.h;
    }
  }
  
  //Update the boxes opacity
  update(progress){
    this.status.opacity = 0.2 + (0.4 * progress);
  }
};