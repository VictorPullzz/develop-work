// Пути в проекте
var paths = {
	"dev": {
		"root": "./dev/",
		"pages": "./dev/pages/",
		"dummy": "./dev/dummy/",
		"templates": "./dev/templates/",
		"lib": "./dev/lib",
		"js": "./dev/js/",
		"images": "./dev/i/",
		"icons": "./dev/i/icons/",
		"svg": "./dev/svg/",
		"svgIcons": "./dev/svg/icons/",
		"css": "./dev/css/",
		"cssLib": "./dev/lib/css/",
		"htmlLib": "./dev/lib/html/",
		"jsLib": "./dev/lib/js/",
		"fonts": "./dev/fonts/"
	},
	"prod": {
		"root": "./prod/",
		"archives": "./prod/archives/",
		"dummy": "./prod/dummy/",
		"fonts": "./prod/fonts",
		"images": "./prod/i/",
		"svg": "./prod/svg/",
		"css": "./prod/css/",
		"js": "./prod/js/",
		"pages": "./prod/pages/"
	},
	"front": {
		"root": "./front/",
		"email": "./front/email/"
	},
	"tmp": {
		"root": "./tmp/"
	}
};

var gulp = require("gulp"),
	
	jade = require("gulp-jade"),
	htmlmin = require("gulp-htmlmin")

	stylus = require("gulp-stylus"),
	nib = require("nib"),
	
	imagemin = require('gulp-imagemin'),
	imageminJpegtran = require('imagemin-jpegtran'),

	ttf2woff = require("gulp-ttf2woff"),

	spritesmith = require("gulp.spritesmith"),

	svgstore = require("gulp-svgstore"),
	svgmin = require("gulp-svgmin"),

	browserSync = require("browser-sync").create(),
	imageminSvgo = require('imagemin-svgo'),

	zip = require("gulp-zip"),
	util = require("gulp-util"),
	ftp = require("vinyl-ftp"),

	concat = require("gulp-concat"),
	uglify = require("gulp-uglify"),
	minifyCss = require("gulp-minify-css"),

	imageminOptipng = require('imagemin-optipng'),
	rm = require('gulp-rm'),

	newer = require("gulp-newer"),
	runSequence = require("run-sequence"),
	merge = require("merge-stream"),
	watch = require("gulp-watch"),
	fs = require("fs"),
	path = require("path"),
	request = require("request"),
	data = require("gulp-data"),
	jsonfile = require("jsonfile"),
	gulpif = require("gulp-if"),
	argv = require("yargs").argv,
	settings = jsonfile.readFileSync("./settings.json"),

	notify = require("gulp-notify"),
	notifier = require('node-notifier'),

	ncp = require("copy-paste"),
	open = require("open"),

	exec = require('child_process').exec,

	generator = require('generate-password');

// Слияние параметров и путей
settings.paths = paths;




/*** SEND EMAIL NOTIFICATIONS ***/
gulp.task("mail", function(params) {
	var mailgun = require("mailgun-js")({
		apiKey: "key-3b0b10d9337c3dd5c31b363e74ab18d8", 
		domain: "mg.goodcode.ru"
	});
	var states = {
		"hello": {
			"subject": "Начало работ",
			"template": "hello"
		},
		"state": {
			"subject": "Статус проекта " + settings.info.name,
			"template": "state"
		},
		"requirements": {
			"subject": "Необходимые данные для начала работы по проекту " + settings.info.name,
			"template": "requirements"
		},
		"demo": {
			"subject": "Доступ к демо-серверу " + settings.info.name,
			"template": "demo"
		}
	};
	var currentState = (argv.type ? states[argv.type] : false);

	if(!currentState) {
		notifier.notify({
			icon: path.join(settings.paths.front.root, "favicon.png"),
			title: "Markup",
			message: "Mail sending error"
		});
		return false;
	}

	gulp.src(settings.paths.front.email + currentState.template + ".jade")
		.pipe(jade({
			locals: {
				customer: settings.customer,
				email: {},
				info: settings.info,
				access: settings.access
			},
			pretty: false
		}))
		.pipe(gulp.dest(function(file) {
			mailgun.messages().send({
				from: "GoodCode <info@goodcode.ru>",
				to: settings.customer.email,
				subject: currentState.subject,
				html: file.contents.toString()
			}, function (error, body) {
				//console.log(error, body);
				notifier.notify({
					icon: path.join(settings.paths.front.root, "favicon.png"),
					title: "Markup",
					message: "E-mail succesfully sended"
				});
			});
			var date = new Date(),
				tmpName = '';
			tmpName += date.getDate() + "-" + (date.getMonth() + 1 < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1) + "-" + date.getFullYear();
			tmpName += "_" + date.getHours() + "-" + (date.getMinutes() < 10 ? ("0" + date.getMinutes()) : date.getMinutes());
			return (settings.paths.tmp.root + "mail_" + tmpName + ".html");
		}));
});
/*** //SEND EMAIL NOTIFICATIONS ***/

/*** CREATE ARCHIVE ***/
gulp.task("compress", function() {
	// Remove all exiting archives
	if(argv.clear) {
		deleteFolderRecursive(settings.paths.prod.archives);
	}
	var archiveName = "",
		date = new Date();

	// Forming archive name
	archiveName += settings.info.code + "_" + date.getDate() + "-" + (date.getMonth() + 1 < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1) + "-" + date.getFullYear();
	archiveName += "_" + date.getHours() + "-" + (date.getMinutes() < 10 ? ("0" + date.getMinutes()) : date.getMinutes());
	archiveName += ".zip";

	// Zip
	gulp.src([settings.paths.prod.root + "*", settings.paths.prod.root + "**", "!" + settings.paths.prod.archives, "!" + settings.paths.prod.archives + "*"])
		.pipe(zip(archiveName))
		.pipe(gulp.dest(settings.paths.prod.archives));
});
var deleteFolderRecursive = function(path) {
	if(fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file,index) {
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};
/*** //CREATE ARCHIVE ***/

/*** PROJECT MAIN PAGE ***/
gulp.task("front", function() {

	// Git list of all archives
	var archives = [],
		archive;
	if(fs.existsSync(settings.paths.prod.archives)) {
		fs.readdirSync(settings.paths.prod.archives).forEach(function(file, index) {
			var fileName = file.replace(".zip", ""),
				fileInfo = fileName.split("_"),
				fileDate = fileInfo[1].replace(/-/g, "."),
				fileTime = fileInfo[2].replace(/-/g, ":");
	
			// File info
			var fileStats = fs.statSync(settings.paths.prod.archives + file);
			//console.log(fileStats);
	
			archives.push({
				name: fileInfo[0],
				size: (fileStats.size / 1024 / 1024).toFixed(2),
				date: fileDate + " " + fileTime,
				dateFormat: new Date(fileDate.replace(/(\d+)\.(\d+)\.(\d+)/, '$2/$1/$3') + " " + fileTime).getTime(),
				url: settings.info.productionUrl + "archives/" + fileName + ".zip"
			});
	
		});	
	}

	// Сортировка по убыванию времени создания
	archives.sort(function(a, b) {
		if(a.dateFormat == b.dateFormat) {
			return 0;
		}
		return (a.dateFormat < b.dateFormat) ? 1 : -1;
	});

	//console.log(archives); return false;

	// Формирование html страницы
	gulp.src(settings.paths.front.root + "index.jade")
		.pipe(jade({
			locals: {
				info: settings.info,
				customer: settings.customer,
				pages: settings.pages,
				archives: archives
			},
			pretty: false
		}))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true,
			minifyJS: true,
			minifyCSS: true
		}))
		.pipe(gulp.dest(settings.paths.prod.root))
		.pipe(browserSync.reload({
			stream: true
		}));
});
/*** //PROJECT MAIN PAGE ***/

/*** OPEN PROJECT ***/
gulp.task("copyToBuffer", function() {
	ncp.copy(settings.info.productionUrl);
	open(settings.info.productionUrl);
});
/*** //OPEN PROJECT ***/

/*** UPLOADING TO THE DEMO-SERVER ***/
gulp.task("upload", function() {
	var conn = ftp.create({
		host: settings.ftp.host,
		user: settings.ftp.login,
		password: settings.ftp.password,
		parallel: 2,
		log: util.log
	});

	gulp.src([settings.paths.prod.root + "*", settings.paths.prod.root + "**"], {
			buffer: false,
			dot: true
		})
		.pipe(conn.dest("/projects/" + settings.info.code))
		.pipe(notify({
			icon: path.join(settings.paths.front.root, "favicon.png"),
			title: "Markup",
			message: "Project successfully uploaded"
		}));
});
/*** //UPLOADING TO THE DEMO-SERVER ***/

/*** CLEANUP DEMO-SERVER PROJECT DIRECTORY ***/
gulp.task("cleanfolder", function() {
	request("http://wemakesites.ru/projects/cleanfolder.php?directory=" + settings.info.code, function() {
		return true;
	});
});
/*** //CLEANUP DEMO-SERVER PROJECT DIRECTORY ***/




// Страницы для верстки
var checkJadeFiles = true;

gulp.task("pages", function() {
	return gulp.src(settings.paths.dev.pages + "*.jade")
		.pipe(gulpif(checkJadeFiles, newer({
			dest: settings.paths.prod.pages,
			ext: ".html"
		})), newer(settings.paths.dev.pages))
		.pipe(data(function(file) {
			var fileCode = path.basename(file.path).replace(".jade", ""),
				pageParams = settings.pages[fileCode];
			pageParams.code = fileCode;
			return {
				info: settings.info,
				page: pageParams
			};
		}))
		.pipe(jade({
			pretty: true
		}))
		.pipe(gulp.dest(settings.paths.prod.pages))
		.pipe(browserSync.reload({
			stream: true
		}));
});



















// Стили
gulp.task("css", function() {
	gulp.src(settings.paths.dev.css + "*.styl")
		.pipe(newer({
			dest: settings.paths.prod.css,
			ext: ".css"
		}))
		.pipe(stylus({
			use: [nib()]
		}))
		.pipe(gulp.dest(settings.paths.prod.css))
		.pipe(browserSync.reload({
			stream: true
		}));

	// Для обычных css файлов
	gulp.src([settings.paths.dev.css + "*.css"])
		.pipe(newer({
			dest: settings.paths.prod.css,
			ext: ".css"
		}))
		.pipe(gulp.dest(settings.paths.prod.css))
		.pipe(browserSync.reload({
			stream: true
		}));
});



// Шрифты
gulp.task("fonts", function() {
	gulp.src(settings.paths.dev.fonts + "*.ttf")
		.pipe(ttf2woff())
		.pipe(gulp.dest(settings.paths.prod.fonts));
});



// Генерация спрайтов
gulp.task("sprite", function() {

	var spriteData = gulp.src(settings.paths.dev.icons + "*.png")
		.pipe(spritesmith({
			imgName: "sprite.png",
			cssName:"sprite.styl",
			cssTemplate: settings.paths.dev.cssLib + "sprite.styl.mustache",
			padding: 20,
			imgPath: "../i/sprite.png"
		}));

	var imgStream = spriteData.img
		.pipe(gulp.dest(settings.paths.dev.images));

	var cssStream = spriteData.css
		.pipe(gulp.dest(settings.paths.dev.css));

	return merge(imgStream, cssStream);
});



// Картинки стилей
gulp.task("images", function() {
	gulp.src([settings.paths.dev.images + "*", settings.paths.dev.images + "**"])
		.pipe(newer(settings.paths.prod.images))
		.pipe(gulp.dest(settings.paths.prod.images))
		.pipe(browserSync.reload({
			stream: true
		}));
});



// SVG спрайт
gulp.task("svgsprite", function() {
	return gulp.src(settings.paths.dev.svgIcons + "*.svg")
		.pipe(svgmin(function(file) {
			var prefix = path.basename(file.relative, path.extname(file.relative));
			return {
				plugins: [{
					cleanupIDs: {
						prefix: "icon-" + prefix,
						minify: true
					}
				}]
			}
		}))
		.pipe(svgstore())
		.pipe(gulp.dest(settings.paths.prod.images));
});



// SVG
gulp.task("svg", function() {
	gulp.src([settings.paths.dev.svg + "*.svg", settings.paths.dev.svg + "**/*.svg"])
		//.pipe(newer(settings.paths.prod.svg))
		.pipe(svgmin({
			plugins: [
				{
					removeDoctype: true,
				}, {
					removeComments: true
				}, {
					removeTitle: true
				}, {
					convertStyleToAttrs: true
				}, {
					removeStyleElements: true
				}, {
					cleanupIDs: true
				}, {
					removeDesc: true
				}, {
					removeMetadata: true
				}, {
					removeAttrs: {
						attrs: ["id", "class"]
					}
				}, {
					removeStyleElement: true
				}, {
					removeViewBox: true
				}
			]
		}))
		.pipe(gulp.dest(settings.paths.prod.svg))
		.pipe(browserSync.reload({
			stream: true
		}));
});



// JS
gulp.task("js", function() {
	gulp.src([settings.paths.dev.js + "*", settings.paths.dev.js + "**"])
		.pipe(newer(settings.paths.prod.js))
		.pipe(gulp.dest(settings.paths.prod.js))
		.pipe(browserSync.reload({
			stream: true
		}));
});



// Контентная медиа
gulp.task("dummy", function() {
	gulp.src([settings.paths.dev.dummy + "*", settings.paths.dev.dummy + "**"])
		.pipe(imagemin({
			//progressive: false
		}))
		.pipe(gulp.dest(settings.paths.prod.dummy));
});







// Веб-сервер
gulp.task("browser-sync", function() {
	browserSync.init({
		server: {
			baseDir: [settings.paths.prod.root, settings.paths.prod.pages]
		},
		open: false
	});
});

gulp.task("clear", function() {
	gulp.src([settings.paths.prod.root + "*", settings.paths.prod.root + "**"])
		.pipe(rm())
});


// Документация
gulp.task("docs", function() {
	gulp.src(settings.paths.front.root + "docs.jade")
		.pipe(jade({
			pretty: false
		}))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true,
			minifyJS: true,
			minifyCSS: true
		}))
		.pipe(gulp.dest(settings.paths.prod.root))
		.pipe(browserSync.reload({
			stream: true
		}));
});





// Создание базовых файлов и директорий проекта
gulp.task("assembly", function() {
	
	// Pages
	if(!fs.existsSync(settings.paths.dev.pages)) {
		fs.mkdirSync(settings.paths.dev.pages);
	}
	for(var pageCode in settings.pages) {
		var page = settings.paths.dev.pages + pageCode + ".jade";
		if(!fs.existsSync(page)) {
			fs.writeFile(page, "");
		}
	};

	// Templates
	var templateFilePath = settings.paths.dev.templates + "base.jade",
		baseTemplateFilePath = settings.paths.dev.htmlLib + "template.jade";

	if(!fs.existsSync(settings.paths.dev.templates)) {
		fs.mkdirSync(settings.paths.dev.templates);
	}
	if(!fs.exists(templateFilePath)) {
		fs.writeFile(templateFilePath, fs.readFileSync(baseTemplateFilePath, "utf8"));
	}

	// CSS
	var cssFilePath = settings.paths.dev.css + settings.info.code + ".styl",
		baseCssFilePath = settings.paths.dev.cssLib + "markup.styl",
		cssResponsiveFilePath = settings.paths.dev.css + settings.info.code + ".responsive.styl",
		baseCssResponsiveFilePath = settings.paths.dev.cssLib + "markup.responsive.styl";
	
	if(!fs.existsSync(settings.paths.dev.css)) {
		fs.mkdirSync(settings.paths.dev.css);
	}
	if(!fs.existsSync(cssFilePath)) {
		fs.writeFile(cssFilePath, fs.readFileSync(baseCssFilePath, "utf8"));
	}
	if(!fs.existsSync(cssResponsiveFilePath)) {
		fs.writeFile(cssResponsiveFilePath, fs.readFileSync(baseCssResponsiveFilePath, "utf8"));
	}

	// JS
	var jsFilePath = settings.paths.dev.js + settings.info.code + ".js",
		baseJsFilePath = settings.paths.dev.jsLib + "markup.js",
		jsResponsiveFilePath = settings.paths.dev.js + settings.info.code + ".responsive.js",
		baseJsResponsiveFilePath = settings.paths.dev.jsLib + "markup.responsive.js";

	if(!fs.existsSync(settings.paths.dev.js)) {	
		fs.mkdirSync(settings.paths.dev.js);
	}
	if(!fs.existsSync(jsFilePath)) {
		fs.writeFile(jsFilePath, fs.readFileSync(baseJsFilePath, "utf8").replace("XXX", settings.info.code.toUpperCase()));
	}
	if(!fs.existsSync(jsResponsiveFilePath)) {
		fs.writeFile(jsResponsiveFilePath, fs.readFileSync(baseJsResponsiveFilePath, "utf8").replace("XXX", settings.info.code.toUpperCase()));
	}

	// Fonts
	if(!fs.existsSync(settings.paths.dev.fonts)) {	
		fs.mkdirSync(settings.paths.dev.fonts);
	}

	// Images
	if(!fs.existsSync(settings.paths.dev.images)) {	
		fs.mkdirSync(settings.paths.dev.images);
	}
	if(!fs.existsSync(settings.paths.dev.icons)) {
		fs.mkdirSync(settings.paths.dev.icons);	
	}

	// SVG
	if(!fs.existsSync(settings.paths.dev.svg)) {	
		fs.mkdirSync(settings.paths.dev.svg);
	}
	if(!fs.existsSync(settings.paths.dev.svgIcons)) {
		fs.mkdirSync(settings.paths.dev.svgIcons);	
	}
	
	// Dummy
	if(!fs.existsSync(settings.paths.dev.dummy)) {	
		fs.mkdirSync(settings.paths.dev.dummy);
	}


});



// Создание минифицированных js и css файлов
gulp.task("prodmin", function() {

	// Конкатенация и минификация JS
	gulp.src([settings.paths.prod.js + "*.js", settings.paths.prod.js + "**"])
		.pipe(concat(settings.info.code + ".min.js"))
		.pipe(uglify())
		.pipe(gulp.dest(settings.paths.prod.js));

	// Конкатенация и минификация CSS
	gulp.src([settings.paths.prod.css + "*.css", settings.paths.prod.css + "**"])
		.pipe(concat(settings.info.code + ".min.css"))
		.pipe(minifyCss())
		.pipe(gulp.dest(settings.paths.prod.css));

});



gulp.task("default", ["browser-sync"], function() {

	// Картинки и иконки
	watch([settings.paths.dev.images + "*", settings.paths.dev.images + "**"], function(e) {
		gulp.start("images");
	});
	watch([settings.paths.dev.icons + "*"], function(e) {
		runSequence(
			["images"],
			["sprite"]
		);
	});

	// SVG
	watch([settings.paths.dev.svg + "*"], function(e) {
		gulp.start("svg");
	});
	watch([settings.paths.dev.svgIcons + "*"], function(e) {
		runSequence(
			["svg"],
			["svgsprite"]
		);
	});

	// Контентная медиа
	watch([settings.paths.dev.dummy + "*", settings.paths.dev.dummy + "**"], function(e) {
		gulp.start("dummy");
	});

	// CSS
	watch([settings.paths.dev.css + "*", settings.paths.dev.css + "**", settings.paths.dev.cssLib + "*.styl"], function(e) {
		gulp.start("css");
	});

	// Скрипты
	watch([settings.paths.dev.js + "*.js", settings.paths.dev.js + "**"], function(e) {
		gulp.start("js");
	});

	// Шрифты
	watch([settings.paths.dev.fonts + "*"], function(e) {
		gulp.start("fonts");
	});
	
	// Документация
	watch([settings.paths.front.root + "docs.jade"], function(e) {
		gulp.start("docs");
	});

	// Почтовый шаблон
	watch([settings.paths.front.email + "*.jade"], function(e) {
		gulp.start("email");
	});

	// Главная
	watch([settings.paths.front.root + "index.jade"], function(e) {
		gulp.start("front");
	});

	// HTML
	watch([settings.paths.dev.pages + "*.jade"], function(e) {
		checkJadeFiles = true;
		gulp.start("pages");
	});
	watch([settings.paths.dev.templates + "*.jade", settings.paths.dev.htmlLib + "*.jade"], function(e) {
		checkJadeFiles = false;
		gulp.start("pages");
	});
	

	// Главная страница
	watch([settings.paths.front + "index.jade", "./settings.json"], function() {
		settings = jsonfile.readFileSync("./settings.json");
		settings.paths = paths;
		runSequence(
			["front", "pages"]
		);
	});

});

// Создание версии для production
gulp.task("production", function() {
	runSequence(
		["clear"],
		["front", "pages", "dummy", "js"],
		["sprite"],
		["css"],
		["images"]
	);
});

// Создание нового архива верстки
gulp.task("archive", function() {
	runSequence(
		["compress"],
		["front"]
	);
});

// Выгрузка на демо-сервер
gulp.task("deploy", function() {
	runSequence(
		["cleanfolder"],
		["upload"],
		["copyToBuffer"]
	);
});

gulp.task("access", function() {
	var user = "demo",
		password = generator.generate({
			length: 10,
			numbers: true,
			excludeSimilarCharacters: true
		});
	settings["access"] = {
		"user": user,
		"password": password
	};
	jsonfile.writeFileSync("./settings.json", settings, {
		spaces: 4
	});
	fs.writeFileSync(settings.paths.prod.root + ".htaccess", 'AuthType Basic\nAuthName "Login please"\nAuthUserFile "/var/www/akirikovich/data/www/wemakesites.ru/projects/' + settings.info.code + '/.htpasswd"\nRequire valid-user');
	exec('htpasswd -c -b ' + settings.paths.prod.root + '.htpasswd ' + user + ' ' + password, function (err, stdout, stderr) {
		console.log(stdout);
    });
});

// Чудо-команда
gulp.task("make", function() {
	runSequence(
		["assembly"],
		["front", "pages", "dummy", "js"],
		["sprite"],
		["css"],
		["images"],
		["compress", "front"],
		["cleanfolder", "upload"],
		["copyToBuffer"]
	);
});	
