(function($) {

	var siteResponsive = (function() {

		// Selections
		var $sel = {};
		$sel.window = $(window);
		$sel.body = $("body");
		$sel.menuBurger = $(".menu-burger", $sel.body);

		return {

			// Adds href="tel:" to the phone numbers
			mobilizePhones: {
				init: function($phones) {
					$phones.each(function() {
						var $phone = $(this),
							phoneText = $phone.text(),
							phoneNum = phoneText.replace(/ /g,"").replace(/-/g,"").replace(/\(/g,"").replace(/\)/g,""),
							phoneLink = '<a href="tel:' + phoneNum + '" class="phone-link' + ' ' + $phone.attr("class") + '">' + phoneText + '</a>';
						
						$phone.empty().html(phoneLink);
					});
				},
				destroy: function($phones) {
					$phones.each(function() {
						var $phone = $(this),
							phoneText = $phone.text();
						
						$phone.empty().html(phoneText);
					});
				}
			},



			// Initialize horizontal touch slider
			slider: {
				make: function($list, params) {
					$list.slick(params);
				},
				remove: function($list) {
					$list.slick("unslick");
				}
			},



			// Initialize simple horizontal scroll
			scroll: {
				make: function($list, params) {
					var $listItems = $list.find(params.items),
						listWidth = 0;
					$listItems.each(function() {
						var $item = $(this);
						listWidth += $item.outerWidth();
					});
					$list
						.addClass("mobile-scroll")
						.css({
							"width": listWidth + "px"
						})
						.wrap('<div class="mobile-scroll-holder" />');
				},
				remove: function($list) {
					$list
						.removeClass("mobile-scroll")
						.css({
							"width": "auto"
						})
						.unwrap()
				}
			},



			// Initialize and add actions for menu burger
			menu: {
				isShow: false,
				init: function() {
					var self = this;
					$sel.body.append('<div class="menu-overlay"></div>');
					$sel.menuBurger.on("click", function() {
						self.isShow ? self.hide() : self.show();
					});
					$(".menu-overlay", $sel.body).on("click", function() {
						self.hide();
					});
				},
				show: function() {
					this.isShow = true;
					$sel.menuBurger.addClass("active");
					$sel.body.addClass("show-menu");
				},
				hide: function() {
					this.isShow = false;
					$sel.menuBurger.removeClass("active");
					$sel.body.removeClass("show-menu");
				}
			},



			// Adaptize tables
			adaptizeTable: {
				init: function($tables) {
					$tables.each(function() {
						var $table = $(this);
						$table.addClass("adaptive-table");

						var tableTh = [];
						$("th", $table).each(function() {
							tableTh.push($(this).text());
						});

						$("td", $table).each(function(i) {
							$(this).attr("data-header", tableTh[i % tableTh.length]);
						});
					});
				},
				destroy: function($tables) {
					$tables.removeClass("adaptive-table");
				}
			},



			// Panels
			panels: {
				init: function($title, $content) {
					$content.addClass("panel-content");
					$title
						.addClass("panel-title")
						.data("panel", $content)
						.on("click", function() {
							var $t = $(this);
							$t.toggleClass("active");
							$t.data("panel").toggleClass("active");
						});
				},
				destroy: function($title, $content) {
					$content.removeClass("panel-content");
					$title
						.removeClass("panel-title")
						.data("panel", null)
						.off("click")
				}
			},



			// Initialize scripts for each window size
			initSSM: function() {
				var self = this;

				ssm.addStates([
					{
						// Tablets in landscape orientation
						id: "tabletLandscape",
						query: "(max-width: 1000px)",
						onEnter: function() {

						},
						onLeave: function() {

						}
					}, {

						// Tablets in portrait orientation
						id: "tabletPortrait",
						query: "(max-width: 770px)",
						onEnter: function() {

						},
						onLeave: function() {

						}
					}, {

						// Mobiles in landscape orientations
						id: "mobileLandscape",
						query: "(max-width: 670px)",
						onEnter: function() {
							self.menu.init();
							
							self.mobilizePhones.init($(".header-phone", $sel.body));
							
							self.scroll.make($(".rates", $sel.body), {
								items: "span"
							});
							
							self.slider.make($(".products", $sel.body), {
								infinite: true,
								arrows: false,
								dots: false,
								responsive: [
									{
										breakpoint: 600,
										settings: {
											slidesToShow: 2
										}
									}, {
										breakpoint: 400,
										settings: {
											slidesToShow: 1,
											dots: true
										}
									}
								]
							});
						},
						onLeave: function() {
							self.slider.remove($(".products", $sel.body));
							self.scroll.remove($(".rates", $sel.body));
							self.mobilizePhones.destroy($(".header-phone", $sel.body));
						}
					}, {

						// Mobiles in portrait orientation
						id: "mobilePortrait",
						query: "(max-width: 375px)",
						onEnter: function() {
							self.adaptizeTable.init($("table", $sel.body));
							$("section").each(function() {
								var $section = $(this);
								self.panels.init($section.find("div:eq(0)"), $section.find("div:eq(1)"));
							});
						},
						onLeave: function() {
							self.adaptizeTable.destroy($("table", $sel.body));
							self.panels.destroy($("section").find("div:eq(0)"), $("section").find("div:eq(1)"));
						}
					}
				]);
			}
		}

	})();

	siteResponsive.initSSM();

})(jQuery);