(function($) {
	var BANANAS = (function() {

		var $sel = {};
		$sel.window = $(window);
		$sel.html = $("html");
		$sel.body = $("body", $sel.html);

		return {
			slider: function() {
				var self = this,
					$slick = $(".intro-slider"),
					$itemSlider = $(".intro-slider-item");

				$slick.slick({
					arrows: false,
					autoplay: true,
					dots: true,
					autoplaySpeed: 10000,
					infinite: true,
					speed: 1500,
					cssEase: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
					swipe: false
				});
			},

			gridServices: {

				$services: null,
				$servicesItems: null,

				init: function() {
					var self = this;

					self.$services = $("#services");
					self.$servicesItems = self.$services.find(".services-item");

					self.createSimpleStructure();
				},

				// method for create grid services //
				createSimpleStructure: function() {
					var self = this,
						count = self.$servicesItems.length;

					self.$servicesItems.each(function() {
						(function($el) {
							var index = $el.index() + 1;

							// 1,5,9 ... (4n-3)
							$(self.$servicesItems[0]).css({
								"grid-column-start": "1",
								"grid-column-end": "2",
								"grid-row-start": "2",
								"grid-row-end": "4",
							});
							if (index > 1) {
								$(self.$servicesItems[((3*index)-1)-1]).css({
									"grid-column-start": "1",
									"grid-column-end": "2",
									"grid-row-start": String(2*index),
									"grid-row-end": String((2*index)+2),
								});
							}

							// 4,7,10 ... (3n+1)
							$(self.$servicesItems[((3*index)+1)-1]).css({
								"grid-column-start": "3",
								"grid-column-end": "4",
								"grid-row-start": String(2*index),
								"grid-row-end": String((2*index)+2),
							});

							// 2
							if (index == 2) {
								$(self.$servicesItems[1]).css({
									"grid-column-start": "2",
									"grid-column-end": "3",
									"grid-row-start": "1",
									"grid-row-end": "3",
								});
							}
							// 3,6,9,12
							$(self.$servicesItems[(3*index)-1]).css({
								"grid-column-start": "2",
								"grid-column-end": "3",
								"grid-row-start": String((2*index)+1),
								"grid-row-end": String((2*index)+3),
							});

						})($(this));
					});
				}

			},

			miniScripts: {

				init: function() {
					var self = this;

					self.fixedLogo();
				},

				fixedLogo: function() {
					$sel.window.on("scroll", function() {
						var hh = $(".page-header").outerHeight(),
							sTop = $sel.window.scrollTop();
						console.log(sTop);
						if(sTop > hh + 50) {
							$sel.body.addClass("fixed-logo");
						} else {
							$sel.body.removeClass("fixed-logo");
						}
					});

				},

			}

		};

	})();

	BANANAS.slider()
	BANANAS.gridServices.init()
	BANANAS.miniScripts.init()

})(jQuery);
