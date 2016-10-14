(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.ImageZoom = factory();
    }
}(this, function () {
    /**
     * @param {Object} container DOM element, which contains an image to be zoomed (required)
     * @param {Object} options js-image-zoom options (required)
     *          @param {number} width Image width (required)
     *          @param {number} height Image height (required)
     *          @param {number} zoomWidth  Zoomed image width optional if scale param is provided
     *          @param {string} img Url of image to zoom. If provided container children is ignored (optional)
     *          @param {number} scale Zoom scale. If provided zoomWidth param is ignored (optional if zoomWidth param is provided)
     *          @param {object} offset {vertical, horizontal} offset in pixels between original image and zoomed image (optional)
     */
    return function ImageZoom(container, options) {
        "use strict";
        if (!container) {
            return;
        }
        var data = {
            sourceImg: {
                element: null,
                width: 0,
                height: 0,
                naturalWidth: 0,
                naturalHeight: 0
            },
            zoomedImgOffset: {
                vertical: 0,
                horizontal: 0
            },
            zoomedImg: {
                element: null,
                width: 0,
                height: 0
            },
            zoomLens: {
                element: null,
                width: 0,
                height: 0
            }
        };

        var div = document.createElement('div');
        var lensDiv = document.createElement('div');
        var zoomDiv;
        var zoomLens;
        var scaleX;
        var scaleY;
        var offset;
        data.zoomedImgOffset = options.offset || {vertical: 0, horizontal: 0};

        function getOffset(el) {
            if (el) {
                var elRect = el.getBoundingClientRect();
                return {left: elRect.left, top: elRect.top};
            }
            return {left: 0, top: 0};
        }

        function leftLimit(min) {
            return options.width - min;
        }

        function topLimit(min) {
            return options.height - min;
        }

        function getValue(val, min, max) {
            if (val < min) {
                return min;
            }
            if (val > max) {
                return max;
            }
            return val;
        }

        function getPosition(v, min, max) {
            var value = getValue(v, min, max);
            return value - min;
        }

        function zoomLensLeft(left) {
            var leftMin = data.zoomLens.width / 2;
            return getPosition(left, leftMin, leftLimit(leftMin));
        }

        function zoomLensTop(top) {
            var topMin = data.zoomLens.height / 2;
            return getPosition(top, topMin, topLimit(topMin));
        }

        function setup() {
            if (options.img) {
                var img = document.createElement('img');
                img.src = options.img;
                data.sourceImg.element = container.appendChild(img);
            } else {
                data.sourceImg.element = container.children[0];
            }
            options = options || {};
            container.style.position = 'absolute';
            data.sourceImg.element.style.width = options.width + 'px' || 'auto';
            data.sourceImg.element.style.height = options.height + 'px' || 'auto';

            data.zoomLens.element = container.appendChild(lensDiv);
            data.zoomLens.element.style.display = 'none';
            data.zoomedImg.element = container.appendChild(div);
            if (options.scale) {
                data.zoomedImg.element.style.width = options.width * options.scale + 'px';
                data.zoomedImg.element.style.height = options.height * options.scale + 'px';
            } else {
                data.zoomedImg.element.style.width = options.zoomWidth + 'px';
                data.zoomedImg.element.style.height = data.sourceImg.element.style.height;
            }
            data.zoomedImg.element.style.position = 'absolute';
            data.zoomedImg.element.style.top = data.zoomedImgOffset.vertical + 'px';
            data.zoomedImg.element.style.left = options.width + data.zoomedImgOffset.horizontal + 'px';
            data.zoomedImg.element.style.backgroundImage = 'url(' + data.sourceImg.element.src + ')';
            data.zoomedImg.element.style.backgroundRepeat = 'no-repeat';
            data.zoomedImg.element.style.display = 'none';


            data.sourceImg.element.onload = function () {
                data.sourceImg.naturalWidth = data.sourceImg.element.naturalWidth;
                data.sourceImg.naturalHeight = data.sourceImg.element.naturalHeight;
                data.zoomedImg.element.style.backgroundSize = data.sourceImg.naturalWidth + 'px ' + data.sourceImg.naturalHeight + 'px';
                scaleX = data.sourceImg.naturalWidth / options.width;
                scaleY = data.sourceImg.naturalHeight / options.height;
                offset = getOffset(data.sourceImg.element);

                if (options.scale) {
                    data.zoomLens.width = options.width / (data.sourceImg.naturalWidth / (options.width * options.scale));
                    data.zoomLens.height = options.height / (data.sourceImg.naturalHeight / (options.height * options.scale));
                } else {
                    data.zoomLens.width = options.zoomWidth / scaleX;
                    data.zoomLens.height = options.height / scaleY;
                }
                data.zoomLens.element.style.width = data.zoomLens.width + 'px';
                data.zoomLens.element.style.height = data.zoomLens.height + 'px';
                data.zoomLens.element.style.position = 'absolute';
                data.zoomLens.element.style.background = 'white';
                data.zoomLens.element.style.opacity = 0.4;
                data.zoomLens.element.pointerEvents = 'none';

            };
            container.addEventListener('mousemove', events, false);
            container.addEventListener('mouseenter', events, false);
            container.addEventListener('mouseleave', events, false);
            data.zoomLens.element.addEventListener('mouseenter', events, false);
            data.zoomLens.element.addEventListener('mouseleave', events, false);
            window.addEventListener('scroll', events, false);
            return data;
        }

        var events = {
            handleEvent: function(event) {
                switch(event.type) {
                    case 'mousemove': return this.handleMouseMove(event);
                    case 'mouseenter': return this.handleMouseEnter(event);
                    case 'mouseleave': return this.handleMouseLeave(event);
                    case 'scroll': return this.handleScroll(event);
                }
            },
            handleMouseMove: function(event) {
                var offsetX;
                var offsetY;
                var backgroundTop;
                var backgroundRight;
                var backgroundPosition;
                if (offset) {
                    offsetX = zoomLensLeft(event.clientX - offset.left);
                    offsetY = zoomLensTop(event.clientY - offset.top);
                    backgroundTop = offsetX * scaleX;
                    backgroundRight = offsetY * scaleY;
                    backgroundPosition = '-' + backgroundTop + 'px ' +  '-' + backgroundRight + 'px';
                    data.zoomedImg.element.style.backgroundPosition = backgroundPosition;
                    data.zoomLens.element.style.cssText = data.zoomLens.element.style.cssText + 'top:' + offsetY + 'px;' + 'left:' + offsetX + 'px;display: block;';

                }
            },
            handleMouseEnter: function() {
                data.zoomedImg.element.style.display  = 'block';
                data.zoomLens.element.style.display = 'block';

            },
            handleMouseLeave: function() {
                data.zoomedImg.element.style.display  = 'none';
                data.zoomLens.element.style.display = 'none';


            },
            handleScroll: function() {
                offset = getOffset(data.sourceImg.element);
            }
        };
        setup();

        return {
            setup: function() {
                setup();
            },
            kill: function() {
                container.removeEventListener('mousemove', events, false);
                container.removeEventListener('mouseenter', events, false);
                container.removeEventListener('mouseleave', events, false);
                data.zoomLens.element.removeEventListener('mouseenter', events, false);
                data.zoomLens.element.removeEventListener('mouseleave', events, false);
                window.removeEventListener('scroll', events, false);
                if (zoomLens && zoomDiv) {
                    container.removeChild(data.zoomLens.element);
                    container.removeChild(data.zoomedImg.element);
                }
                if (options.img) {
                    container.removeChild(data.sourceImg.element);
                }
            },
            _getPrivateFunctions: function() {
                return {
                    setup: setup
                }
            }
        }
    }
}));