
/**
 * iSlider 通用全屏滑动切换动画组件 
 * @class iSlider
 * @param {object} opts
 * @param {string} opts.wrap='.wrap' 容器 
 * @param {string} opts.item='.item'  滚动单元的元素
 * @param {string} opts.playClass='play'  触发播放动画的class
 * @param {number} [opts.index=0]  设置初始显示的页码
 * @param {number} [opts.noslide=[0,3,4]]  设置禁止滑动的页码, 禁止后 需要开发者手动绑定页面中的某个按钮事件进行滑动 
 * @param {number} [opts.speed=400] 动画速度 单位:ms
 * @param {number} [opts.triggerDist=30] 触发滑动的手指移动最小位移 单位:像素
 * @param {boolean} [opts.isVertical=true] 滑动方向 是否是垂直方向 默认是.
 * @param {boolean} [opts.lastLocate=true] 后退后定位到上次浏览的位置 默认true
 * @param {function} [opts.onslide]  滑动后回调函数
 * @param {array} [opts.loadingImgs]  loading需要加载的图片地址列表
 * @param {function} [opts.onloading]  loading时每加载完成一个图片都会触发这个回调  回调时参数值为 (已加载个数,总数)
 * @desc 

-  如丝般高性能全屏动画滑屏组件, 主要应用于微信H5宣传页,海报,推广介绍等场景. 基于iSlider,可以快速搭建效果炫丽的H5滑屏页面.
-  简洁,易用.  无css依赖.
-  专注于页面滑动, 没有冗余代码 , 保证性能.
-  组件没有任何依赖.
-  imgcache 引用地址 : http://imgcache.gtimg.cn/music/h5/lib/js/module/iSlider-1.0.min.js?_bid=363&max_age=2592000
-  github: https://github.com/kele527/iSlider


 * @example

    //极简用法
    new iSlider(); //容器默认是 .wrap  元素默认是 .item   动画播放class默认是 play

    //普通用法
    new iSlider({
        wrap:'.wrap',
        item:'.item',
        playClass:'play',
        onslide:function (index) {
            console.info(index)
        }
    });

    //带loading进度条用法
    new iSlider({
        wrap:'.wrap',
        item:'.item',
        playClass:'play',
        onslide:function (index) {
            console.info(index)
        },
        loadingImgs:[
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/open_cover.jpg?max_age=2592000',
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/im_cover.jpg?max_age=2592000',
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/bg1.jpg?max_age=2592000',
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/bg2.jpg?max_age=2592000'
        ],
        onloading:function (loaded,total) {
            this.$('#loading div').style.width=loaded/total*100+'%';
            if (loaded==total) {
                this.$('#loading').style.display="none"
            }
        }
    });

    demo http://kele527.github.io/iSlider/demo1.html

 * @date 2014/11/3 星期一
 * @author rowanyang
 * 
 */
function iSlider(opts) {
    this.opts={
        wrap:'.wrap',
        item:'.item',
        playClass:'play',
        speed:400, //滑屏速度 单位:ms
        triggerDist:30,//触发滑动的手指移动最小位移 单位:像素
        isVertical:true,//垂直滑还是水平滑动
        useACC:true, //是否启用硬件加速 默认启用
        lastLocate:true, //后退后定位到上次浏览的位置 默认开启
        loadingImgs:[], //loading 预加载图片地址列表
        preLoadingImgs:[],
        onslide:function (index) {},//滑动回调 参数是本对象
        onloading:function (loaded,total) {},
        loadingOverTime:15 //预加载超时时间 单位:秒
    }

    for (var i in opts) {
        this.opts[i]=opts[i];
    }

    this.init();
}
/**  @lends iSlider */
iSlider.prototype={
    wrap:null,
    tplNum:0,
    tpl:[],
    index : 0,
    _delayTime:150,
    _sessionKey : location.host+location.pathname,
    $:function (o) {
        return document.querySelector(o);
    },
    addClass:function (o,cls) {
        if (o.classList) {
            o.classList.add(cls)
        }else {
            o.className+=' '+cls;
        }
    },
    removeClass:function (o,cls) {
        if (o.classList) {
            o.classList.remove(cls)
        }else {
            o.className=o.className.replace(new RegExp('\\s*\\b'+cls+'\\b','g'),'')
        }
    },
	init:function () {
        var self = this;
        //使用sessionStorage来保存当前浏览到第几页了   后退回来的时候 定位到这一页
        var lastLocateIndex=parseInt(sessionStorage[this._sessionKey]);
        this.index = ((this.opts.lastLocate && lastLocateIndex>=0) ? lastLocateIndex : 0) || this.opts.index || 0;

        this.wrap=this.$(this.opts.wrap);

        this.tpl= this.wrap.cloneNode(true);
        this.tpl=this.opts.item ? this.tpl.querySelectorAll(this.opts.item) : this.tpl.children;

        this.tplNum=this.tpl.length; //总页数数据
        this.touchInitPos = 0;//手指初始位置
        this.startPos = 0;//移动开始的位置
        this.totalDist = 0,//移动的总距离
        this.deltaX1 = 0;//每次移动的正负
        this.deltaX2 = 0;//每次移动的正负

        this.wrap.style.cssText+="display:block;position:relative;width:100%;height:100%";
        this.displayWidth = this.wrap.clientWidth; //滑动区域最大宽度
        this.displayHeight = this.wrap.clientHeight; //滑动区域最大高度

        this.scrollDist=this.opts.isVertical ? this.displayHeight : this.displayWidth;//滚动的区域尺寸 

        this._setHTML();

        if (this.opts.loadingImgs && this.opts.loadingImgs.length) {
            this._loading();
        }else {
            this._pageInit();
        }

        if (/iPhone|iPod|iPad/.test(navigator.userAgent)) {
            this._delayTime=50;
        }
        var s = document.createElement('style');
        s.innerHTML = 'html,body{width:100%;height:100%} .js-iSlider-item{position:absolute;left:0;top:0;width:100%;height:100%}';
        document.head.appendChild(s);
        s = null;

        this._bindEvt();
	},
    _bindEvt:function () {
        var self = this;
        this.$('body').addEventListener('touchstart',function (e) {
            self._touchstart(e);
        },false);
        this.$('body').addEventListener('touchmove',function (e) {
            self._touchmove(e);
        },false);
        this.$('body').addEventListener('touchend',function (e) {
            self._touchend(e);
        },false);
        this.$('body').addEventListener('touchcancel',function (e) {
            self._touchend(e);
        },false);

        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
    },
    _setHTML:function (index) {
        if (index>=0) {
            this.index=index;
        }
        this.wrap.innerHTML=
            (this.index>0?'<div id="i-prev" class="js-iSlider-item '+this.tpl[this.index-1].className+'" style="'+this._getTransform('-100%')+'">'+this.tpl[this.index-1].innerHTML+'</div>':'')+
            '<div id="i-current" class="js-iSlider-item '+this.tpl[this.index].className+'" style="'+this._getTransform(0)+'">'+this.tpl[this.index].innerHTML+'</div>'+
            (this.index<this.tplNum-1?'<div id="i-next" class="js-iSlider-item '+this.tpl[this.index+1].className+'" style="'+this._getTransform('100%')+'">'+this.tpl[this.index+1].innerHTML+'</div>':'');
    },
    _pageInit:function () {
        var self = this;
        setTimeout(function () {
            self.addClass(self.$('#i-current'),self.opts.playClass);
        },this._delayTime);
        try {
            self.opts.onslide.call(self,self.index);
        } catch (e) {
            console.info(e)
        }
    },
	_touchstart : function (e) {
		if(e.touches.length !== 1){return;}//如果大于1个手指，则不处理
        
        this.lockSlide=false;
        this._touchstartX=e.touches[0].pageX;
        this._touchstartY=e.touches[0].pageY;

		this.touchInitPos = this.opts.isVertical ? e.touches[0].pageY:e.touches[0].pageX; // 每次move的触点位置
		this.deltaX1 = this.touchInitPos;//touchstart的时候的原始位置

		this.startPos = 0;
		this.startPosPrev = -this.scrollDist;
		this.startPosNext = this.scrollDist;
		this.hasPrev = !!this.$('#i-prev');
		this.hasNext = !!this.$('#i-next');
		//手指滑动的时候禁用掉动画
		if (this.hasNext) {
			this.$('#i-next').style.cssText+='-webkit-transition-duration:0;'
		}

		this.$('#i-current').style.cssText+='-webkit-transition-duration:0;'
		if (this.hasPrev) {
			this.$('#i-prev').style.cssText+='-webkit-transition-duration:0;'
		}
	},
	_touchmove : function (e) {
		if(e.touches.length !== 1 || this.lockSlide){return;}

        var gx=Math.abs(e.touches[0].pageX - this._touchstartX);
        var gy=Math.abs(e.touches[0].pageY - this._touchstartY);
        
        //如果手指初始滑动的方向跟页面设置的方向不一致  就不会触发滑动  这个主要是避免误操作, 比如页面是垂直滑动, 在某一页加了横向滑动的局部动画, 那么左右滑动的时候要保证页面不能上下移动. 这里就是做这个的.
        if (gx>gy && this.opts.isVertical) { //水平滑动
            this.lockSlide=true;
            return ;
        }else if(gx<gy && !this.opts.isVertical){ //垂直滑动
            this.lockSlide=true;
            return ;
        }
        
        //如果是禁用了这一页的滑动, 那么往下是划不动了  但是可以往上滑
        if (this.opts.noslide && this.opts.noslide.indexOf(this.index)>=0 && e.touches[0].pageY - this._touchstartY<0) {
            return ;
        }

		var currentX = this.opts.isVertical ? e.touches[0].pageY:e.touches[0].pageX;
		this.deltaX2 = currentX - this.deltaX1;//记录当次移动的偏移量
		this.totalDist = this.startPos + currentX - this.touchInitPos;

		this.$('#i-current').style.cssText+=this._getTransform(this.totalDist+'px');
		this.startPos = this.totalDist;
		
		//处理上一张和下一张
		if (this.totalDist<0) {//露出下一张
			if (this.hasNext) {
				this.totalDist2 = this.startPosNext + currentX - this.touchInitPos;

				this.$('#i-next').style.cssText += this._getTransform(this.totalDist2+'px');
				this.startPosNext = this.totalDist2;
			}
		}else {//露出上一张
			if (this.hasPrev) {
				this.totalDist2 = this.startPosPrev + currentX - this.touchInitPos;

				this.$('#i-prev').style.cssText += this._getTransform(this.totalDist2+'px');
				this.startPosPrev = this.totalDist2;
			}
		}

		this.touchInitPos = currentX;
	},
	_touchend : function (e) {
		if(this.deltaX2 < -this.opts.triggerDist){
			this.next();
		}else if(this.deltaX2 > this.opts.triggerDist){
			this.prev();
		}else{
			this._itemReset();
		}
		this.deltaX2 = 0;
	},
    _getTransform:function (dist) {
        var pos= this.opts.isVertical? '0,'+dist : dist+',0';
        return ';-webkit-transform:' + (this.opts.useACC ? 'translate3d('+pos+',0)' : 'translate('+pos+')');
    },

    _itemReset:function () {
        this.$('#i-current').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform(0);
        if (this.$('#i-prev')) {
            this.$('#i-prev').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform('-'+this.scrollDist+'px');
        }
        if (this.$('#i-next')) {
           this.$('#i-next').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform(this.scrollDist+'px');
        }
		this.deltaX2 = 0;
    },

    _loading:function () {
        var self = this;
        var imgurls=this.opts.loadingImgs;
        var fallback=setTimeout(function () {
            try {
                self.opts.onloading.call(self,total,total);
            } catch (e) { }
            
            self._pageInit();
        },this.opts.loadingOverTime*1000);//loading超时时间  万一进度条卡那了 15秒后直接显示

        var imgs=[], loaded=1;
        var total=imgurls.length+1;
        for (var i=0; i<imgurls.length; i++) {
            imgs[i]=new Image();
            imgs[i].src=imgurls[i];
            imgs[i].onload=imgs[i].onerror=imgs[i].onabort=function (e) {
                loaded++;
                if (this.src === imgurls[0] && e.type === 'load') {
                    clearTimeout(fallback)
                }
                checkloaded();
                this.onload=this.onerror=this.onabort=null;
            }
        }

        try {
            self.opts.onloading.call(self,1,total);
        } catch (e) { }

        function checkloaded() {
            try {
                self.opts.onloading.call(self,loaded,total);
            } catch (e) { }
            if (loaded==total) {
                if (fallback) {
                    clearTimeout(fallback)
                }
                self._pageInit();
                imgs=null;
                if (self.opts.preLoadingImgs && self.opts.preLoadingImgs.length) {
                    self.preloading();
                }
            }
        }
    },
    /** 
     * 滑动到上一页
     * @example
        s1.prev();
     */
    prev:function () {
        var self = this;
        if (!this.$('#i-current') || !this.$('#i-prev')) {
            this._itemReset();
            return ;
        }
        if (this.index > 0) {
            this.index--;
        }else {
            this._itemReset();
            return false;
        }

        var nextIndex = this.index+1 > this.tplNum-1 ? 0 : this.index+1;

        if (this.$('#i-next')) {
            this.wrap.removeChild(this.$('#i-next'));
        }
        this.$('#i-current').id='i-next';
        this.$('#i-prev').id='i-current';
        this.$('#i-next').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform(this.scrollDist+'px');
        this.$('#i-current').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform(0);

        sessionStorage[this._sessionKey]=this.index;

        setTimeout(function () {

            if (self.$('.'+self.opts.playClass)) {
                self.removeClass(self.$('.'+self.opts.playClass),self.opts.playClass)
            }
            self.addClass(self.$('#i-current'),self.opts.playClass)

            try {
                self.opts.onslide.call(self,self.index);
            } catch (e) {
                console.info(e)
            }

            var prevIndex = self.index-1;
            if (prevIndex < 0) {
                prevIndex =  self.tplNum-1;
                return false;
            }

            var addItem = document.createElement('div');
            addItem.className='js-iSlider-item '+self.tpl[prevIndex].className;
            addItem.id='i-prev';
            addItem.style.cssText+='-webkit-transition-duration:0ms;'+self._getTransform('-'+self.scrollDist+'px');

            addItem.innerHTML=self.tpl[prevIndex].innerHTML;

            self.wrap.insertBefore(addItem,self.$('#i-current'));

        },this._delayTime)

    },

    /** 
     * 滑动到下一页
     * @example
        s1.next();
     */
    next:function () {
        var self = this;
        if (!this.$('#i-current') || !this.$('#i-next')) {
            this._itemReset();
            return ;
        }

        if (this.index < this.tplNum-1) {
            this.index++;
        }else {
            this._itemReset();
            return false;
        }
        
        var prevIndex = this.index===0 ? this.tplNum-1 : this.index-1;

        if (this.$('#i-prev')) {
            this.wrap.removeChild(this.$('#i-prev'));
        }
        this.$('#i-current').id='i-prev';
        this.$('#i-next').id='i-current';
        this.$('#i-prev').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform('-'+this.scrollDist+'px');
        this.$('#i-current').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this._getTransform(0);
        sessionStorage[this._sessionKey]=this.index;
        setTimeout(function () {

            if (self.$('.'+self.opts.playClass)) {
                self.removeClass(self.$('.'+self.opts.playClass),self.opts.playClass)
            }
            self.addClass(self.$('#i-current'),self.opts.playClass)

            try {
                self.opts.onslide.call(self,self.index);
            } catch (e) {
                console.info(e)
            }

            var nextIndex = self.index+1;
            if (nextIndex >= self.tplNum) {
                return false;
            }

            var addItem = document.createElement('div');
            addItem.className='js-iSlider-item '+self.tpl[nextIndex].className;
            addItem.id='i-next';
            addItem.style.cssText+='-webkit-transition-duration:0ms;'+self._getTransform(self.scrollDist+'px');
            addItem.innerHTML=self.tpl[nextIndex].innerHTML;

            self.wrap.appendChild(addItem);

        },this._delayTime)

    },
    /** 
     * 跳转到指定页码
     * @param {number} index 页码 从0开始的
     * @example
        s1.slideTo(3);
     */
    slideTo:function (index) {
        this._setHTML(index);
        this._pageInit();
    }

}

if (typeof module == 'object') {
    module.exports=iSlider;
}else {
    window.iSlider=iSlider;
}

