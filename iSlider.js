
/**
 * iSlider 通用全屏滑动切换动画组件 
 * @namespace iSlider
 * @example

    //普通用法
    iSlider.init({
        container:'#demo1',
        item:'.item',
        onSlide:function () {
            console.info(this.index)
        }
    });
    

    //带loading进度条用法
    iSlider.init({
        container:'#demo1',
        onSlide:function () {
            console.info(this.index)
        },
        loadingId:'#loading',
        loadingImgs:[
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/open_cover.jpg?max_age=2592000',
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/im_cover.jpg?max_age=2592000',
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/bg1.jpg?max_age=2592000',
            'http://imgcache.gtimg.cn/mediastyle/mobile/event/20141118_ten_jason/img/bg2.jpg?max_age=2592000'
        ],
        preLoadingImgs:[],
        onLoading:function (complete,total) {
            this.$('#loading div').style.width=complete/total*100+'%';
        }
    });

    imgcache引用地址: http://imgcache.gtimg.cn/music/h5/lib/js/module/iSlider-1.0.min.js?_bid=363&max_age=2592000
 * 
 * 
 * 没有依赖
 * @date 2014/11/3 星期一
 * @author rowanyang
 * 
 */

;(function (win) {

var raf = function (cb) {setTimeout(function (){cb()},100)};

//android上用了raf也没啥效果  所以只对高富帅用
if (/iPhone|iPod|iPad/.test(navigator.userAgent)) {
    raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || raf;
}

var iSlider = {
    opts:{
        speed:400, //滑屏速度
        triggerDist:30,//触发滑动的手指移动最小位移
        isVertical:true,//垂直滑还是水平滑动
        loadingImgs:[],
        preLoadingImgs:[],
        onSlide:function () {},//滑动回调 参数是本对象
        onLoading:function () {}
    },
    wrap:null,
    tplNum:0,
    tpl:[],
    index : 0,

    $:function (o) {
        return document.querySelector(o);
    },
    /**
     * 组件初始化
     * @method iSlider.init
     * @param {object} opts
     * @param {string} opts.container 容器
     * @param {string} opts.item  滚动单元的元素
     * @param {number} [opts.speed] 动画速度
     * @param {boolean} [opts.isVertical=true] 滑动方向 是否是垂直方向 默认是.
     * @param {function} [opts.onSlide]  滑动后回调函数
     * @param {string} [opts.loadingId]  显示loading的容器id
     * @param {array} [opts.loadingImgs]  loading需要加载的图片地址列表
     * @param {function} [opts.onLoading]  loading时每加载完成一个图片都会触发这个回调  回调时参数值为 (已加载个数,总数)
     * 
     */
	init:function (opts) {
		var self = this;

        for (var i in opts) {
            this.opts[i]=opts[i];
        }

        this.wrap=this.$(this.opts.container);

        this.tpl= this.wrap.cloneNode(true);

        this.tpl=opts.item ? this.tpl.querySelectorAll(opts.item) : this.tpl.children;

        this.tplNum=this.tpl.length; //总页数数据

		this.touchInitPos = 0;//手指初始位置
		this.startPos = 0;//移动开始的位置
		this.totalDist = 0,//移动的总距离
		this.deltaX1 = 0;//每次移动的正负
		this.deltaX2 = 0;//每次移动的正负
        
        this.displayWidth = document.documentElement.clientWidth; //图片区域最大宽度
        this.displayHeight = document.documentElement.clientHeight; //图片区域最大高度

        this.scrollDist=this.opts.isVertical ? this.displayHeight : this.displayWidth;//滚动的区域尺寸 
        
        this.wrap.innerHTML=
            '<div id="current" class="js-iSlider-item '+this.tpl[0].className+'" style="'+this.getTransform(0)+'">'+this.tpl[0].innerHTML+'</div>'+
            '<div id="next" class="js-iSlider-item '+this.tpl[1].className+'" style="'+this.getTransform('100%')+'">'+this.tpl[1].innerHTML+'</div>';
        this.wrap.style.cssText+="display:block;position:relative;width:100%;height:100%";

        if (this.opts.loadingImgs && this.opts.loadingImgs.length) {
            this.loading();
        }else {
            this.pageInit();
        }

		this.$('body').addEventListener('touchstart',function (e) {
			self.touchstart(e);
		},false);
		this.$('body').addEventListener('touchmove',function (e) {
			self.touchmove(e);
		},false);
		this.$('body').addEventListener('touchend',function (e) {
			self.touchend(e);
		},false);
		this.$('body').addEventListener('touchcancel',function (e) {
			self.touchend(e);
		},false);

        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

        var s = document.createElement('style');
        s.innerHTML = 'html,body{width:100%;height:100%} .js-iSlider-item{position:absolute;left:0;top:0;width:100%;height:100%}';
        document.head.appendChild(s);
        s = null;
	},
    pageInit:function () {
        var self = this;
        raf(function () {
            self.$('#current').className+=' play';
        });
    },
	touchstart : function (e) {
		if(e.touches.length !== 1){return;}//如果大于1个手指，则不处理
		this.touchInitPos = this.opts.isVertical ? e.touches[0].pageY:e.touches[0].pageX; // 每次move的触点位置
		this.deltaX1 = this.touchInitPos;//touchstart的时候的原始位置

		this.startPos = 0;
		this.startPosPrev = -this.scrollDist;
		this.startPosNext = this.scrollDist;
		this.hasPrev = !!this.$('#prev');
		this.hasNext = !!this.$('#next');
		//手指滑动的时候禁用掉动画
		if (this.hasNext) {
			this.$('#next').style.cssText+='-webkit-transition-duration:0;'
		}

		this.$('#current').style.cssText+='-webkit-transition-duration:0;'
		if (this.hasPrev) {
			this.$('#prev').style.cssText+='-webkit-transition-duration:0;'
		}
	},
	touchmove : function (e) {
		if(e.touches.length !== 1){return;}

		var currentX = this.opts.isVertical ? e.touches[0].pageY:e.touches[0].pageX;
		this.deltaX2 = currentX - this.deltaX1;//记录当次移动的偏移量
		this.totalDist = this.startPos + currentX - this.touchInitPos;

		this.$('#current').style.cssText+=this.getTransform(this.totalDist+'px');
		this.startPos = this.totalDist;
		
		//处理上一张和下一张
		if (this.totalDist<0) {//露出下一张
			if (this.hasNext) {
				this.totalDist2 = this.startPosNext + currentX - this.touchInitPos;

				this.$('#next').style.cssText += this.getTransform(this.totalDist2+'px');
				this.startPosNext = this.totalDist2;
			}
		}else {//露出上一张
			if (this.hasPrev) {
				this.totalDist2 = this.startPosPrev + currentX - this.touchInitPos;

				this.$('#prev').style.cssText += this.getTransform(this.totalDist2+'px');
				this.startPosPrev = this.totalDist2;
			}
		}

		this.touchInitPos = currentX;
	},
	touchend : function (e) {

		if(this.deltaX2 < -this.opts.triggerDist){
			this.next();
		}else if(this.deltaX2 > this.opts.triggerDist){
			this.prev();
		}else{
			this.itemReset();
		}
		this.deltaX2 = 0;
	},
    getTransform:function (dist) {
        return ';-webkit-transform:translate3d('+(this.opts.isVertical? '0,'+dist : dist+',0')+',0)';
    },

    itemReset:function () {
        this.$('#current').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform(0);
        if (this.$('#prev')) {
            this.$('#prev').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform('-'+this.scrollDist+'px');
        }
        if (this.$('#next')) {
           this.$('#next').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform(this.scrollDist+'px');
        }
		this.deltaX2 = 0;
    },

    prev:function () {
        if (!this.$('#current') || !this.$('#prev')) {
            this.itemReset();
            return ;
        }
        var self = this;
        if (this.index > 0) {
            this.index--;
        }else {
            this.itemReset();
            return false;
        }

        var nextIndex = this.index+1 > this.tplNum-1 ? 0 : this.index+1;

        if (this.$('#next')) {
            this.wrap.removeChild(this.$('#next'));
        }
        this.$('#current').id='next';
        this.$('#prev').id='current';
        this.$('#next').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform(this.scrollDist+'px');
        this.$('#current').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform(0);

        raf(function () {

            if (self.$('.play')) {
                self.$('.play').className=self.$('.play').className.replace(/\s*\bplay\b/g,'');
            }
            self.$('#current').className +=' play';

            self.opts.onSlide.call(self);

            var prevIndex = self.index-1;
            if (prevIndex < 0) {
                prevIndex =  self.tplNum-1;
                return false;
            }

            var addItem = document.createElement('div');
            addItem.className='js-iSlider-item '+self.tpl[prevIndex].className;
            addItem.id='prev';
            addItem.style.cssText+='-webkit-transition-duration:0ms;'+self.getTransform('-'+self.scrollDist+'px');

            addItem.innerHTML=self.tpl[prevIndex].innerHTML;

            self.wrap.insertBefore(addItem,self.$('#current'));

        })

    },

    next:function () {
        if (!this.$('#current') || !this.$('#next')) {
            this.itemReset();
            return ;
        }

        var self = this;
        if (this.index < this.tplNum-1) {
            this.index++;
        }else {
            this.itemReset();
            return false;
        }
        
        var prevIndex = this.index===0 ? this.tplNum-1 : this.index-1;

        if (this.$('#prev')) {
            this.wrap.removeChild(this.$('#prev'));
        }
        this.$('#current').id='prev';
        this.$('#next').id='current';
        this.$('#prev').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform('-'+this.scrollDist+'px');
        this.$('#current').style.cssText+='-webkit-transition-duration:'+this.opts.speed+'ms;'+this.getTransform(0);
       
        raf(function () {

            if (self.$('.play')) {
                self.$('.play').className=self.$('.play').className.replace(/\s*\bplay\b/g,'');
            }
            self.$('#current').className +=' play';

            self.opts.onSlide.call(self);

            var nextIndex = self.index+1;
            if (nextIndex >= self.tplNum) {
                return false;
            }

            var addItem = document.createElement('div');
            addItem.className='js-iSlider-item '+self.tpl[nextIndex].className;
            addItem.id='next';
            addItem.style.cssText+='-webkit-transition-duration:0ms;'+self.getTransform(self.scrollDist+'px');
            addItem.innerHTML=self.tpl[nextIndex].innerHTML;

            self.wrap.appendChild(addItem);

        })

    },
    loading:function () {
        var self = this;
        var imgurls=this.opts.loadingImgs;
        var fallback=setTimeout(this.pageInit,15*1000);//超时时间  万一进度条卡那了 15秒后直接显示

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
            }
        }

        self.opts.onLoading.call(self,1,total);

        function checkloaded() {
            self.opts.onLoading.call(self,loaded,total);
            if (loaded==total) {
                if (fallback) {
                    clearTimeout(fallback)
                }

                self.pageInit();

                imgs=null;
                if (self.opts.preLoadingImgs && self.opts.preLoadingImgs.length) {
                    self.preloading();
                }
            }
        }
    }

}

if (typeof module == 'object') {
    module.exports=iSlider;
}else {
    win.iSlider=iSlider;
}

})(window);
