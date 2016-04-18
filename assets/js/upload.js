;jQuery.noConflict();
(function($){
	window.WPUF_Uploader = function(browse_button, type, allowed_type, max_file_size){
		this.browse_button = browse_button;
		//instantiate the uploader
		this.uploader = new plupload.Uploader({
			runtimes: 'html5,html4',
			browse_button: browse_button,
			max_file_size: max_file_size + 'kb',
			url: wpuf_frontend_upload.ajaxurl,
			filters: [{
				title: 'Allowed Files',
				extensions: allowed_type
			}]
		});
		//attach event handlers
		this.uploader.bind('Init', $.proxy(this, 'init'));
		this.uploader.bind('FilesAdded', $.proxy(this, 'added'));
		this.uploader.bind('Error', $.proxy(this, 'error'));
		this.uploader.init();


	};
	WPUF_Uploader.prototype = {
		imageInfo: [],
		fileName: new Date().toString(),
		form: [],
		btnSubmmit: [],
		selectArea: [],
		btnResize: [],
		imageUploaded: [],
		canvas: [],
		resizeImageModal: [],
		scaleImageRate: 1,
		count: 0,
		jCropAPI: {},
		ACCEPT_WIDTH: 511,
		ACCEPT_HEIGHT: 511,
		init: function(){
			console.log("uploader init");
			this.resizeImageModal = $("#resizeImageModal");
			this.canvas = $("#uniCanvas");
			this.btnResize = $("#btnResize");
			this.btnSubmmit = $("input[type='submit']");
			this.form = $(this.btnSubmmit.get(0).form);
			this.imageInfo = $("#imageInfo");
			/**
			 * handle event
			 */
			this.resizeImageModal.on("hide.bs.modal", $.proxy(this, "modalOnHide"));
			this.btnResize.on("click", $.proxy(this, "btnResizeClick"));
			this.btnSubmmit.on("click", $.proxy(this, 'ajaxCall'));
		},
		getCoords: function(c){
			console.log("selectArea", c);
			//console.log(this);
			this.selectArea = c;
		},
		modalOnHide: function(){
			console.log("modalOnHide: %s", "jCropAPI.destroy()");
			if(typeof this.jCropAPI.destroy === 'function'){
				this.jCropAPI.destroy();
			}
		},
		btnResizeClick: function(){
			console.log("btnResizeClick: %s", "resizeImage()\nmodal('hide')");
			this.resizeImage();
			$("#resizeImageModal").modal("hide");
		},
		added: function(up, files){
			var wpUpload = this;
			this.fileName = files[0].name;
			var resizeImageModal = this.resizeImageModal;
			var imageContainer = $("<div>");
			resizeImageModal.find(".modal-body").append(imageContainer);
			var file = files[0];
			var nativeFile = file.getNative();
			/**
			 * read nativeFile, append to imageContainer
			 */
			if(typeof (FileReader) != "undefined"){
				var reader = new FileReader();
				reader.onload = function(e){
					//get image source
					var imageSource = e.target.result;
					//new image uploaded, clear the old one
					imageContainer.empty();
					//create new  image uploaded
					var imageUploaded = $("<img>");
					//add src, id to image uploaded
					//image has real size >>> on "load" get size WORK
					imageUploaded.css({
						'max-width': '100%',
						height: 'auto'
					});
					imageUploaded.attr("id", "imageUploaded");
					imageUploaded.attr("src", imageSource);
					wpUpload.imageUploaded = imageUploaded;
					imageContainer.append(imageUploaded);
					//append to image container
					imageUploaded.on("load", function(){
						console.log("imageUploadOnLoad");
						var imageWidth = imageUploaded.get(0).naturalWidth;
						var imageHeight = imageUploaded.get(0).naturalHeight;
						console.log("imageWidth", imageWidth);
						console.log("imageHeight", imageHeight);
						if(imageWidth < wpUpload.ACCEPT_WIDTH || imageHeight < wpUpload.ACCEPT_HEIGHT){
							imageContainer.empty();
							var replacements = {
								"%ACCEPT_WIDTH%": wpUpload.ACCEPT_WIDTH,
								"%ACCEPT_HEIGHT%": wpUpload.ACCEPT_HEIGHT
							};
							var warn = "imageUploaded: discarded\n" +
								"accept WIDTH: %ACCEPT_WIDTH%\n" +
								"accept HEIGHT: %ACCEPT_WIDTH%";

							warn = warn.replace(/%\w+%/g, function(all){
								return replacements[all] || all;
							});
							window.alert(warn);
						}else{
							/**
							 * set height for imageContainer
							 */
							var containerWidth = 0;
							var containerHeight = Math.round(window.innerHeight * 7 / 10);
							if(containerHeight < imageHeight){
								wpUpload.scaleImageRate = containerHeight / imageHeight;
								console.log("wp.scaleImageRate: %s", wpUpload.scaleImageRate);
								containerWidth = imageWidth * wpUpload.scaleImageRate;
							}
							if(containerHeight > imageHeight){
								containerHeight = imageHeight;
								containerWidth = imageWidth;
							}
							imageContainer.css({
								width: containerWidth,
								height: containerHeight
							});
							imageContainer.Jcrop({
								minSize: [wpUpload.ACCEPT_WIDTH, wpUpload.ACCEPT_HEIGHT],
								maxSize: [wpUpload.ACCEPT_WIDTH, wpUpload.ACCEPT_HEIGHT],
								setSelect: [0, 0, wpUpload.ACCEPT_WIDTH, wpUpload.ACCEPT_HEIGHT],
								aspectRatio: 1,
								onSelect: $.proxy(wpUpload, 'getCoords')
							}, function(){
								wpUpload.jCropAPI = this;
							});
							resizeImageModal.find(".modal-dialog").css({
								width: (containerWidth + 38)
							});
							resizeImageModal.modal("show");
						}


					});
				};
				reader.readAsDataURL(nativeFile);

			}else{
				alert("This browser does not support FileReader.");
			}

		},

		resizeImage: function(){
			var wpUpload = this;
			var selectArea = this.selectArea;
			//get(0) get native HTMLElement from jQuery Object
			/** @var HTMLCanvasElement  canvas*/
			var canvas = wpUpload.canvas.get(0);
			var ctx = canvas.getContext('2d');
			var img = wpUpload.imageUploaded.get(0);
			//set width, height for canvas
			canvas.width = selectArea.w;
			canvas.height = selectArea.h;
			console.log("cropImage\nresizeImage by canvas");
			var s = this.scaleImageRate;
			//crop + resize (511, 511)
			ctx.drawImage(img, selectArea.x / s, selectArea.y / s, selectArea.w / s, selectArea.h / s,
				0, 0, selectArea.w, selectArea.h);
			/**
			 * imageInfo
			 */
			var imageTitle = $("#imageTitle");
			imageTitle.val(wpUpload.fileName);
			this.imageInfo.css({display: 'block'});
		},
		addImageInfo: function(imageId){
			$("#imageTitle").attr("name", "wpuf_files_data[" + imageId +"][title]");
			$("#imageCaption").attr("name", "wpuf_files_data[" + imageId +"][caption]");
			$("#imageDecription").attr("name", "wpuf_files_data[" + imageId +"][desc]");
			$("#imageId").val(imageId);
		},
		ajaxCall: function(event){
			console.log("formSubmit preventDefault");
			event.preventDefault();
			console.log(this);
			console.log(event);
			console.log(this.form);
			/**
			 * upload image to server
			 */
			var wpUpload = this;
			var dataUrl = this.canvas.get(0).toDataURL();
			var byteString = atob(dataUrl.split(',')[1]);
			// separate out the mime component
			var mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
			// write the bytes of the string to a typed array
			var unit8Array = new Uint8Array(byteString.length);
			for(var i = 0; i < byteString.length; i++){
				unit8Array[i] = byteString.charCodeAt(i);
			}
			var blobFile = new Blob([unit8Array], {type: mimeString});
			var formData = new FormData();
			formData.append("wpuf_file", blobFile, wpUpload.fileName);
			console.log("blobFile", blobFile);
			var oReq = new XMLHttpRequest();
			var url = wpUpload.uploader.settings.url + "?action=wpuf_file_upload";
			console.log(url);
			oReq.open("post", url);
			oReq.send(formData);
			oReq.onload = function(e){
				var htmlResponse = oReq.response;
				console.log(oReq.response);
				var imageIdServer = $(htmlResponse).val();
				console.log("imageIdServer", imageIdServer);
				wpUpload.addImageInfo(imageIdServer);
				/**
				 * continue form submit
				 */
				wpUpload.form.submit();
			};
		},
		error: function(up, error){
			this.imageInfo.css({display: 'none'});
			var msg = '';
			switch(error.code){
				case -600:
					msg = 'The file you have uploaded exceeds the file size limit. Please try again.';
					break;

				case -601:
					msg = 'You have uploaded an incorrect file type. Please try again.';
					break;

				default:
					msg = 'Error #' + error.code + ': ' + error.message;
					break;
			}
			alert(msg);
		}
	};
})(jQuery);