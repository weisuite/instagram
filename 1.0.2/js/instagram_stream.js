function onModuleLoad(module){
	$.query('div.loading').style.display='none';
	var template=document.createElement('div');
	template.innerHTML=config.type.template;		
	var model=JSON.parse(config.type.model);	
	var stream=$.createStream(template.query$1('div.stream').clone$1(true),'stream',model);
	document.body.appendChild(stream.root);
	var data={
		'timestamp':1342579902*1000,	    
		'title':'verazhuu',
		'thumbnail':'http://distilleryimage5.s3.amazonaws.com/1f69f9e0c2e211e1af7612313813f8e8_5.jpg',
		'avatar':'http://images.instagram.com/profiles/profile_46583556_75sq_1340696801.jpg',              
		'content':'Our VP of Product Marketing, @jd_peterson shows you how to build a strong self service customer community! http://ow.ly/bQNj8 #CMGR'
	};
	$.onScroll(stream); 
	stream.onEvent('stream.topbar.dropdowns.setting.connect', function(d,e,w,evt){
		$.popup('http://www.yahoo.com','_blank',{},function(d$,e$,w$,evt$){
		window.alert('popup is closed');
		});
	});	       

	stream.onEvent('stream.append', function(d,e,w,evt){
		var entry=$.createEntry(template.query$1('div.entry').clone$1(true),'entry',data,stream.entries,model.entries.entry);
		stream.entries.add$1(entry);      
	});
	stream.onEvent('stream.topbar.header.toolbar.home',function(d,e,w,evt,detail){
	      stream.entries.clear$1('home');
	      var entry=$.createEntry(template.query$1('div.entry').clone$1(true),'entry',data,stream.entries,model.entries.entry);
	      stream.entries.add$1(entry);      	    	
	      var entry2=$.createEntry(template.query$1('div.entry').clone$1(true),'entry',data,stream.entries,model.entries.entry);
	      stream.entries.add$1(entry2);    	    	
	      entry2.conversations.toolbar.add$1($.createButton('comments', null,{'text':'2 comments'}));
	      entry2.conversations.toolbar.add$1($.createButton('likes', null,{'text':'2 likes'}));
	      entry2.onEvent('entry.conversations.toolbar.comments', function(d,e,w,evt){
	        entry2.conversations.setSelected$1('comments');
	        entry2.conversations.entries.clear$0();
	        var commentbox = $.createTextbox(template.query$1('div.entry.comment.textbox').clone$1(true), 'textbox',null,model.entries.entry.conversations.comment.textbox);
	        commentbox.onEvent('textbox.toolbar.add', function(d,e,w,evt,detail){
	          window.alert('js callback:'.concat(w.get$value()));
	        });
	        commentbox.onEvent('textbox.toolbar.cancel', function(d,e,w,evt,detail){
	          w.reset$0();
	        });		        
	        entry2.conversations.entries.add$1(commentbox);		        
	        var commentTemplate = template.query$1('div.entry.comment');
	        entry2.conversations.entries.add$1($.createEntry(commentTemplate.clone$1(true),'comment',data,entry2.conversations.entries,model.entries.entry.conversations.comment));
	        entry2.conversations.entries.add$1($.createEntry(commentTemplate.clone$1(true),'comment',data,entry2.conversations.entries,model.entries.entry.conversations.comment));
	        entry2.conversations.entries.add$1($.createEntry(commentTemplate.clone$1(true),'comment',data,entry2.conversations.entries,model.entries.entry.conversations.comment));
	        entry2.conversations.entries.add$1($.createEntry(commentTemplate.clone$1(true),'comment',data,entry2.conversations.entries,model.entries.entry.conversations.comment));
	      });
	      entry2.onEvent('entry.conversations.toolbar.likes', function(d,e,w,evt,detail){
	        entry2.conversations.setSelected$1('likes');
	         entry2.conversations.entries.clear$0();
	        var commentTemplate = template.query$1('div.entry.comment');
	        entry2.conversations.entries.add$1($.createEntry(commentTemplate.clone$1(true),'comment',data,entry2.conversations.entries,model.entries.entry.conversations.comment));
	        entry2.conversations.entries.add$1($.createEntry(commentTemplate.clone$1(true),'comment',data,entry2.conversations.entries,model.entries.entry.conversations.comment));
	      });  
	    	    	
		entry2.onEvent('entry.toolbar.like', function(d,e,w,evt,detail){        
		    //heart-red-20x20
		    entry2.root.query$1('a[data-name=like]>span').classes().remove$1('heart-grey-20x20');
		    entry2.root.query$1('a[data-name=like]>span').classes().add$1('heart-red-20x20');
		    //IE9 doesn't support dataset, use setAttribute instead
		    //entry2.root.query$1('a[data-name=like]').dataset.name='unlike';
		    entry2.root.query$1('a[data-name=like]').setAttribute('data-name','unlike');
		    window.alert('js callback:'.concat(JSON.stringify(detail)));
		  });
		  
		entry2.onEvent('entry.toolbar.unlike', function(d,e,w,evt,detail){        
		    //heart-red-20x20			    
		    entry2.root.query$1('a[data-name=unlike]>span').classes().remove$1('heart-red-20x20');
		    entry2.root.query$1('a[data-name=unlike]>span').classes().add$1('heart-grey-20x20');
		    //IE9 doesn't support dataset, use setAttribute instead			    
		    //entry2.root.query$1('a[data-name=unlike]').dataset.name='like';
		    entry2.root.query$1('a[data-name=unlike]').setAttribute('data-name','like');
		    window.alert('js callback:'.concat(JSON.stringify(detail)));
		});      	    	                      	    		    		
	});
	stream.onEvent('stream.topbar.dropdowns.more.help',function(d,e,w,evt,detail){
	    window.alert('js callback: help');
	});
	stream.onEvent('stream.home.entry.link',function(d,e,w,evt,detail){
	    window.alert('js callback:'+JSON.stringify(detail));
	});		
	stream.onEvent('stream.home.entry.mention',function(d,e,w,evt,detail){
	window.alert('js callback:'+JSON.stringify(detail));
	});   
	stream.onEvent('stream.home.entry.hash',function(d,e,w,evt,detail){
	window.alert('js callback:'+JSON.stringify(detail));
	});                     
	
	$.click($.query('.stream .topbar .header .toolbar a[data-name=home]'));	    
	});	
}
