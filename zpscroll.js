(function(win, doc, $) {
    function CusScrollBar(options) {
        this._init(options);
    }
    // CusScrollBar.prototype._init = function() {
    //     console.log("test");
    // }
    $.extend(CusScrollBar.prototype, {
        _init: function(options) {
            var self = this;

            self.options = {
                scrollDir: "y", // 滚动的方向
                contSelector: "", // 滚动内容选择器
                barSelector: "", // 滚动条选择器
                sliderSelector: "", // 滚动滑块选择器
                tabItemSelector: ".tab-item", // 标签选择器
                tabActiveClass: "tab-active", // 选中标签名
                ahchorSelector: ".anchor", // ⚓️点选择器
                correctSelector: ".correct-bot", //矫正元素
                articleSelector: ".scroll-ol", //文章选择器
                wheelStep: 10 //滚轮步长
            }

            $.extend(true, self.options, options || {});

            console.log(self.options.contSelector);
            this._initDomEvent();
            return self;
        },
        /**
         * 初始化DOM引用
         */

        _initDomEvent: function() {
            var opts = this.options;
            // 滚动内容对象 ，必填项
            this.$cont = $(opts.contSelector);
            //滚动条滑块儿对象
            this.$slider = $(opts.sliderSelector);
            // 滚动条对象
            this.$bar = opts.barSelector ? $(opts.barSelector) :
                self.$slider.parent();
            // 标签页
            this.$tabItem = $(opts.tabItemSelector);
            // ⚓️点项
            this.$anchor = $(opts.correctSelector);
            // 正文
            this.$article = $(opts.articleSelector);
            // 矫正元素对象
            this.$correct = $(opts.correctSelector);
            // 文档对象
            this.$doc = $(doc);

            this._initSliderDragEvent()
                ._initTabEvent()
                ._initArticleHeight()
                ._bindContScroll()
                ._bindMousewheel();
        },
        /**
         * 初始化滑块滑动功能
         * @return {[object]} [this]
         */
        _initSliderDragEvent: function() {
            var self = this,
                slider = this.$slider,
                sliderEl = slider[0];
            var doc = this.$doc,
                dragStartPagePosition,
                dragStartScrollPosition,
                dragContBarRate;

            function mousemoveHandler(e) {
                e.preventDefault();
                console.log("mousemove");
                if (dragStartPagePosition == null) {
                    return;
                }
                self.scrollTo(dragStartScrollPosition + (e.pageY -
                        dragStartPagePosition) *
                    dragContBarRate);
            }
            if (sliderEl) {
                slider.on("mousedown", function(e) {
                    e.preventDefault();
                    console.log("mousedown");
                    dragStartPagePosition = e.pageY;
                    dragStartScrollPosition = self.$cont[
                        0].scrollTop;
                    dragContBarRate = self.getMaxScrollPosition() /
                        self.getMaxSliderPosition();
                    console.log(self.getMaxScrollPosition());
                    doc.on("mousemove.zpScroll",
                            mousemoveHandler)
                        .on("mouseup.zpScroll",
                            function(e) {
                                console.log(
                                    "mousemove mouseup"
                                );
                                doc.off('.zpScroll');
                            });
                });
            }

            return self;
        },

        /**
         * 初始化标签功能
         * @return {[object]} [this]
         */
        _initTabEvent: function() {
            var self = this;
            self.$tabItem.on("click", function(e) {
                e.preventDefault();
                var index = $(this).index();
                self.changeTabSelect(index);

                self.scrollTo(self.$cont[0].scrollTop +
                    self.getAnchorPosition(index));
            })
            return self;
        },
        /**
         * 初始化文档高度
         * @return {[object]} [this]
         */
        _initArticleHeight: function() {
            var self = this,
                lastArticle = self.$article.last();
            var lastArticleHeight = lastArticle.height(),
                contHeight = self.$cont.height();
            if (lastArticleHeight < contHeight) {
                self.$correct[0].style.height = contHeight -
                    lastArticleHeight - self.$anchor.outerHeight() +
                    "px";
            }

            return self;
        },
        /**
         * 切换选中的标签
         * @return {[type]} [description]
         */
        changeTabSelect: function(index) {
            var self = index,
                active = self.options.tabActiveClass;
            return self.$tabItem.eq(index).addClass(active).siblings()
                .removeClass(active);
        },
        // 监听内容的滚动，同步滑块的位置
        _bindContScroll: function() {
            var self = this;
            self.$cont.on("zpScroll", function() {
                var sliderEl = self.$slider && self.$slider[
                    0];

                if (sliderEl) {
                    sliderEl.style.top = self.getSliderPosition() +
                        "px";
                    console.log(self.getSliderPosition());
                }
            });
            return self;
        },
        /**
         * 绑定鼠标滚轮事件
         * @return {[type]} [description]
         */
        _bindMousewheel: function() {
            var self = this;

            self.$cont.on("mousewheel DOMMouseScroll",
                function(e) {
                    e.preventDefault();
                    var oEv = e.originalEvent,
                        wheelRange = oEv.wheelDelta ? -oEv.wheelDelta /
                        120 : (oEv.detail || 0) / 3;
                    self.scrollTo(self.$cont[0].scrollTop +
                        wheelRange * self.options.wheelStep
                    )
                });
            return self;
        },
        // 获取指定⚓️点到上边界的像素数
        getAnchorPosition: function(index) {
            return this.$anchor.eq(index).position().top;
        },
        // 获取每个⚓️点的位置信息的数组
        getAllAnchorPosition: function() {
            var self = this,
                allPositionArr = [];
            for (var i = 0; i < self.$anchor.length; i++) {
                allPositionArr.push(self.$cont[0].scrollTop +
                    self.getAnchorPosition(i));
            }
            return allPositionArr;
        },
        // 计算滑块儿的当前的位置
        getSliderPosition: function() {
            var self = this,
                maxSliderPosition = self.getMaxSliderPosition();
            return Math.min(maxSliderPosition,
                maxSliderPosition * self.$cont[0].scrollTop /
                self.getMaxScrollPosition());
        },
        // 内容可滚动的高度
        getMaxScrollPosition: function() {
            var self = this;
            return Math.max(self.$cont.height(), self.$cont[0].scrollHeight) -
                self.$cont.height();
        },
        // 滑块可移动的距离
        getMaxSliderPosition: function() {
            var self = this;
            return self.$bar.height() - self.$slider.height();
        },
        scrollTo: function(positionVal) {
            var self = this;
            var posArr = self.getAllAnchorPosition();
            // 滚动条的位置与tab标签的对应
            function getIndex(positionVal) {
                for (var i = posArr.length - 1; i >= 0; i--) {
                    if (positionVal >= posArr[i]) {
                        return i;
                    } else {
                        continue;
                    }
                }
            }
            // ⚓️点数与标签数相同
            if (posArr.length == self.$tabItem.length) {
                self.changeTabSelect(getIndex(positionVal));
            }

            self.$cont.scrollTop(positionVal);
        }
    })
    win.CusScrollBar = CusScrollBar;
})(window, document, jQuery);

var scroll1 = new CusScrollBar({
    contSelector: ".scroll-wrap", //滚动内容区域
    barSelector: ".scroll-bar", // 滚动条
    sliderSelector: ".scroll-slider" // 滚动滑块
});
