/**
 * Created by vincent on 10/10/18.
 */
$(function() {
    // variable
    var $window = $(window),
        $pages = $('.page'),
        $welcome = $pages.filter('#welcome'),
        $main = $pages.filter('#main'),
        $gallery = $pages.filter('#gallery'),
        $direction = $pages.filter('#direction');

    // functions
    function changePage(id) {
        var $target = $pages.filter(id);
        if ($target.hasClass('active')) return;
        $pages.removeClass('active');
        $target.trigger('init')
            .addClass('active')
            .trigger('show');
    }

    function isInit(el) {
        return el.attr('data-init');
    }
    function markInit(el) {
        el.attr('data-init', true);
    }


    // Resize
    function resize() {
        var px,
            py;
        // welcome page
        var $center = $welcome.find('.center');

        px = ($window.width() - $center.width()) / 2,
        py = ($window.height() - $center.height()) / 2;

        $center.css({
            top: py,
            left: px
        });

        // main page
        var $guide = $main.find('.guide'),
            $floor = $main.find('.floor');

        px = $guide.width() < 800 ? -50 : (($guide.width() - 800) / 2) -50;
        py = (($window.height()-350) / 2) - 30;


        $floor.css({
            top: py /2,
            right: px /2
        });
    }

    $window.on('resize', resize).trigger('resize');

    // Init
    setTimeout(function(){
        // init pages
        $pages.trigger('init');
    }, 100);

    // Nav
    $('.link').on('click', function(e){
        var id = $(this).attr('href');
        changePage(id);
        return false;
    });
    $main.find('.floor .room, .description .items').on('click', function(e){
        changePage('#gallery');
        return false;
    });

    /* Main */
    var $floor = $('.guide .floor'),
        degree = -36,
        max = 36,
        min = -36,
        timer;
    
    function rotate(x) {
        $floor.css({ WebkitTransform: 'rotateX(80deg) rotateZ(' + degree + 'deg)'});
        $floor.css({ '-moz-transform': 'rotateX(80deg) rotateZ(' + degree + 'deg)'});
        timer = setTimeout(function() {
            degree += x;
            if (degree >= max) {
                degree = max;
            } else if (degree <= min) {
                degree = min;
            }
            rotate(x);
        },5);
    }
    function stop() {
        clearTimeout(timer);
    }

    $main.find('.guide .control-panel .cr-left')
        .on('mousedown', function(ev){
            rotate(1);
        })
        .on('mouseup', function(ev){
            stop();
        });
    $main.find('.guide .control-panel .cr-right')
        .on('mousedown', function(ev){
            rotate(-1);
        })
        .on('mouseup', function(ev){
            stop();
        });

    var $items = $main.find('.guide .description .items'),
        $rooms = $main.find('.guide .floor .room');
    $main.find('.room').hover(function(e){
        $items.filter('.' + $(this).attr('data-relate'))
            .addClass('hover');
    }, function(e){
        $items.filter('.' + $(this).attr('data-relate'))
            .removeClass('hover');
    });
    $main.find('.items').hover(function(e){
        $rooms.filter('.' + $(this).attr('data-relate'))
            .addClass('hover');
    }, function(e){
        $rooms.filter('.' + $(this).attr('data-relate'))
            .removeClass('hover');
    });

    $main.find('.rolldown-list li').each(function () {
        var delay = ($(this).index() / 4) + 's';
        $(this).css({
            webkitAnimationDelay: delay,
            mozAnimationDelay: delay,
            animationDelay: delay
        });
    });

    $main.on('show', function(){
        setTimeout(function(){
            $main.find('.floor').addClass('spin');
            $main.find('.rolldown-list').addClass('rolldown');
        }, 1000);
    });

    /* Gallery */
    $gallery.on('init', function(){

        var $el = $(this);

        if (isInit($el)) return;

        var $imgs = $gallery.find('img.lazyload');
        $imgs.jail({
            event: 'lazyload',
            callback : (function(){
                Gallery.init( {
                    layout : [3,2,3,2]
                });

            }),
            loadHiddenImages: true
        }).trigger('lazyload');

        markInit($el);
    });

    /* Direction */
    $direction.on('init', function(){
        var $el = $(this);

        if (isInit($el)) return;

        var id = 'map',
            place = [145.0451, -37.8765123],
            zoomThreshold = 15,
            $map = $('#' + id);


        // set token (key)
        mapboxgl.accessToken = 'pk.eyJ1IjoiaWxpdTAwMDEiLCJhIjoiY2puZHY0MnJlMnhhYTNwbXM1cWhwNTE0YSJ9.18Bz4_cLWodJ4le-DqPIhg';

        var map = new mapboxgl.Map({
            container: id,
            style: 'mapbox://styles/mapbox/light-v9',
            center: place,
            zoom: 14
        });

        $map.data('map', map);

        // add marker
        var marker = new mapboxgl.Marker({
                color: '#B52A3F'
            })
            .setLngLat(place)
            .addTo(map);

        // add control panel
        map.addControl(new mapboxgl.NavigationControl());

        // add 3d building layer
        map.on('load', function() {
            map.resize();
            // Insert the layer beneath any symbol layer.
            var layers = map.getStyle().layers;

            var labelLayerId;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                    labelLayerId = layers[i].id;
                    break;
                }
            }

            map.addLayer({
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': zoomThreshold,
                'paint': {
                    'fill-extrusion-color': '#aaa',

                    // use an 'interpolate' expression to add a smooth transition effect to the
                    // buildings as the user zooms in
                    'fill-extrusion-height': [
                        "interpolate", ["linear"], ["zoom"],
                        15, 0,
                        15.05, ["get", "height"]
                    ],
                    'fill-extrusion-base': [
                        "interpolate", ["linear"], ["zoom"],
                        15, 0,
                        15.05, ["get", "min_height"]
                    ],
                    'fill-extrusion-opacity': .6
                }
            }, labelLayerId);


            // $map.css('opacity', '1');
        });

        // event handler - zoom
        map.on('zoomend', function(){
            if (map.getZoom() > zoomThreshold) {
                map.flyTo({pitch: 45, bearing: 30});
            } else {
                map.flyTo({pitch: 0, bearing: 0});
            }
        });

        markInit($el);
    });


    var _isKeydown = false;
    $window
        .on('keydown', function(e){
            console.log('keydown');
            console.log(e);
            if (!_isKeydown) {
                _isKeydown = true;
                if ($main.hasClass('active')) {
                    switch(e.keyCode) {
                        case 37:
                            rotate(1);
                            break;
                        case 39:
                            rotate(-1);
                            break;
                    }
                }
            }
        })
        .on('keyup', function(e){
            if ($main.hasClass('active')) {
                clearTimeout(timer);
            }
            if ($gallery.hasClass('active')) {
                switch(e.keyCode) {
                    case 37:
                        $gallery.find('.gr-prev').trigger('click');
                        break;
                    case 39:
                        $gallery.find('.gr-next').trigger('click');
                        break;
                }
            }
            _isKeydown = false;
        });

});