;(function($){
	window.WPUF_Uploader = function(browse_button, container, max, type, allowed_type, max_file_size){
		this.container = container;
		this.browse_button = browse_button;
		this.max = max || 1;
		this.count = $('#' + container).find('.wpuf-attachment-list > li').length; //count how many items are there

		//if no element found on the page, bail out
		if(!$('#' + browse_button).length){
			return;
		}

		//instantiate the uploader
		this.uploader = new plupload.Uploader({
			runtimes: 'html5,html4',
			browse_button: browse_button,
			container: container,
			multipart: true,
			multipart_params: {
				action: 'wpuf_file_upload'
			},
			multiple_queues: false,
			multi_selection: false,
			urlstream_upload: true,
			file_data_name: 'wpuf_file',
			max_file_size: max_file_size + 'kb',
			url: wpuf_frontend_upload.plupload.url + '&type=' + type,
			flash_swf_url: wpuf_frontend_upload.flash_swf_url,
			filters: [{
				title: 'Allowed Files',
				extensions: allowed_type
			}]
		});

		//attach event handlers
		this.uploader.bind('FilesAdded', $.proxy(this, 'added'));
		this.uploader.init();

		$('#' + container).on('click', 'a.attachment-delete', $.proxy(this.removeAttachment, this));
		//var windowInnerHeight = window.innerHeight;
		//var modalHeight = Math.round(windowInnerHeight * 4 / 10);console.log(modalHeight);
		//$("#imageContainer").css({
		//	'min-height': 511,
		//	height: modalHeight
		//});
	};
	WPUF_Uploader.prototype = {
		count: 0,
		jsCropAPI: {},
		ACCEPT_WIDTH: 511,
		ACCEPT_HEIGHT: 511,
		getCoords: function(c){
			console.log(c);
			$("#selectArea").val(JSON.stringify(c));
		},
		added: function(up, files){
			var wp = this;
			var imageContainer = $("<div>");

			/**
			 * show modal
			 */
			var resizeImageModal = $("#resizeImageModal");
			imageContainer.appendTo(resizeImageModal.find(".modal-body"));
			resizeImageModal.on("hide.bs.modal", function(){
				if(typeof wp.jsCropAPI.destroy === 'function'){
					wp.jsCropAPI.destroy();
				}
			});

			var file = files[0];
			var nativeFile = file.getNative();
			console.log(nativeFile);
			/**
			 * read nativeFile, append to imageContainer
			 */
			if(typeof (FileReader) != "undefined"){
				var reader = new FileReader();
				var uploadProcess = $("#uploadProcess");
				var process = $("#process");
				process.css({display: 'block'});
				resizeImageModal.on("shown.bs.modal", function(){
					process.css({display: 'none'});
				});
				reader.onprogress = function(e){
					//resizeImageModal.modal("show");
					if(e.lengthComputable){
						console.log(e);
						var percent = Math.round(e.loaded * 100 / e.total);
						uploadProcess.css({
							width: percent + '%'
						}).html(percent + '%');
					}
				};
				reader.onload = function(e){

					//get image source
					var imageSource = e.target.result;
					//new image uploaded, clear the old one
					imageContainer.empty();
					//create new  image uploaded
					var imageUploaded = $("<img>");
					//add src, id to image uploaded
					imageUploaded.css({
						'max-width': '100%',
						height: 'auto'
					});
					imageUploaded.attr("id", "imageUploaded");
					imageUploaded.attr("src", imageSource);
					imageUploaded.appendTo(imageContainer);
					//append to image container
					console.log(imageUploaded);
					imageUploaded.on("load", function(){
						console.log("load on imageUpload");
						console.log(imageContainer);
						console.log(resizeImageModal.height());
						var imageWidth = imageUploaded.get(0).naturalWidth;
						var imageHeight = imageUploaded.get(0).naturalHeight;
						console.log(imageWidth);
						console.log(imageHeight);
						if(imageWidth < wp.ACCEPT_WIDTH || imageHeight < wp.ACCEPT_HEIGHT){
							imageContainer.empty();
							/** @WARN handle process none by HAND*/
							process.css({display: 'none'});
							window.alert(
								"imageUploaded: discarded, ACCEPT_WIDTH: " + wp.ACCEPT_WIDTH + ",ACCEPT_HEIGHT: " + wp.ACCEPT_HEIGHT);
						}else{
							/**
							 * set height for imageContainer
							 */
							var containerWidth = 0;
							var containerHeight = Math.round(window.innerHeight * 7 / 10);
							if(containerHeight < imageHeight){
								containerWidth = Math.round(imageWidth * containerHeight / imageHeight);
							}
							if(containerHeight > imageHeight){
								containerHeight = imageHeight;
								containerWidth = imageWidth;
							}
							imageContainer.css({
								width: containerWidth,
								height: containerHeight
							});

							//imageContainer.css({
							//	width: 700,
							//	height: 511
							//});
							//if(wp.count < 1){
								console.log("count", wp.count);
								wp.count++;
								imageContainer.Jcrop({
									minSize: [wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
									maxSize: [wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
									setSelect: [0, 0, wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
									aspectRatio: 1,
									onSelect: wp.getCoords
								}, function(){
									wp.jsCropAPI = this;
									//jsCropAPI.destroy();
								});
								resizeImageModal.find(".modal-dialog").css({
									width: (containerWidth + 38)
								});

								resizeImageModal.modal("show");

							//}

						}


					});
					//resizeImageModal.modal("show");
					/**
					 * jscrop on image >>> has size
					 */
					//imageUploaded.Jcrop({
					//	bgColor: 'black',
					//	bgOpacity: .4,
					//	minSize: [wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
					//	maxSize: [wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
					//	setSelect: [0, 0, wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
					//	aspectRatio: 1,
					//	onSelect: wp.getCoords
					//});

				};
				reader.readAsDataURL(nativeFile);

			}else{
				alert("This browser does not support FileReader.");
			}

		},

		removeAttachment: function(e){
			e.preventDefault();

			var self = this,
				el = $(e.currentTarget);

			if(confirm(wpuf_frontend_upload.confirmMsg)){
				var data = {
					'attach_id': el.data('attach_id'),
					'nonce': wpuf_frontend_upload.nonce,
					'action': 'wpuf_file_del'
				};

				jQuery.post(wpuf_frontend_upload.ajaxurl, data, function(){
					el.parent().parent().remove();

					self.count -= 1;
					self.showHide();
					self.uploader.refresh();
				});
			}
		}
	};
})(jQuery);