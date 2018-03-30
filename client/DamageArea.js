class DamageArea {
  constructor(dimensions, progress) {
    this.status = {
      opacity: 0.2 + (0.6 * progress)
    };
    
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
      }
    ];
  };
  
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
  
  update(progress){
    this.status.opacity = 0.2 + (0.4 * progress);
  }
};