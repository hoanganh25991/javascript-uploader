; (function($){
	window.WPUF_Uploader = function (browse_button, container, max, type, allowed_type, max_file_size) {
		this.container = container;
		this.browse_button = browse_button;
		this.max = max || 1;
		this.count = $('#' + container).find('.wpuf-attachment-list > li').length; //count how many items are there

		//if no element found on the page, bail out
		if( !$('#'+browse_button).length ) {
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
		ACCEPT_WIDTH: 511,
		ACCEPT_HEIGHT: 511,
		getCoords: function(c){
			console.log(c);
			$("#selectArea").val(JSON.stringify(c));
		},
		added: function (up, files) {
			var wp = this;
			var imageContainer = $("#imageContainer");
			/**
			 * show modal
			 */
			var resizeImageModal = $("#resizeImageModal");

			var file = files[0];
			var nativeFile = file.getNative();
			console.log(nativeFile);
			/**
			 * read nativeFile, append to imageContainer
			 */
			if(typeof (FileReader) != "undefined"){
				var reader = new FileReader();
				reader.onload = function(e){
					//get image source
					var imageSource = imagege.target.result;
					//new image uploaded, clear the old one
					imageContainer.empty();
					//create new  image uploaded
					var imageUploaded = $("<img>");
					//add src, id to image uploaded
					imageUploaded.attr("id", "imageUploaded");
					imageUploaded.css({
						'min-height': '100%',
						width: 'auto'
					});
					imageUploaded.attr("src", imageSource);
					//imageUploaded.appendTo(imageContainer);
					//append to image container
					imageUploaded.on("load", function(){
						console.log("modal height");
						console.log(resizeImageModal.height());
						var imageWidth = imageUploaded.width();
						var imageHeight = imageUploaded.height();
						console.log(imageWidth);
						console.log(imageHeight);
						//if(imageWidth < wp.ACCEPT_WIDTH || imageHeight < wp.ACCEPT_HEIGHT){
						//	imageContainer.empty();
						//	window.alert(
						//		"imageUploaded: discarded, ACCEPT_WIDTH: " + wp.ACCEPT_WIDTH + ",ACCEPT_HEIGHT: " + wp.ACCEPT_HEIGHT);
						//	return
						//}
						/**
						 * set height for imageContainer
						 */
						//var containerWidth = 0;
						//var containerHeight = imageContainer.height();
						//if(containerHeight < imageHeight){
						//	containerWidth = Math.round((imageContainer.height()) / imageHeight * imageWidth);
						//}
						//if(containerHeight > imageHeight){
						//	containerHeight = imageHeight;
						//	containerWidth = imageWidth;
						//}
						//imageContainer.css({
						//	width: containerWidth,
						//	height: containerHeight
						//});
						resizeImageModal.modal("show");
					});
					imageUploaded.css({
						width: 1049
					});
					//resizeImageModal.modal("show");
					imageUploaded.Jcrop({
						bgColor: 'black',
						bgOpacity: .4,
						minSize: [wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
						maxSize: [wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
						setSelect: [0, 0, wp.ACCEPT_WIDTH, wp.ACCEPT_HEIGHT],
						aspectRatio: 1,
						onSelect: wp.getCoords
					});

					/**
					 * handle width height 511
					 */
				};
				reader.readAsDataURL(nativeFile);
			}else{
				alert("This browser does not support FileReader.");
			}

		},

		removeAttachment: function(e) {
			e.preventDefault();

			var self = this,
				el = $(e.currentTarget);

			if ( confirm(wpuf_frontend_upload.confirmMsg) ) {
				var data = {
					'attach_id' : el.data('attach_id'),
					'nonce' : wpuf_frontend_upload.nonce,
					'action' : 'wpuf_file_del'
				};

				jQuery.post(wpuf_frontend_upload.ajaxurl, data, function() {
					el.parent().parent().remove();

					self.count -= 1;
					self.showHide();
					self.uploader.refresh();
				});
			}
		}
	};
})(jQuery);