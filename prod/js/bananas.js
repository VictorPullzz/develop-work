(function($) {
	var BANANAS = (function() {

		var $sel = {};
		$sel.window = $(window);
		$sel.html = $("html");
		$sel.body = $("body", $sel.html);

		return {
			common: {
				go: function(topPos, speed, callback) {
					var curTopPos = $sel.window.scrollTop(),
						diffTopPos = Math.abs(topPos - curTopPos);
					$sel.body.add($sel.html).animate({
						"scrollTop": topPos
					}, speed, function() {
						if(callback) {
							callback();
						}
					});
				}
			},

			goEl: function() {
				var self = this;
					$goEl = $("[data-goto]");

				$goEl.on("click", function(event) {
					var $nameEl = $sel.body.find($(this).data("goto"));

					if ($nameEl.length === 0) {
						alert("Возможно вы не правильно указали элемент");
						return;
					} else {
						var posEl = $nameEl.offset().top;
						BANANAS.common.go(posEl-90, 1000);
					}
					event.preventDefault();
				});

			},

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

					self.$services = $(".services--home");
					self.$servicesItems = self.$services.find(".services-item");

					self.createSimpleStructure();
					self.createFullStructure.init();
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
				},

				// ajaxLoader: function() {
				// 	$sel.body.on("click", ".load-more", function(event) {
				// 		var $linkAddress = $(this),
				// 			href = $linkAddress.attr("href"),
				// 			selector = $linkAddress.data("itemsselector"),
				// 			$container = $($linkAddress.data("container"));
				//
				// 		$linkAddress.addClass("loading");
				//
				// 		(function(href, $container, $link, selector) {
				// 			$.ajax({
				// 				url: href,
				// 				success: function(data) {
				// 					var $data = $('<div />').append(data),
				// 						$items = $data.find(selector),
				// 						$preloader = $data.find(".load");
				//
				// 					$items.addClass("load-events-item");
				// 					$container.append($items);
				// 					$link.parent().remove();
				//
				// 					if($preloader && $preloader.length) {
				// 						$container.parent().append($preloader);
				// 					}
				//
				// 					setTimeout(function() {
				// 						var timer = 50,
				// 							$getElements = $container.find(".load-events-item");
				//
				// 						$getElements.each(function() {
				// 							var el = $(this);
				// 							setTimeout(function() {
				// 								el.removeClass("load-events-item");
				// 							}, timer);
				// 							timer += 100;
				// 						});
				//
				// 						$linkAddress.removeClass("loading");
				// 					}, 100);
				//
				// 					setTimeout(function() {
				// 						FOODGEOGRAPHY.reload();
				// 					},200)
				// 				}
				// 			})
				// 		})(href, $container, $linkAddress, selector);
				// 		event.preventDefault();
				// 	})
				// },

				createFullStructure: {

					init: function() {
						var self = this;

						self.eventButton();
						self.create();
					},

					eventButton: function() {
						var self = this,
							$showServices = $("[data-services-more]");

						$showServices.each(function() {
							var $el = $(this),
								link = $el.attr("href"),
								elAjaxContent = $el.data("container");

							if (elAjaxContent) {
								parseAjax = function(mfpResponse) {
									mfpResponse.data = $(mfpResponse.data).find(elAjaxContent);
								}
							} else {
								parseAjax = null;
							}

							$el.magnificPopup({
								items: {
									src: link,
									type: "ajax",
								},
								tLoading: "Загрузка...",
								closeMarkup: '<button type="button" class="mfp-close btn-container-close"><svg data-name="Слой 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11.63 11.63"><defs/><path d="M.31.31l11 11m-11 0l11-11"/></svg></button>',
								mainClass: "mfp-services",
								removalDelay: 300,
								closeOnBgClick: false,
								closeBtnInside: true,
								callbacks: {
									open: function($el) {
										$(".btn-container-close").on("click", function() {
											$.magnificPopup.close();
										});
									},
									ajaxContentAdded: function() {
										//BANANAS.reload();
										$(".btn-container-close").on("click", function() {
											$.magnificPopup.close();
										});
										self.create();
									},
									parseAjax: parseAjax,
								}
							});
						})

					},

					create: function() {
						var self = this,
							$gridFullConatiner = $(".services--full .services-clearfix");

						if ($gridFullConatiner.length > 0) {
							startX = $gridFullConatiner.offset().left,
							finishX = $gridFullConatiner.offset().left + $gridFullConatiner.width();

						}
					}
				}
			},

			miniScripts: {

				init: function() {
					var self = this;

					self.fixedLogo();
					self.preloader.init();
				},

				fixedLogo: function() {
					$sel.window.on("scroll", function() {
						var hh = $(".page-header").outerHeight(),
							sTop = $sel.window.scrollTop();

						if(sTop > hh + 50) {
							$sel.body.addClass("fixed-logo");
						} else {
							$sel.body.removeClass("fixed-logo");
						}
					});

				},
				preloader: {

					preloaderContainer : null,

					init: function() {
						var self= this;

						self.preloaderContainer = $(".preloader");

						self.showHidePreloader();
					},


					showHidePreloader: function() {
						var self = this;

						self.preloaderContainer.addClass("active");

						$sel.window.on("load", function() {

							setTimeout(function() {
								self.preloaderContainer.addClass("hide");
							}, 1500);
							setTimeout(function() {
								self.preloaderContainer.remove();
							}, 3500);
						});

					}

				},


			}

		};

	})();

	BANANAS.slider();
	BANANAS.goEl();
	BANANAS.gridServices.init();
	BANANAS.miniScripts.init();

})(jQuery);
