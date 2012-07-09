function onModuleLoad(module) {
	if (module == 'weisuite') {
		var element = jQuery("#widget").get(0);
		var is = new InstagramStream(element, context, config, hsp, weisuite)
				.init();
		var url = weisuite.url();
		var header = url.param("header");
		if (header == null) {
			is.createHeader();
		}
		var popup = url.param("popup");
		if (popup == null) {
			is.popup = false;
		} else {
			is.popup = (popup[0] == 'true');
		}
		var feed = url.param("feed");
		if (feed != null) {
			is.feedType = feed[0];
		}
		var keywords = url.param("keywords");
		if (keywords != null) {
			is.keywords = decodeURIComponent(keywords[0]);
		}
		is.createFooter();
		is.addScrollHandler();
		if (is.isConnected()) {
			if (is.popup) {
				is.loadMore();				
			}else{
				is.instagram.getUsers(is.context.user.identityId, is
						.getAjaxSetting({
							success : function(users) {
								is.instagramUser = users.data;
								is.loadMore();								
								is.hsp.updatePlacementSubtitle("("
										+ users.data.username + ")");
							}
						}));
				mixpanel.track('connected', {
					'app' : 'instagram',
					'ui' : 'landing',
					'consumer' : es.context.consumer.id
				});					
			}
		} else {
			// clean the email
			is.hsp.updatePlacementSubtitle("Instagram");
			is.connect();
			mixpanel.track('connect', {
				'app' : 'instagram',
				'ui' : 'landing',
				'consumer' : es.context.consumer.id
			});			
		}
		is.onReady();
	}
}

function InstagramStream(element, context, config, hsp, weisuite) {
	this.context = context;
	this.hsp = hsp;
	this.config = config;
	this.element = element;
	this.weisuite = weisuite;
	this.ws = new WSView(this.weisuite, this.context.consumer,
			this.context.user);
	this.instagram = new InstagramAPI(this.context.consumer, this.context.user);
	this.wapi = new WeisuiteAPI(this.context.consumer, this.context.user);
	this.loading = false;
	this.connected = this.isConnected();
	this.maxId = null;
	this.limit = 10;
	this.instagramUser = null;
	if (context.stream && context.stream.feedType) {
		this.feedType = context.stream.feedType;
	} else {
		this.feedType = "home";
	}
	if (context.stream && context.stream.keywords) {
		this.keywords = context.stream.keywords;
	} else {
		this.keywords = null;
	}

	var params = {
		"apiKey" : config.apiKey,
		"useTheme" : false
	};
	var es = this;
	params.receiverPath = document.location.protocol + "//"
			+ document.location.host + "/hootsuite_receiver.html";
	this.hsp.init(params);
	this.hsp.bind('refresh', function() {

		// collect any text the user has entered into a comment entry box
		comments = '';
		$(".ws_message textarea").each(function() {
			comments += $(this).val();
		});

		if (comments == '' // comment entry boxes are empty
				&& $(window).scrollTop() < 15 // user has not scrolled down
		// more than 15px
		) {
			if (es.context.user && es.context.consumer && es.connected) {
				es.loadMore(true);
			} else {
				es.ws.refreshStream();
			}
		}
	});

	this.ajaxSetting = {
		statusCode : {
			401 : function(jqXHR, textStatus, errorThrown) {
				es.connect();
			}
		}
	};
}
InstagramStream.prototype.loadMore = function(reset) {
	if (this.loading) {
		return;
	}
	if (typeof reset !== 'undefined' || Boolean(reset)) {
		this.maxId = null;
		this.stream.clear();
	} else if (this.maxId == 0) {
		return;
	}

	jQuery("a.hs_messageMore").addClass("loading").text("");
	jQuery("div.hs_moreMessages").show();
	var data = {
		count : this.limit
	};
	if (this.maxId != null) {
		data.max_id = this.maxId;
		data.max_like_id = this.maxId;
	}

	this.loading = true;
	var ajaxSetting = this.getFeedAjaxSetting(data);
	if (this.instagramUser != null) {
		ajaxSetting.uid = this.instagramUser.id;
	}
	if (this.feedType == "home") {
		this.instagram.selfFeed(ajaxSetting);
		this.header.title("Home");
	} else if (this.feedType == "likes") {
		this.instagram.selfLiked(ajaxSetting);
		this.header.title("My Likes");		
	} else if (this.feedType == "mine") {
		this.instagram.recent(ajaxSetting);
		this.header.title("My Photos");		
	} else if (this.feedType == "popular") {
		this.instagram.popular(ajaxSetting);
		this.header.title("Popular");		
	} else if (this.feedType == "search") {
		ajaxSetting.tag = this.keywords;
		this.instagram.tagRecent(ajaxSetting);
		this.header.title("Search: " + this.keywords);		
	} else {
		// do nothing
		this.loading = false;
	}
}

InstagramStream.prototype.getFeedAjaxSetting = function(data) {
	var es = this;
	return this
			.getAjaxSetting({
				data : data,
				success : function(feed) {
					es.loading = false;
					var data = feed.data;
					var pagination = feed.pagination;
					// var meta=feed.meta;
					for ( var i = 0; i < data.length; i++) {
						es.stream.entry(es.createMessage(data[i]));
					}
					jQuery("a.hs_messageMore").removeClass("loading");
					if (pagination && pagination.next_max_id) {
						es.maxId = pagination.next_max_id;
						jQuery("a.hs_messageMore").text("Show More");
					} else if (pagination && pagination.next_max_like_id) {
						es.maxId = pagination.next_max_like_id;
						jQuery("a.hs_messageMore").text("Show More");
					} else {
						es.maxId = 0;
						jQuery("a.hs_messageMore").text("");
					}
				},
				error : function() {
					es.loading = false;
					jQuery("a.hs_messageMore").text("Show More").removeClass(
							"loading");
					jQuery("div.hs_moreMessages").show();
				}
			});
}
InstagramStream.prototype.connect = function() {
	var setting = {
		width : 950,
		height : 650,
		text : 'Connect with Instagram',
		logo : '/static/weisuite/1.01/img/instagram_72x72.png',
		consumer : this.context.consumer,
		stream : this.context.stream,
		scope : "basic comments likes relationships",
		login : false,
		popup : true
	};
	var connection2 = this.ws.connect2(setting);
	jQuery("a.ws_btn", connection2.asElement()).removeClass("ws_btn").addClass(
			"hs_btn-cmt");
	this.stream.clear();
	jQuery(".hs_topBar .ws_buttons span.search").parent("a").remove();
	jQuery(".hs_dropdown ._settings.connect").html("");
	weisuite.wrap(jQuery(".hs_dropdown ._settings.connect").get(0)).add(
			connection2);

	if (jQuery("span.settings").parent("a.active").length == 0) {
		jQuery("span.settings").click();
	}

	jQuery("a.hs_messageMore").text("").removeClass("loading");
	jQuery("div.hs_moreMessages").hide();
	track("hootsuite instagram", "oauth connect", "oauth2");
}

InstagramStream.prototype.getAjaxSetting = function(setting) {
	return jQuery.extend(setting, this.ajaxSetting);
}

InstagramStream.prototype.createHeader = function() {
	var es = this;
	var topbar = weisuite.html(jQuery("div.hs_topBar",jQuery(this.config.type.template)).get(0));
	var topbarspace = weisuite.html(jQuery("div.hs_topBarSpace",jQuery(this.config.type.template)).get(0));
	var header = weisuite.streamHeader();
	this.header = header;
	topbar.add(header, jQuery("div.hs_content",jQuery(topbar.asElement())).get(0));
	jQuery(header.asElement()).addClass("hs_content");
	if (es.connected) {
		header.button("home", "Home", "ws_icon19 home-grey-20x20");
		header.button("popular", "Popular", "ws_icon19 star-grey-20x20");
		header.button("mine", "My Photos", "ws_icon19 my_photos-25x20");
		header.button("like", "My Likes", "ws_icon19 heart-grey-20x20");
		header.button("search", "Search Instagram", "ws_icon19 search");
	}
	header.button("settings", "Settings", "ws_icon19 settings");
	header.button("more", "More", "ws_icon19 dropdown");
	header.on("home", function() {
		es.feedType = "home";
		es.loadMore(true);
		es.updateStreamSetting();
		jQuery(".hs_dropdown>div").hide();
		mixpanel.track('home', {
			'app' : 'instagram',
			'ui' : 'header',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});
	header.on("popular", function() {
		es.feedType = "popular";
		es.loadMore(true);
		es.updateStreamSetting();
		jQuery(".hs_dropdown>div").hide();
		mixpanel.track('popular', {
			'app' : 'instagram',
			'ui' : 'header',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});
	header.on("mine", function() {
		es.feedType = "mine";
		es.loadMore(true);
		es.updateStreamSetting();		
		jQuery(".hs_dropdown>div").hide();
		mixpanel.track('mine', {
			'app' : 'instagram',
			'ui' : 'header',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});
	header.on("like", function() {
		es.feedType = "likes";
		es.loadMore(true);
		es.updateStreamSetting();
		jQuery(".hs_dropdown>div").hide();
		mixpanel.track('like', {
			'app' : 'instagram',
			'ui' : 'header',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});
	this.stream.header(topbar);
	this.stream.header(topbarspace);

	header.on("search", function(view, target, data, e) {
		jQuery(".hs_dropdown>div").hide();
		if (target.active()) {
			jQuery(".hs_dropdown ._search").show();
			jQuery(".hs_dropdown").show();
			mixpanel.track('search', {
				'app' : 'instagram',
				'ui' : 'header',
				'user' : es.context.user.id,
				'consumer' : es.context.consumer.id
			});
		} else {
			jQuery(".hs_dropdown ._search").hide();
			jQuery(".hs_dropdown").hide();
		}
	});
	header.on("settings", function(view, target, data, e) {
		jQuery(".hs_dropdown>div").hide();
		if (target.active()) {
			if (es.connected) {
				jQuery(".hs_dropdown ._settings.disconnect").show();
			} else {
				jQuery(".hs_dropdown ._settings.connect").show();
			}
			jQuery(".hs_dropdown").show();
			mixpanel.track('settings', {
				'app' : 'instagram',
				'ui' : 'header',
				'user' : es.context.user.id,
				'consumer' : es.context.consumer.id
			});
		} else {
			if (es.connected) {
				jQuery(".hs_dropdown ._settings.disconnect").hide();
			} else {
				jQuery(".hs_dropdown ._settings.connect").hide();
			}
			jQuery(".hs_dropdown").hide();
		}
	});
	header.on("more", function(view, target, data, e) {
		jQuery(".hs_dropdown>div").hide();
		if (target.active()) {
			jQuery(".hs_dropdown ._menuList").show();
			jQuery(".hs_dropdown").show();
			mixpanel.track('more', {
				'app' : 'instagram',
				'ui' : 'header',
				'user' : es.context.user.id,
				'consumer' : es.context.consumer.id
			});
		} else {
			jQuery(".hs_dropdown ._menuList").hide();
			jQuery(".hs_dropdown").hide();
		}
	});
}

InstagramStream.prototype.updateStreamSetting = function() {
	if (this.context.stream && this.context.stream.id) {
		var feedType = this.feedType;
		var keywords = this.keywords;
		var streamId = this.context.stream.id;
		jQuery.ajax({
			url : "/v1/streams/" + streamId,
			type : "PUT",
			contentType : "application/json;charset=UTF-8",
			data : JSON.stringify({
				"feedType" : feedType,
				"keywords" : keywords
			})
		});
	}
}
InstagramStream.prototype.init = function() {
	// remove loading
	jQuery("body>div.loading").css("display", "none");
	jQuery("a.hs_messageMore").text("").addClass("loading");
	jQuery("div.hs_moreMessages").show();
	jQuery("#widget").html("");
	this.stream = weisuite.streamView2(jQuery("#widget").get(0));
	return this;
}

InstagramStream.prototype.popupUser = function(name) {
	var is = this;
	this.instagram.searchUsers(this.getAjaxSetting({
		data : {
			q : name
		},
		success : function(users) {
			for ( var i = 0; i < users.data.length; i++) {
				var user = users.data[i];
				if (user.username == name) {
					is.instagram.getUsers(user.id, is.getAjaxSetting({
						success : function(users) {
							var user = users.data;
							var data = {
								"fullName" : user.full_name,
								"screenName" : user.username,
								"avatar" : user.profile_picture,
								"extra" : [],
								"links" : []
							};
							if (user.website) {
								data.profileUrl = user.website;
							}
							if (user.bio) {
								data.bio = user.bio;
							}
							data.extra.push({
								"label" : "Photos",
								"value" : "" + user.counts.media
							});
							data.extra.push({
								"label" : "Following",
								"value" : "" + user.counts.follows
							});
							data.extra.push({
								"label" : "Followers",
								"value" : "" + user.counts.followed_by
							});
							is.customUserInfo(data);
						}
					}));
				}
			}
		}
	}));
	track("hootsuite instagram", "popup user", "");
}

InstagramStream.prototype.createFooter = function(hasHeader) {
	var more = weisuite.html(jQuery("div.hs_moreMessages",jQuery(this.config.type.template)).get(0));
	this.stream.footer(more, true);
	return this;
}

InstagramStream.prototype.load = function(hasHeader) {
	this.addScrollHandler();
	if (this.isConnected()) {
		this.instagram.getUsers(this.context.user.identityId, this
				.getAjaxSetting({
					success : function(users) {
						es.instagramUser = users.data;
						es.hsp.updatePlacementSubtitle("("
								+ users.data.username + ")");
					}
				}));
		this.loadMore();
	} else {
		// clean the email
		this.hsp.updatePlacementSubtitle("Instagram");
		this.connect();
	}
	es.onReady();
}

InstagramStream.prototype.createMessage = function(object) {
	// convert date to string to match with autobean
	var value = {
		title : object.user.username,
		thumbnail : {
			"small" : object.images.thumbnail.url,
			"large" : object.images.standard_resolution.url
		},
		url : object.link,
		date : object.created_time * 1000 + "",
		user : {
			"id" : object.user.id,
			"name" : object.user.username,
			"avatarUrl" : object.user.profile_picture
		}
	};

	if (object.caption) {
		value.text = object.caption.text;
	}

	var es = this;
	var message = this.weisuite.avatarMessage();
	jQuery(message.asElement()).addClass("hootsuite");
	message.value(value);
	var commentsConversation = message.conversation(object.comments.count
			+ " comments", "comments");
	var likesConversation = message.conversation(object.likes.count + " likes",
			"likes");
	jQuery(message.asElement()).addClass("hs_message");
	message.on("likes", function(view, target, data, e) {
		if (jQuery(likesConversation.asElement()).hasClass("active")) {
			return;
		}
		jQuery(".bar a.active", message.asElement()).removeClass("active");
		jQuery(likesConversation.asElement()).addClass("active");
		message.clearConversationEntries();
		for ( var i = 0; (object.likes) && (object.likes.data)
				&& i < object.likes.data.length && i < 3; i++) {
			var like = object.likes.data[i];
			var centry = weisuite.simpleMessage();
			jQuery(centry.asElement()).addClass("hootsuite");
			centry.value({
				text : "[[username|" + like.username + "]]",
				user : {
					"id" : like.id,
					"name" : like.username,
					"avatarUrl" : like.profile_picture
				}
			});
			es.attachMessageEvents(centry);
			message.conversationEntry(centry);
		}
		if ((object.likes) && (object.likes.data)
				&& object.likes.data.length > 3) {
			var all = weisuite.html("<a>See All</a>");
			message.conversationEntry(all);
			jQuery(all.asElement()).css("text-align", "right").click(
					function(e) {
						es.openConversation(object, "likes");
						mixpanel.track('see all', {
							'app' : 'instagram',
							'ui' : 'likes',
							'user' : es.context.user.id,
							'consumer' : es.context.consumer.id
						});
					});
		}
		mixpanel.track('likes', {
			'app' : 'instagram',
			'ui' : 'conversations',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	message.on("comments", function(view, target, data, e) {
		if (jQuery(commentsConversation.asElement()).hasClass("active")) {
			// return;
		}
		jQuery(".bar a.active", message.asElement()).removeClass("active");
		jQuery(commentsConversation.asElement()).addClass("active");
		message.clearConversationEntries();
		var textbox = weisuite.compactEditor(true);
		textbox.text("Add a comment...");
		var cancelBtn = textbox
				.action("cancel", "Cancel", "Cancel the comment");
		var addBtn = textbox.action("add", "Add", "Add a comment");

		textbox.on("add", function(view, target, data, e) {
			var text = textbox.value();
			if (text) {
				es.createComment(object, commentsConversation, text);
				mixpanel.track('add', {
					'app' : 'instagram',
					'ui' : 'comment',
					'user' : es.context.user.id,
					'consumer' : es.context.consumer.id
				});
			}
		});
		textbox.on("cancel", function(view, target, data, e) {
			textbox.value("");
			textbox.compact(true);
			mixpanel.track('cancel', {
				'app' : 'instagram',
				'ui' : 'comment',
				'user' : es.context.user.id,
				'consumer' : es.context.consumer.id
			});
		});

		jQuery(addBtn.asElement()).addClass("ws_btn").addClass("hs_btn-cmt");
		jQuery(cancelBtn.asElement()).addClass("hs_btn-del");
		jQuery(textbox.asElement()).css("padding", "5px")
				.addClass("ws_message").addClass("hootsuite");
		message.conversationEntry(textbox);
		for ( var i = 0; (object.comments) && (object.comments.data)
				&& i < object.comments.data.length && i < 3; i++) {
			var comment = object.comments.data[object.comments.data.length - 1
					- i];
			var centry = weisuite.simpleMessage();
			jQuery(centry.asElement()).addClass("hootsuite");
			centry.value({
				text : "[[username|" + comment.from.username + "]] "
						+ comment.text,
				date : comment.created_time * 1000 + "",
				user : {
					"id" : comment.from.id,
					"name" : comment.from.username,
					"avatarUrl" : comment.from.profile_picture
				}
			});
			es.attachMessageEvents(centry);
			message.conversationEntry(centry);
		}
		if ((object.comments) && (object.comments.data)
				&& object.comments.data.length > 3) {
			var all = weisuite.html("<a>See All</a>");
			message.conversationEntry(all);
			jQuery(all.asElement()).css("text-align", "right").click(
					function(e) {
						es.openConversation(object, "comments");
						mixpanel.track('see all', {
							'app' : 'instagram',
							'ui' : 'comments',
							'user' : es.context.user.id,
							'consumer' : es.context.consumer.id
						});
					});
		}
		// TODO: the event can be triggered from load event. How to
		// differentiate it?
		// mixpanel.track('comments',{'app':'instagram','ui':'conversations','user':es.context.user.id,'consumer':es.context.consumer.id});
	});

	message.on("timestamp", function(view, target, data, e) {
		window.open(data.url, "_blank");
		mixpanel.track('timestamp', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});
	message.on("load", function(view, target, data, e) {
		jQuery(commentsConversation.asElement()).click();
	});
	message.action("Share", "share", "ws_icon19 reply");
	var like = message.action("Like/Unlike", "like",
			"ws_icon19 heart-grey-20x20");
	message.on("like", function(view, target, data, e) {
		if (jQuery('.ws_icon19', target.asElement())
				.hasClass("heart-red-20x20")) {
			es.instagram.unlike(object.id, es.getAjaxSetting({
				success : function(res) {
					if (res.meta.code == 200) {
						jQuery('.ws_icon19', target.asElement()).removeClass(
								"heart-red-20x20");
						jQuery('.ws_icon19', target.asElement()).addClass(
								"heart-grey-20x20");
					}
				},
				error : function() {
				}
			}));
		} else {
			es.instagram.like(object.id, es.getAjaxSetting({
				success : function(res) {
					if (res.meta.code == 200) {
						jQuery('.ws_icon19', target.asElement()).addClass(
								"heart-red-20x20");
						jQuery('.ws_icon19', target.asElement()).removeClass(
								"heart-grey-20x20");
					}
				},
				error : function() {
				}
			}));
		}
		mixpanel.track('like', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
		track("hootsuite instagram", "message event", "like");
	});

	message.on("share", function(view, target, data, e) {
		var text = data.text;
		if (Boolean(text)) {
			text = text + " " + data.url;
		} else {
			text = data.url;
		}
		if (es.hsp) {
			es.hsp.composeMessage(text, {
				shortenLinks : true
			});
		} else {
			window.alert(text);
		}
		mixpanel.track('share', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	this.attachMessageEvents(message);
	return message;
}

InstagramStream.prototype.attachMessageEvents = function(message) {
	var es = this;
	message.on("hash", function(view, target, data, e) {
		var url = es.weisuite.url();
		url.param("feed", "search");
		url.param("keywords", encodeURIComponent(data.substring(1)));
		url.param("header", "false");
		url.param("popup", "true");
		url.param("pid", es.config.pid);
		url.param("apiKey", es.config.apiKey);
		es.hsp.showCustomPopup(window.location.protocol + "//"
				+ window.location.host + "/hootsuite/stream/popup?url="
				+ encodeURIComponent(url.build()), "Instagram: " + data);
		mixpanel.track('hash', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	message.on("mention", function(view, target, data, e) {
		es.popupUser(data.substring(1));
		mixpanel.track('mention', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	message.on("title", function(view, target, data, e) {
		es.popupUser(data.title);
		mixpanel.track('title', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	message.on("username", function(view, target, username, e) {
		es.popupUser(username);
		mixpanel.track('title', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	message.on("avatar", function(view, target, data, e) {
		es.popupUser(data.user.name);
		mixpanel.track('avatar', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});

	message.on("thumbnail", function(view, target, data, e) {
		if (es.hsp) {
			es.showImagePreview(data.thumbnail.large, data.url);
		} else {
			window.open(data.thumbnail.large, "_blank");
		}
		mixpanel.track('thumbnail', {
			'app' : 'instagram',
			'ui' : 'message',
			'user' : es.context.user.id,
			'consumer' : es.context.consumer.id
		});
	});
}

InstagramStream.prototype.showImagePreview = function(image, url) {
	if (this.popup) {
		parent.parent.frames[this.config.apiKey + "_" + this.config.pid].hsp
				.showImagePreview(image, url);
	} else {
		this.hsp.showImagePreview(image, url);
	}
}

InstagramStream.prototype.customUserInfo = function(data) {
	if (this.popup) {
		parent.parent.frames[this.config.apiKey + "_" + this.config.pid].hsp
				.customUserInfo(data);
	} else {
		this.hsp.customUserInfo(data);
	}
}

InstagramStream.prototype.openConversation = function(object, conversation) {
	var streamTypeId;
	if(this.config.stage=='DEV'){
		streamTypeId=201003;
	}else{
		streamTypeId=177872;
	}
	var url = window.location.protocol + "//" + window.location.host
			+ "/hootsuite/instagram/stream/"+streamTypeId 
			+ "?popup=true&header=false&conversation=" + conversation
			+ "&user=" + this.context.user.id + "&pid=" + this.config.pid
			+ "&apiKey=" + this.config.apiKey+"&mediaId="+ object.id;
	;
	var title = "Media Stream";
	if (object.caption && object.caption.text) {
		title = object.caption.text;
	}
	this.hsp.showCustomPopup(window.location.protocol + "//"
			+ window.location.host + "/hootsuite/stream/popup?url="
			+ encodeURIComponent(url), "Instagram: " + title);
}

InstagramStream.prototype.onReady = function(view, data) {
	var es = this;
	$('.hs_stream ._search').on(
			'click',
			'a.hs_btn-cmt',
			function(e) {
				var $dropdown = $(this).parents('.hs_dropdown');
				var $message = $(this).parents('._search');
				var keywords = $message.find('input').val();
				// $message.find('input').val("");
				$message.parents('.hs_topBar').find('.hs_controls .active')
						.removeClass("active");
				$message.hide();
				$dropdown.hide();
				es.keywords = jQuery.trim(keywords);
				es.feedType = "search";
				es.loadMore(true);
				es.updateStreamSetting();				
				e.preventDefault();
			});

	$('.hs_stream').on("click", ".hs_message a.hs_attachedLink img",
			function(e) {
				es.showImagePreview($(this).attr("src"), $(this).attr("src"));
				e.preventDefault();
			});
	$('.hs_stream').on("click", "a.hs_disconnect", function() {
		es.ws.disconnectStream(es.context.stream.id);
	});
	$('.hs_stream').on("click", "a.hs_messageMore", function() {
		es.loadMore();
	});
	$(document)
			.click(
					function(e) {
						if ($(e.target)
								.is(
										'.hs_stream .content, .hs_stream .content *, .hs_noMessages, .hs_noMessages *')) {
							if (es.header) {
								es.header.active(false);
							}
							$(this).find(".hs_dropdown").hide();
							$(this).find(".hs_dropdown>div").hide();
						}
					});
}

InstagramStream.prototype.addScrollHandler = function() {
	var es = this;
	jQuery(window)
			.scroll(
					function(event) {
						var more = jQuery("div.hs_moreMessages");
						var scrollTop = Math.max(jQuery("html").scrollTop(),
								jQuery(window).scrollTop());
						if (scrollTop + jQuery(window).height()
								+ jQuery(more).height() > jQuery("#widget")
								.height()) {
							es.loadMore();
						}
					});
}
InstagramStream.prototype.createComment = function(object,
		commentsConversation, text) {
	var is = this;
	is.instagram.createComment(object.id, text, is.getAjaxSetting({
		success : function(res) {
			if (res.meta.code == 200) {
				is.instagram.getMedia(object.id, is.getAjaxSetting({
					success : function(media) {
						object.comments = media.data.comments;
						jQuery(commentsConversation.asElement()).click();
					}
				}));
			}
		},
		error : function() {
		}
	}));
}

InstagramStream.prototype.isConnected = function() {
	if (Boolean(this.context.user) && Boolean(this.context.user.identityId)) {
		if (Boolean(this.context.stream)) {
			if (Boolean(this.context.stream.connectedUsers)) {
				for ( var i = 0; i < this.context.stream.connectedUsers.length; i++) {
					if (this.context.stream.connectedUsers[i] == this.context.user.id) {
						return true;
					}
				}
			}
			return false;
		} else {
			return true;
		}
	} else {
		return false;
	}
}
