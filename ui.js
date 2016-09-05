/* 문자열 마지막 글자 제거 */
String.prototype.removeLast = function() {return this.slice(0, -1); }

/* format 함수 추가. 숫자 3단위마다 ',' 삽입 */
Number.prototype.format = function () {  
    if (this == 0) return 0;
     
    var reg = /(^[+-]?\d+)(\d{3})/,
    n = (this + '');
 
    while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');  
 
    return n;  
};

(function ($, win, doc) {

    'use strict';

    var $win = $(win), $doc = $(doc);

    /**
    * [preventActions 기본 이벤트 차단]
    * @param  {Event} ev [DOM 클릭 이벤트 객체]
    * @return {null}     [null]
    */
    $.preventActions = function (ev) {
        ev = ev || window.event;
        if (ev.stopPropagation && ev.preventDefault) {
            ev.stopPropagation();
            ev.preventDefault();
        } 
        else {
            ev.cancelBubble = true;
            ev.returnValue = false;
        }
    }

    /**
    * [getViewportOffset 뷰포트 영역캐치]
    * @param  {jQuery} $el        [위치 확인 대상 - 뷰포트 영역에 들어갔는지 여부.]
    * @return {Object} literal    [description]
    */
    $.getViewportOffset = function ($el) {
        var $win = $(window),
            scrollLeft  = $win.scrollLeft(),
            scrollTop   = $win.scrollTop(),
            offset      = $el.offset(),
            rect1 = { x1: scrollLeft, y1: scrollTop, x2: scrollLeft + $win.width(), y2: scrollTop + $win.height() },
            rect2 = { x1: offset.left, y1: offset.top, x2: offset.left + $el.width(), y2: offset.top + $el.height() };

        return {
            left: offset.left - scrollLeft,
            top: offset.top - scrollTop,
            insideViewport: rect1.x1 < rect2.x2 && rect1.x2 > rect2.x1 && rect1.y1 < rect2.y2 && rect1.y2 > rect2.y1
        };
    }

    /**
     * get Date 객체
     * @return {Date} [description]
     */
    $.now = Date.now || function () {
        return new Date().getTime();
    };

    /**
     * [debounce description]
     * @param  {Function} func      [바인딩할 함수.]
     * @param  {Number}   wait      [함수 호출 인터벌]
     * @param  {Boolean}  immediate [초기 이벤트 발생등의 리스닝 여부]
     * @return {Function}           [해당 인터벌로 바인딩된 함수.]
     */
    $.debounce = function (func, wait, immediate) {
        var timeout, args, context, timestamp, result;

        var later = function() {
            var last = $.now() - timestamp;

            if (last < wait && last >= 0) {
                timeout = setTimeout(later, wait - last);
            } 
            else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                }
            }
        };

        return function () {
            context = this;
            args = arguments;
            timestamp = $.now();

            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);

            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
         
            return result;
        };
    }


    /**
     * [search 상단 검색 창 활성화 함수]
     * @param  {Object} settings [ {String} keywordInput : 인풋 요소 선택자,
     *                             {String} untriggers : 검색창 비활성화 요소(버튼등),
     *                             {String} submitBtn :  검색 서브밋 버튼 ]
     * @return {Object} jQuery   [ 제이쿼리 객체(self)]
     */
    $.fn.search = function (settings) {
        var options = $.extend(true,
        {
            keywordInput: '#keyword',
            untriggers: ['#btn_close_wrap'],
            submitBtn: '#submit'
        }, settings || {});

        var $owner = this;

        return this.each(function() {

            var c = {

                init: function() {

                    if($.isArray(options.untriggers)) {

                        $.each(options.untriggers, function(i, n) {$(n).on('click', c.hide); });
                    }
                    else if(!$.isArray(options.untriggers) && $.type(options.untriggers)==='string') {

                        $(options.untriggers).on('click', c.hide);
                    }

                    this.setInput();

                    $(options.submitBtn).on('click', function(){ $('#srchForm').submit(); })

                },

                show: function() {

                    var $menu_wrap = $('#menu_wrap');
                    if($menu_wrap.length) {$menu_wrap.removeClass('open').find('.dimm-close').removeClass('open'); }

                    var $body_container = $('#body-container');
                    if(!$body_container.hasClass('fixed')){ $body_container.addClass('fixed') }

                    $owner.addClass('open');
                    $(options.keywordInput).focus();

                },

                hide: function() {$owner.removeClass('open'); },

                halt: function() {$('#search_keyword').off('keyup blur click'); },

                setInput: function() {

                    $(options.keywordInput).focus();

                    var $search_keyword = $('#search_keyword')
                    .on('keyup', options.keywordInput, function() {
                        if(!$search_keyword.hasClass('on')){$search_keyword.addClass('on')};
                    })
                    .on('blur', options.keywordInput, function(ev) {
                        var val = ev.target.value;
                        if((/^\s*\s$/g).test(val) || !val.length) {
                            $search_keyword.removeClass('on');
                            ev.target.value='';
                        }
                    })
                    .on('click', '#btn_reset_keyword', function(ev) {
                        var $keyword = $search_keyword.removeClass('on').find('input[type=search]');

                        if($keyword.val().length){
                            $keyword.val('').focus();
                        }
                    })
                }
            }// end c object

            c.init();
            $(this).data('c', c);

        });//end return this function
    }

    /**
     * [categoryMenu 카테고리 메뉴]
     * @param  {Object} settings :
     *             {Object}  domSetup :
     *                 {Array, String}  trigger     [초기, 카테고리 메뉴를 보여주기 위한 이벤트 대상 노드]
     *                 {Array, String}  untrigger   [카테고리 메뉴 숨김 이벤트 대상 노드]
     *                 {String}      tpl_dep1    [depth1 용 템플릿 노드 아이디 선택자],
     *                 {String}      tpl_dep2    [depth2 용 템플릿 노드 아이디 선택자]
     *                 {String}      depth1_trigger  [depth1 이벤트 트리거 대상 노드 선택자],
     *                 {Boolean}     openDepth1ForDefault    [카테고리 메뉴 진입시 depth1 메뉴를 자동으로 보여줄지 여부],
     *                 {Object}      overlays    [setOverlay 함수를 통해 반환된 객체, 팝업 레이어의 overlay를 제어]
     *
     *          {Object}  ajaxSetup: [jQuery ajax 세팅과 동일, WapSiteUrl 속성 추가]
     *
     * @return {jquery} this      [Self]
     */
    $.fn.categoryMenu = function(settings)
    {
        var domSetup = $.extend(true,
        {
            trigger: '',
            tpl_dep1: '', tpl_dep2: '',
            depth1_trigger: '.depth01',
            untrigger: '',
            openDepth1ForDefault: true,
            overlays: null
        }, settings.domSetup || {});

        var ajaxSetup = $.extend(true,
        {
            url: ApiUrl + "/index.php?act=goods_class&op=getClassListAll",
            type: 'get',
            jsonp: 'callback',
            dataType: 'jsonp',
            WapSiteUrl: '',
            beforeSend: null, onComplete: null, onFail: null
        }, settings.ajaxSetup || {});

        var $owner = this;

        var conn =
        {
            data:[],
            WapSiteUrl: ajaxSetup.WapSiteUrl,
            initialize: false,
            init: function()
            {
                var that = this;

                if($.isFunction(ajaxSetup.beforeSend)) { ajaxSetup.beforeSend.call(this); }

                var promise = $.ajax(ajaxSetup)
                .done(function(result)
                {
                    this.initialize = true;

                    if($.isFunction(ajaxSetup.onComplete)) ajaxSetup.onComplete.call(this, promise, result);

                    that.data = result.datas.class_list;
                    that.setDepth1();
                })
                .fail(function(ev)
                {
                    if($.isFunction(ajaxSetup.onFail)) ajaxSetup.onFail.call(this, ev);
                })
            },

            setDepth1: function()
            {
                if(!this.initialize) this.initialize = true;

                var html = '';
                var that = this;

                for(var i =0, len = this.data.length; i < len ;++i)
                {
                    html += template.render(domSetup.tpl_dep1, {num: i});
                };
                $owner.append(html);

                $owner.on('click', domSetup.depth1_trigger, function(ev)
                {
                    $.preventActions(ev);

                    var $this = $(this),
                        $parent = $this.closest('li'),
                        $menu_container = $('.menu-container').eq(0),
                        ids = $this.attr('id').split('_'),
                        num = ids[ids.length - 1];

                    /* 7번째 메뉴 예외 처리 */
                    if(num==7) {window.location.href='/wapV02/product_list.html?gc_id=7625'; return false; }
                    /* 7번째 메뉴 예외 처리끝 */

                    if($parent.hasClass('on')) return;

                    if(!$('#dep2_'+num).length) that.render(num, $menu_container);

                    $owner.find('li').removeClass('on');
                    if($parent.hasClass('on')) {$parent.removeClass('on'); }
                    else {$parent.addClass('on');}

                    $('.step02').hide();
                    $('#dep2_'+num).show();
                });

                if(domSetup.openDepth1ForDefault)
                {
                    $owner.find(domSetup.depth1_trigger).eq(0).trigger('click');
                    domSetup.openDepth1ForDefault = false;
                }

                var $frame_dep1 = $('#frame_dep1'), sly_dep1;

                if($frame_dep1.data('sly')) 
                {
                    sly_dep1 = $frame_dep1.data('sly');
                    sly_dep1.reload();
                }
                else 
                {
                    sly_dep1 = new Sly($frame_dep1, {
                        slidee: '#id_category_one', itemNav: 'basic', smart: 1,
                        activateOn: 'click', mouseDragging: 1, touchDragging: 1, releaseSwing: 1,
                        startAt: 0, scrollBy: 1, speed: 300, elasticBounds: 1, 
                        dragHandle: 1, dynamicHandle: 1, clickBar: 1
                    });
                    sly_dep1.init();
                    $frame_dep1.data('sly', sly_dep1);
                }

                $win.on('resize', function() {
                    $frame_dep1.height($win.height() - 45)
                    sly_dep1.reload();
                })
                $win.trigger('resize');
            },

            createHTML: function(index)
            {
                this.data[index]['WapSiteUrl'] = this.WapSiteUrl;
                return template.render(domSetup.tpl_dep2, this.data[index]);
            },

            render: function(index, $container)
            {
                var html = this.createHTML(index);
                $container.append($(html).attr('id', 'dep2_'+index));

            }
        };

        return this.each(function()
        {
            $(this).data('category', conn);

            var triggers = domSetup.trigger;
            if(triggers.length > 0 && $.isArray(triggers))
            {
                triggers = triggers.join(', ');
            }

            $(triggers).on('click', function()
            {
                if(!conn.initialize) conn.init();

                if(overlays)
                {
                    if(!overlays.state) {overlays.show();}
                    else overlays.hide();
                }

                var tp = $win.scrollTop(),
                    dp = $doc.scrollTop(),
                    ty = 0;

                if( tp !== dp ) { ty = ( tp > dp ) ? tp : dp; }
                else ty = tp;
                
                $win.data('ty', ty);
                $('#body-container').hide();

            });

            var untriggers = domSetup.untrigger;

            if(untriggers.length > 0 && $.isArray(untriggers))
            {
                untriggers = untriggers.join(', ');
            }

            $(untriggers).on('click', function()
            {
                if(overlays)
                {
                    if(!overlays.state) {overlays.show();}
                    else overlays.hide();
                }
                var list_sly = $('#list_scroll').data('sly'),
                    tit_cate_sly = $('.tit-category-scroll').data('slide'),
                    prod_sly = $('#prod_scroll').data('slide'),
                    step2_scroll = 0;

                $('#body-container').show(100, function() {

                    $win.scrollTop($win.data('ty'));

                    if(list_sly) { list_sly.reload();}
                    if(tit_cate_sly) { tit_cate_sly.reload();}
                    if(prod_sly) { prod_sly.reload();}
                });

            })
        })
    }

    /**
    * [customRadio 커스텀 라디오 버튼
    * button 형태와 input[type=checkbox] 형태 두가지 option의 type 속성 참조 ( button 형태는 차후 추가)
    * <label for='id'>Text</label><input type='checkbox' id='id'>]
    *
    * @param  {Object}          settings [{String}   type             : 체크박스 타입인지 라디오버튼인지 타입 확인 ,
    *                                     {Boolean}  hasAllButton     : 전체 체크 버튼 여부,
    *                                     {String}   activeClassName  : 버튼 디자인 활성화 클래스명]
    * @param  {Function}        callback [라디오 버튼이 선택될때마다 호출되는 함수]
    * @return {jQuery Object}   this     [Self]
    */
    $.fn.customRadio = function(settings, callback) {

    if($.isFunction(settings))
    {
        callback = settings;
        settings = {};
    }

    var options = $.extend({
        type:'checkbox',
        hasAllButton: false,
        activeClassName: 'on'
    }, settings);

    return this.each(function()
    {
        var $this = $(this),
            $owner = $this,
            $lbls = $this.find('label'),
            $chkbox = $this.find('input');

            $this.on('init', function()
            {
                $lbls.removeClass(options.activeClassName).eq(0).addClass(options.activeClassName)
                $owner.data('value', $chkbox.prop('checked', false).next().prop('checked', true).val());
            });

            $chkbox.on('change', function()
            {
                var $this = $(this);
                if($this.prop('checked'))
                {
                    $lbls.removeClass(options.activeClassName)
                    $this.prev().addClass(options.activeClassName);
                }
                else
                {
                    $this.prev().removeClass(options.activeClassName);
                }
                $owner.data('value',$chkbox.filter(function(){return $(this).prop('checked')}).val());
                callback.call(this, $owner.data('value'));
            });
            $owner.data('value',$chkbox.filter(function(){return $(this).prop('checked')}).val());
    });
    };
    /* END Custom Radio Button */


    /**
     * [updateListByOption 장바구니 옵션 업데이트]
     * 상바구니 옵션 각 항목 선택시 썸네일, 가격, 재고항목 업데이트
     *
     * @param  {Object}  settings :
     *             {Deferred} ajaxSetup:
     *                 {String}   url: ApiUrl + "/index.php?act=goods&op=goods_option",
     *                 {String}   type: "get",
     *                 {String}   dataType: "html", 등 모든 ajax 통신 옵션
     *
     *             {jQuery} dom [관련 jquery element]
     *                 {jQuery} $thumb [썸네일 이미지],
     *                 {jQuery} $price [가격정보],
     *                 {jQuery} $stock [프로모션 가격정보]
     *
     *             {String or Number} spec_goods_id   [옵션 상품 아이디],
     *             {Function}         onInit          [초기화 이벤트 핸들러],
     *             {Function}         onUpdate        [옵션 선택시 호출되는 함수] - @return {Deferred} promise ]
     *
     * @return {jQuery}  this     [Self]
     */
    $.fn.updateListByOption = function(settings)
    {
        var options = $.extend( true,
        {
            spec_goods_id:'',
            ajaxSetup: {url: ApiUrl + "/index.php?act=goods&op=goods_option", type: "get", dataType: "html"},
            dom: {$thumb: this.find('img'), $price: this.find('.goods-item-price'), $stock: this.find('.stock-num')},
            onInit: function(){},
            onUpdate: function(){}
        }, settings);

        options.ajaxSetup['spec_goods_id'] = options.spec_goods_id;

        return this.each(function()
        {
             var promise = $.ajax(options.ajaxSetup)
                .done(function(result) {
                    var datas = (result.datas === void 0 || result.datas === null)? {src:'#', price:'201.00', stock: 748}: result.datas;
                    if (datas){
                    options.dom.$thumb.attr('src', datas.goods_image);
                    options.dom.$price.text('￥'+datas.goods_info.goods_price.toFixed(2));
                    options.dom.$stock.text('库存 : '+datas.goods_info.goods_storage);
                    options.onUpdate.call(this, promise);
                    }
                })
                .fail(function(){alert('Ajax Fail \r\n spec_goods_id = '+options.spec_goods_id)});
        })
    }

    /**
    * [productLayer 장바구니 레이어 팝업]
    * 스크롤 업 이후 닫기 버튼과 바탕 검은 배경 (.dimm-close)에 click 이벤트 핸들러 추가(one)로 현재 레이어 닫음
    * 화면 하단에서 스크롤 업 되는 형태
    *
    * @event  {String} click    [capture bubbling event - phase 3]
    * @param  {Object} settings [description]
    * @return {jQuery} this     [description]
    */
    $.fn.productLayer = function(settings)
    {
        var $body = $('body'),
            options = new (function(settings)
            {
                this.pocketWrap   = (settings.pocketWrap !== void 0) ? $(settings.pocketWrap) : $('#pocket_wrap');
                this.pocketBox    = this.pocketWrap.find('.ly-pocket-box');
                this.buttonClose  = this.pocketBox.find('.close');
                this.overlay      = this.pocketWrap.find('.dimm-close');
                this.tweenTime    = (settings.tweenTime !== void 0) ? settings.tweenTime : 350;
                this.prod_amount  = (settings.prod_amount !== void 0) ? settings.prod_amount : null;
                this.prod_options = (settings.prod_options !== void 0) ? settings.prod_options: null;
                this.keepValue    = (settings.keepValue !== void 0) ? settings.keepValue : true;
            })(settings);

        var triggers;
        if($.isArray(settings.buttons) && settings.buttons.length > 0) triggers = settings.buttons.join(', ');
        else if($.type(settings.buttons)==='string') triggers = settings.buttons;

        return this.each(function()
        {
            $(this).on('click', triggers, function(ev)
            {
                var type = $(ev.target).attr('class');
                switch(type)
                {
                    case 'btn-pack':
                    options.pocketWrap.find('.'+type).removeClass('hide').end().find('.btn-buydirectly').addClass('hide');
                    break;
                    case 'btn-buydirectly':
                    options.pocketWrap.find('.'+type).removeClass('hide').end().find('.btn-pack').addClass('hide');
                }
                $body.css('overflow', 'hidden');

                if(!options.keepValue)
                {
                    options.prod_options.trigger('init');
                    options.prod_amount.trigger('init');
                }

                options.pocketWrap.addClass('open');
                options.overlay.animate({opacity: 0.9}, options.tweenTime * 0.8)
                options.pocketBox.animate(
                    { height: 38.2 + 'rem' },
                    options.tweenTime,
                    function()
                    {
                    options.buttonClose.one('click', function()
                    {
                        options.pocketBox.animate({height: 0}, options.tweenTime)
                        options.overlay.animate({opacity: 0}, options.tweenTime, function(){options.pocketWrap.removeClass('open');$body.css('overflow', 'auto');});
                    });
                    options.overlay.one('click', function()
                    {
                        options.pocketBox.animate({height: 0}, options.tweenTime)
                        options.overlay.animate({opacity: 0}, options.tweenTime, function(){options.pocketWrap.removeClass('open');$body.css('overflow', 'auto');});
                    })
                    }
                )//End Animate
            })// End click Handler

            $(this).data('forceClose', function()
            {
                options.buttonClose.trigger('click');
                // options.overlay.trigger('click');
            })
        })// End each Loop
    };// END 장바구니 레이어

    /**
    * [productLayer 장바구니 레이어 팝업]
    * 스크롤 업 이후 닫기 버튼과 바탕 검은 배경 (.dimm-close)에 click 이벤트 핸들러 추가(one)로 현재 레이어 닫음
    * 화면 하단에서 스크롤 업 되는 형태
    *
    * @event  {String} click    [capture bubbling event - phase 3]
    * @param  {Object} settings [description]
    * @return {jQuery} this     [description]
    */
    $.fn.productLayer = function(settings)
    {
        var $body = $('body'),
            options = new (function(settings)
            {
                this.pocketWrap   = (settings.pocketWrap !== void 0) ? $(settings.pocketWrap) : $('#pocket_wrap');
                this.pocketBox    = this.pocketWrap.find('.ly-pocket-box');
                this.buttonClose  = this.pocketBox.find('.close');
                this.overlay      = this.pocketWrap.find('.dimm-close');
                this.tweenTime    = (settings.tweenTime !== void 0) ? settings.tweenTime : 350;
                this.prod_amount  = (settings.prod_amount !== void 0) ? settings.prod_amount : null;
                this.prod_options = (settings.prod_options !== void 0) ? settings.prod_options: null;
                this.keepValue    = (settings.keepValue !== void 0) ? settings.keepValue : true;
            })(settings);

        var triggers;
        if($.isArray(settings.buttons) && settings.buttons.length > 0) triggers = settings.buttons.join(', ');
        else if($.type(settings.buttons)==='string') triggers = settings.buttons;

        return this.each(function()
        {
            $(this).on('click', triggers, function(ev)
            {
                var type = $(ev.target).attr('class');
                switch(type)
                {
                    case 'btn-pack':
                        options.pocketWrap.find('.'+type).removeClass('hide').end().find('.btn-buydirectly').addClass('hide');
                    break;
                    case 'btn-buydirectly':
                        options.pocketWrap.find('.'+type).removeClass('hide').end().find('.btn-pack').addClass('hide');
                }
                $body.css('overflow', 'hidden');

                if(!options.keepValue)
                {
                    options.prod_options.trigger('init');
                    options.prod_amount.trigger('init');
                }

                options.pocketWrap.addClass('open');
                options.overlay.animate({opacity: 0.9}, options.tweenTime * 0.8)
                options.pocketBox.animate(
                    { height: 38.2 + 'rem' },
                    options.tweenTime,
                    function()
                    {
                        options.buttonClose.one('click', function()
                        {
                            options.pocketBox.animate({height: 0}, options.tweenTime)
                            options.overlay.animate({opacity: 0}, options.tweenTime, function(){options.pocketWrap.removeClass('open');$body.css('overflow', 'auto');});
                        });
                        options.overlay.one('click', function()
                        {
                            options.pocketBox.animate({height: 0}, options.tweenTime)
                            options.overlay.animate({opacity: 0}, options.tweenTime, function(){options.pocketWrap.removeClass('open');$body.css('overflow', 'auto');});
                        })
                    }
                )//End Animate
            })// End click Handler
            $(this).data('forceClose', function()
            {
                options.buttonClose.trigger('click');
                // options.overlay.trigger('click');
            })
        })// End each Loop
    };// END 장바구니 레이어



    /**
     * [productAmount]
     * 장바구니 및 바로 구매시 수량 선택
     *
     * @default [1]
     * @return {jQuery Object} [self]
     */
    $.fn.productAmount = function()
    {
        return this.each(function()
        {
            $(this).on('click', '.count', function()
             {
                var $this = $(this),
                    btnName = $this.attr('class').split(' ')[1],
                    $buy_num = $this.parent().find('.buy-num'),
                    sum = $buy_num.val(),
                    max_product = parseInt($this.siblings('#max_product').val()),
                    tariff_limit_num = parseFloat($this.siblings('#tariff_limit_num').val()),
                    daily_max_amount = parseFloat($this.siblings('#daily_max_amount').val()),
                    notice_cn = $this.siblings('#notice_cn').val(),
                    goods_price = parseFloat($this.siblings('#goods_price').val());
                switch(btnName)
                {
                    case 'minus': sum--; break;
                    case 'plus': sum++; break;
                }
                var order_amount = parseFloat(goods_price*(sum));
                if((max_product !='' && max_product !=0) || order_amount > parseFloat(daily_max_amount) || tariff_limit_num) {
                    var content = '';
                    if (sum != 1) {
                        if (tariff_limit_num) {
                            if (sum > tariff_limit_num) {
                                content = '进口商品的购买数量限制为' + tariff_limit_num + '个';
                            }
                        }
                        if (content =='') {
                            if ((daily_max_amount !=0 && order_amount > parseFloat(daily_max_amount)) || (sum > max_product)) {
                                content = notice_cn;
                            }
                        }
                        if (content !='') {
                            $.sDialog({
                                 skin: "red",
                                 content: content,
                                 okBtn: false,
                                 cancelBtn: false
                             });
                            return;
                        }
                    }
                }
                if(sum <= 1) sum = 1;

                $buy_num.val(sum);
             }).on('init', function()
             {
                 $(this).parent().find('.buy-num').val(1);
             })
        })
    };

    /**
    * [showReview 상품평 레이어 -
    * 상품평 탭에서 썸네일 이미지 클릭시 노출되는 슬라이드 레이어]
    *
    * @event  {String}      click    [클릭 이벤트 리스닝]
    * @param  {Object}      settings [eventType {String}: 이벤트 타입,
    *                                target {String}: 클릭 이벤트 대상 제이쿼리 선택자]
    * @param  {Function}    callback [Ajax 통신을 하는 함수. product_detail 등 프론트 html 에서 선언된 함수 객체를 매개변수로 받음]
    * @param  {Deffered}    promise  [반환되는 ajax 객체]
    * @return {jQuery}      this     [Self]
    */
    $.fn.showReview = function(settings, callback, promise)
    {
        if($.isFunction(settings))
        {
            callback = settings;
            settings  = {};
        }

        var options = $.extend({eventType: 'click', target: '.thum-review a'}, settings);

        if(promise === void 0 || promise === null) promise = $.Deferred();

        function showReviewPop()
        {
            var $body        = $('body').css('overflow', 'hidden'),
                $review_wrap = $('.ly-review-wrp').addClass('open'),
                slider       = $('.ly-review-slide ol').bxSlider({ mode: 'horizontal', pause: 3000, speed: 500, pager: true, controls: false});

            $('.dimm-close, .ly-review-slide').one('click', function()
            {
                $body.css('overflow','auto');
                $review_wrap.removeClass('open');
                slider.destroySlider();
            })
        }

        return this.each(function()
        {
            $(this).on(options.eventType, options.target, function(ev)
            {
                $.preventActions(ev);

                var geval_id = $(this).attr('href'),
                    promise = callback.call(this, geval_id);

                promise.done(function() {showReviewPop(); })
                .fail(function() {if(geval_id === void 0 || geval_id === null || geval_id.length <= 0) {showReviewPop(); } })
            })// End Event Handler
        })
    }

   /**
    * [zoomIn 레이어 썸네일]
    * 장바구니 및 즉시 구매 레이어에서 상단 썸네일 클릭시 해당 이미지를 전체 사이즈로 노출,
    * 사용자의 터치제스처로 확대 축소 가능하도록 viewport 조절.
    *
    * @param  {Object} options [description]
    * @return {jQuery} this    [description]
    */
    $.fn.zoomIn = function(options)
    {
        var $viewport = $('meta[name="viewport"]'),
            options = $.extend({ eventType: 'click', eventTarget:'a', el: null}, options);

        return this.each(function()
        {
            $(this).on('click', options.target, function()
            {
                var ids = $(this).attr('href');
                options.el  = (options.el === null || options.el === void 0)? $('.ly-img-wrp', ids) : options.el;

                if(!options.el.hasClass('open'))
                {
                    $viewport.attr('content', 'width=device-width, initial-scale=1.0, user-scalable=yes');

                    options.el.addClass('open').one('click', function()
                    {
                        $viewport.attr('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                        options.el.removeClass('open');
                    })
                }
            })//End Click Handler
        })
    }

   /**
    * [showMoreItem 판다플레이 아이템 더 보기]
    * @param  {Object}  settings :
    *             {Object} ajaxSetup :
    *                 {String}   url  [요청 주소],
    *                 {Object}   data : {Number} turn_cnt [현재페이지 카운터 1(default)],
    *                 {String}   dataType, type 등 ajax 세팅에 관련된 모든 옵션 (jQuery api),
    *                 {Number}   goods_total_cnt [아이템 총개수]
    *             {String}  tpl   [비동기 통신 로드완료시 렌더링 될 html 템플릿],
    *             {String}  item  [비동기 통신시 추가되는 html 노드 타입 ex: li],
    *             {String}  fired [아이템 추가 버튼등의 trigger],
    *             {String}  scrollBar   [리스트 스크롤바 - 가로 스크롤 리스트만 적용],
    *             {Boolean}  isContinuousAjax  [아이템을 추가할때 ajax 통신을 통해 서버로부터 데이터를 받을지 아니면 초기 통신시 받은 데이터에서 추출하여 추가할지 여부],
    *             {Boolean}  hasItemAddMotion  [아이템의 추가시 초가되는 모션 여부],
    *             {Number}   dummyDataViewCount [isContinuousAjax false 시 아이템 추가 개수],
    *             {Boolean}  hasDefaultView     [새로운 아이템 로드시 서버통신 여부,
    *                                             false - 초기화시 전달된 데이터를 기반으로 아이템 추가, true - 서버에서 데이터 로드]
    *
    * @param  {Object Json}  dummy [ajax 통신 실패시 dummy 로 노출되는 샘플용, 혹은 isContinuousAjax 가 false 일때 추가 아이템에서 사용되는 데이터 ]
    * @return {jQuery}  this  [제이쿼리 객체 반환]
    */
    $.fn.showMoreItem = function(settings, dummy)
    {
        var options = $.extend(true,
        {
            ajaxSetup: { url:'', data:{"turn_cnt": 1}, dataType:'json', type:'get', goods_total_cnt: 0 },
            tpl:'template_id',
            item: 'li',
            fired: null, direction: '',
            scrollTimeForVertical: 600,
            scrollBar: '',
            hasDefaultView: false, hasItemAddMotion: true, itemAddMotionType: 2,
            isContinuousAjax: true, dummyDataViewCount: 10,
            onComplete: function(){},
            onFail: function(){}
        } ,settings || {});

        var add_item_len = 0;

        var addItem =
        {
            owner: this,
            data: [],
            lastItemLength: options.ajaxSetup.goods_total_cnt,
            getData: function()
            {
                var that = this;

                if(options.isContinuousAjax)
                {
                    options.ajaxSetup.beforeSend = function() {options.ajaxSetup.data['turn_cnt']+=1; }

                    var promise = $.ajax(options.ajaxSetup)
                    .done(function(result)
                    {
                        options.onComplete.call(promise);

                        that.data = result.object;
                        if(that.data) add_item_len = that.data.length;

                        that[options.direction](that.createHTML());
                    })
                    .fail(function()
                    {
                        options.onFail.call(promise);
                        if(dummy !== void 0 && isObject(dummy))
                        {
                            that.data = dummy;
                            that[options.direction](that.createHTML());
                        }
                    })
                }
                else
                {
                    if(dummy !== void 0 && $.isArray(dummy) )
                    {
                        that.data = dummy.splice(0, options.dummyDataViewCount);
                        add_item_len = that.data.length;

                        if(add_item_len) that[options.direction](that.createHTML());
                    }
                }
            },

            createHTML: function()
            {
                var html = '';
                var len = this.data ? this.data.length: 0;

                for(var i = 0; i < len; ++i)
                {
                    html += template.render(options.tpl, this.data[i]);
                }
                return html;
            },

            vertical: function(html)
            {
                var that = this;
                /* 버튼으로 아이템 추가시 */
                if(options.fired!==null && options.fired!== void 0)
                {
                    if(this.lastItemLength)
                    {
                        this.add(html);
                    }
                    else
                    {
                        var $items   = this.owner.find(options.item),
                            $btn     = $(options.fired),
                            $html    = $('html'),
                            single_h = $items.outerHeight(),
                            total_h  = single_h * $items.length;

                        if($btn.hasClass('btn-show-all'))
                        {
                            this.owner.animate({height: single_h}, 600)
                            $html.animate({scrollTop:this.owner.offset().top - 45}, options.scrollTimeForVertical)
                            $btn.removeClass('btn-show-all').text('열기')
                        }
                        else
                        {
                            this.owner.animate({height: total_h}, 600);
                            $btn.addClass('btn-show-all').text('닫기');
                        }
                    }
                }
                else
                {
                    if(html!==void 0 && html) this.add(html);

                    var $win = $(window),
                        $doc = $(document);

                    $win.on('scroll', function()
                    {
                        var diff = $doc.height() - $win.height();
                        if(Math.abs($win.scrollTop() - diff) <= 2)
                        {
                            that.getData();
                        }
                    });
                }
            },

            add: function(html)
            {
                if(options.direction === 'vertical')
                {
                    var $lis       = this.owner.append(html).find(options.item);

                    this.lastItemLength -= add_item_len;

                    if(options.hasItemAddMotion)
                    {
                        switch(options.itemAddMotionType)
                        {
                            case 1:
                                var alpha      = options.hasItemAddMotion? 0 : 1,
                                    $slided_li = $lis.slice(add_item_len * -1 ).css('opacity', 0),
                                    h          = this.owner.find(options.item).outerHeight() * $lis.length,
                                    ty         = $slided_li.eq(0).offset().top - 45,
                                    d          = 0

                                $('html').animate({scrollTop: ty}, options.scrollTimeForVertical);

                                $slided_li.each(function(i)
                                {
                                    $(this).css({left: '10%'}).delay(d + (120 * i)).animate({opacity: 1, left: 0}, 300)
                                })
                                this.owner.delay(d).animate({height: h, easing:'easeInOutExpo'}, 500,
                                    function()
                                    {
                                        if(addItem['lastItemLength'] <= 0 && options.fired!== null)
                                        {
                                            $(options.fired).text('닫기').addClass('btn-show-all');
                                        }
                                    });
                            break;

                            case 2:
                                var w = $lis.width(),
                                    h = $lis.eq(0).height();

                                $lis.slice($lis.length - 10, $lis.length).css({'opacity': 0}).each(function(i)
                                {
                                    $(this).delay(i * 90).animate({opacity: 1}, 400);
                                })

                            break;
                        }
                    }

                }
                else
                {

                }
            },

            horizontal: function(html)
            {
                var $slidee    = this.owner.children('ul').eq(0),
                    $wrap      = this.owner.parent(),
                    $scrollBar = $wrap.find(options.scrollBar),
                    local      = this;

                if(this.owner.data('sly') === void 0)
                {
                    var sly = new Sly(this.owner,
                    {
                        horizontal: 1, itemNav: 'basic',
                        smart: 1, activateOn: 'click', mouseDragging: 1, touchDragging: 1,
                        releaseSwing: 1, startAt: 0,
                        scrollBy: 1, activatePageOn: 'click',
                        speed: 300,
                        elasticBounds: 1, scrollBar:options.scrollBar,
                        dragHandle: 1, dynamicHandle: 1, clickBar: 1
                    }, { moveEnd: function(ev) { local.moveEnd([ev, this]) }});

                    sly.init();

                    $(window).on('resize', function() {sly.reload(); })
                    this.owner.data('sly', sly)
                }
                else
                {
                    addItem.lastItemLength -= add_item_len;
                    this.owner.children('ul').append(html);
                    this.owner.data('sly').reload();
                }
            },

            moveEnd: function(arr)
            {
                var eventType = arr[0];
                var sly = arr[1];
                if(eventType==='moveEnd' && sly.isPaused === 1)
                {
                    if (Math.abs(sly.pos.dest - sly.pos.end ) >= 0)
                    {
                        if(addItem['lastItemLength'] >= 1)
                        {
                            this.getData();
                        }
                    }
                }
            }
        }

        return this.each(function()
        {
            $(this).data('destory', function()
            {
                addItem = null;
                settings = null;
                dummy = null;
                add_item_len = 0;
            })
            if(options.fired !== null)
            {
                $(options.fired).on('click', function()
                {
                    if(addItem['lastItemLength'] >= 1)
                    {
                        addItem.getData();
                    }
                    else
                    {
                        addItem[options.direction]();
                    }
                })
            }
            else
            {
                if(!options.isContinuousAjax && dummy!== void 0 && $.isArray(dummy)) addItem['lastItemLength'] = dummy.length;

                scrollHandler();
                if(options.hasDefaultView) addItem.getData();
                else addItem[options.direction]();
            }
        })
    }


    /**
     * [snsMenu SNS 링크바 및 오버레이]
     * @param  {Object} settings :
     *             {String} fired            [메뉴 노출 버튼 선택자],
     *             {String} sns_wrap         [전체 컨테이너 랩 박스],
     *             {String} sns_box          [아이콘 박스 선택자],
     *             {String} overlay          [배경 오버레이 선택자],
     *             {String} closeButton      [닫기 버튼 선택자],
     *             {String} activeClassName  [활성화 클래스명 ]]
     *
     * @return {jQuery} this     [제이쿼리 객체 반환]
     */
    $.fn.snsMenu = function(settings)
    {
        var options = $.extend({},
        {
            fired: '.icon-share',
            sns_wrap : '.ly-sns-wrp',
            sns_box: '.ly-sns-box',
            overlay: '.dimm-close',
            closeButton: '.close',
            activeClassName: 'open'
        }, settings);

        return this.each(function()
        {
            var $this = $(this);

            $(options.fired).on('click',  function()
            {
                var $sns_wrap = $this.find(options.sns_wrap).addClass(options.activeClassName),
                    $sns_box  = $this.find(options.sns_box),
                    $overlay  = $this.find(options.overlay),
                    $closeBtn = $this.find(options.closeButton+', '+options.overlay)

                $overlay.css('opacity', 0).animate({opacity: 0.9}, 150);

                $sns_box.animate({height: 11 + 'rem'}, 220, function()
                {
                    $closeBtn.one('click', function()
                    {
                        $sns_box.animate({height: 0}, 200, function(){$sns_wrap.removeClass(options.activeClassName)});
                        $overlay.animate({opacity: 0}, 250);
                    })
                })
            })
        })
    }






    /**
     * [setOverlay 전체 팝업 형식의 레이어 제어]
     * 대부분의 전체 팝업 레이어에 기본으로 사용할 예정.
     * @param {Object} settings :
     *            {String, Array}     targets [뷰포트 페이지 전체에 깔릴 레이어 대상 선택자들의  배열, 혹은 문자열]
     *            {String}            activeClassName  [대상 class 속성에 추가할 class 명]
     *            {String}            fixedClassName   [팝업이 펼쳐졌을때 팝업 하단의 본 메인 컨텐츠에 추가할 css 클래스 이름.]
     *
     * @return {Object} overlays    show, hide, setState 메서드를 가진 Object 객체.
     */
    $.fn.setOverlay = function(settings)
    {
        var options = $.extend(true,
        {
            targets: ['.dimm-close'],
            activeClassName: 'open',
            fixedClassName: 'fixed'
        }, settings || {});

        var $owner = this;
        var $body = $('body');
        var $container = $('#body-container');

        var overlays =
        {
            state: 0,
            show: function()
            {
                this.state = 1;
                this.setState('addClass');
                $owner.show();
            },
            hide: function()
            {
                this.state = 0;
                this.setState('removeClass');
                $owner.hide();
            },
            setState: function(funcName)
            {
                if(funcName===void 0) funcName = 'addClass';

                $owner[funcName](options.activeClassName);
                $body[funcName](options.fixedClassName);
                $container[funcName](options.fixedClassName);
                
                var targets = options.targets;

                if($.isArray(targets) &&  targets.length > 0) {targets = targets.join(', '); }

                $(targets, $owner)[funcName](options.activeClassName);
            }
        }

        return overlays;
    }



    /**
     * [showAllMessages 내 메세지 모두보기]
     * @param  {Object} settings [{String}  tag [대상], {String}  ellipsisClassName [말줄임 클래스]]
     * @return {jQuery} this     [Self]
     */
    $.fn.showAllMessages = function(settings)
    {
        var options = $.extend(
        {
            tag: '.bx_question',
            body: '.bx_answer',
            ellipsisClassName: 'ellipsis'
        }, settings || {});


        return this.each(function()
        {
            var $owner = $(this);

            $(this).on('click', options.tag, function(ev)
            {
                $.preventActions(ev);

                var $target = $(this),
                    $answer = $target.next(),
                    $arr    = $target.find('.arrow')

                if(!$answer.data('open'))
                {
                    $answer.data('open', true).show()
                    .one('click', function()
                        {
                            if(!$answer.find('a').length) $answer.data('open', false).hide();

                            $arr.removeClass('arrow-down');
                        });
                    $arr.addClass('arrow-down');
                }
                else
                {
                    $answer.data('open', false).hide();
                    $arr.removeClass('arrow-down')
                }
            })
        })
    };

    /**
    * [hookScroll 메인 페이지 마지막 상품 리스트 ]
    * 메인의 마지막 상품리스트의 타이틀은 페이지 스크롤시 화면상단에 header 메뉴아래에 고정
    *
    * @param  {Object} settings :
    *             {String} topBar [상단 header 메뉴 높이를 구하기 위한 선택자, 해당 높이 만큼 아래에 target 을 고정],
    *             {String} target [스크롤 고정 대상 엘리먼트 선택자]
    *
    * @return {jQuery} this     [Self]
    */
    $.fn.hookScroll = function(settings)
    {
        var options = $.extend(true,
        {
            topBar: '#top-bar',
            fixStyle: {'position': 'fixed'},
            target : '.tit-category-scroll',
            scrollTarget: $('.wrp-product').last()
        }, settings || {});


        return this.each(function()
        {
            var $win    = $(window),
                $owner   = $(this),
                $target = $owner.find(options.target),
                isFirst = true;

            var $topBar       = $(options.topBar),
                header_offset = 0,
                top           = 0;

            $(this).data('hook', function()
            {
                header_offset = parseInt($(options.topBar).outerHeight());
                $target.css({'top':header_offset+'px'});
            })

            $win.on('load scroll resize', function()
            {
                header_offset = parseInt($(options.topBar).outerHeight());

                var viewportOffset = $.getViewportOffset($owner);
                if(viewportOffset.top >= header_offset)
                {
                    if(!$target.hasClass('el-fix')) return;

                    $target.removeClass('el-fix');
                }
                else
                {
                    if($target.hasClass('el-fix')) return;
                    $target.addClass('el-fix').css({'top':header_offset+'px'});
                }
              // console.log("left: " + viewportOffset.left + ", top: " + viewportOffset.top + ", insideViewport: " + viewportOffset.insideViewport);
            });
        });
    }

})(jQuery, window, document);