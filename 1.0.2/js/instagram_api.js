function InstagramAPI(consumer, user) {
	this.consumer = consumer;
	this.user = user;
}

InstagramAPI.prototype.ajaxUrl = function(url) {
	return "/ap2/" + this.consumer.uid + "/" + this.user.id + url;
}


InstagramAPI.prototype.selfFeed = function(setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/users/self/feed")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.selfLiked = function(setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/users/self/media/liked")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.recent = function(setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/users/"+setting.uid+"/media/recent/")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.popular = function(setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/media/popular")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.tagRecent = function(setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/tags/"+encodeURIComponent(setting.tag)+"/media/recent")
	},setting);
	jQuery.ajax(ajaxSetting);
}



InstagramAPI.prototype.getUsers = function(userId,setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/users/"+userId)
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.searchUsers = function(setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/users/search")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.getMedia = function(mediaId,setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/media/"+mediaId)
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.getMediaComments = function(mediaId,setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/media/"+mediaId+"/comments")
	},setting);
	jQuery.ajax(ajaxSetting);
}


InstagramAPI.prototype.getMediaLikes = function(mediaId,setting) {
	var ajaxSetting=jQuery.extend({
		type:'GET',
		url: this.ajaxUrl("/v1/media/"+mediaId+"/likes")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.createComment = function(mediaId,text,setting) {
	var ajaxSetting=jQuery.extend({
		type:'POST',
		data:jQuery.param({"text":text}),
		url: this.ajaxUrl("/v1/media/"+mediaId+"/comments")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.like = function(mediaId,setting) {
	var ajaxSetting=jQuery.extend({
		type:'POST',
		url: this.ajaxUrl("/v1/media/"+mediaId+"/likes")
	},setting);
	jQuery.ajax(ajaxSetting);
}

InstagramAPI.prototype.unlike = function(mediaId,setting) {
	var ajaxSetting=jQuery.extend({
		type:'DELETE',
		url: this.ajaxUrl("/v1/media/"+mediaId+"/likes")
	},setting);
	jQuery.ajax(ajaxSetting);
}