
	/**
	 * Upload handler helper
	 *
	 * @param string {browse_button} browse_button ID of the pickfile
	 * @param string {container} container ID of the wrapper
	 * @param int {max} maximum number of file uplaods
	 * @param string {type}
	 */
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
		this.uploader.bind('Init', $.proxy(this, 'init'));
		//this.uploader.bind('FilesAdded', $.proxy(this, 'add'));
		this.uploader.bind('FilesAdded', $.proxy(this, 'added'));
		//this.uploader.bind('QueueChanged', $.proxy(this, 'upload'));
		this.uploader.bind('UploadProgress', $.proxy(this, 'progress'));
		this.uploader.bind('Error', $.proxy(this, 'error'));
		this.uploader.bind('FileUploaded', $.proxy(this, 'uploaded'));

		this.uploader.init();

		$('#' + container).on('click', 'a.attachment-delete', $.proxy(this.removeAttachment, this));
		var wpufUploader = this;
		$("#resizeImage").on("click", function(){
			console.log("resize...");
			wpufUploader.resizeImage();
		});
	};

	WPUF_Uploader.prototype = {

		isResized: false,
		fileName: "",
		selectArea: [],
		getCoords: function(c){
			//console.log(this);
			//this.selectArea = c;

			$("#jcropCoord").val(JSON.stringify(c));
		},

		init: function(up, params){
			var wpufUploader = this;
			this.showHide();

		},
		add: function(up, files){
			console.log("uploader add file");
			var nativeFile = files[0].getNative();
			this.uploader.removeFile(files[0]);
			this.fileName = files[0].name;
			this.addImageUploaded(nativeFile);
		},
		showHide: function(){

			if(this.count >= this.max){
				$('#' + this.container).find('.file-selector').hide();

				return;
			}
			;

			$('#' + this.container).find('.file-selector').show();
		},

		addImageUploaded: function(file){
			console.log(this);
			var wpufUploader = this;
			var canvas = document.querySelector('#uniCanvas');
			var ctx = canvas.getContext('2d');
			var imageContainer = $("#imageContainer");
			var getCoords = wpufUploader.getCoords;
			if(typeof (FileReader) != "undefined"){
				var reader = new FileReader();
				reader.onload = function(e){
					//new image uploaded, clear the old one
					imageContainer.empty();
					canvas.width = 0;
					canvas.height = 0;
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					//create new  image uploaded
					var imageUploaded = $("<img>");
					//get image source
					var imageSource = e.target.result;
					//add src, id to image uploaded
					imageUploaded.attr("id", "imageUploaded");
					imageUploaded.attr("src", imageSource);
					//append to image container
					imageUploaded.appendTo(imageContainer);
					$("#wpuf-insert-image-container").Jcrop();
					imageUploaded.Jcrop({
						aspectRatio: 1,
						onSelect: getCoords
					});
				};
				reader.readAsDataURL(file);
			}else{
				alert("This browser does not support FileReader.");
			}
		},
		resizeImage: function(){
			var wpufUploader = this;
			console.log("resize click");
			var canvas = document.querySelector('#uniCanvas');
			var ctx = canvas.getContext('2d');
			//console.log(this.selectArea);
			//var selectArea = this.selectArea; console.log(selectArea);
			var selectArea = JSON.parse($("#jcropCoord").val());console.log("selectArea");console.log(selectArea);
			var imageContainer = $("#imageContainer");
			if(selectArea.length > 0){

			}
			if(selectArea){
				var img = document.querySelector("#imageUploaded");
				canvas.width = selectArea.w;
				canvas.height = selectArea.h;
				//canvas.width = 200;
				//canvas.height = 200;
				ctx.drawImage(img, selectArea.x, selectArea.y, selectArea.w, selectArea.h, 0, 0, selectArea.w, selectArea.h);
				//ctx.drawImage(img, 20, 30, 200, 200, 0, 0, 200, 200);
				//imageContainer.empty();

			}else{
				window.prompt("select before drop");
			}
			var dataUrl = canvas.toDataURL();
			//var canvasDrawImage = $("<img>");
			//canvasDrawImage.attr("src", dataUrl);
			//canvasDrawImage.attr("id", "canvasDrawImage");
			//canvasDrawImage.appendTo(imageContainer);
			//var blobBin = atob(dataUrl.split(',')[1]);
			//var array = [];
			//for(var i = 0; i < blobBin.length; i++){
			//	array.push(blobBin.charCodeAt(i));
			//}
			//var file = new Blob([new Uint8Array(array)], {type: 'image/png'});
			//this.uploader.addFile(file);
			// convert base64/URLEncoded data component to raw binary data held in a string




			var byteString;
			if (dataUrl.split(',')[0].indexOf('base64') >= 0)
				byteString = atob(dataUrl.split(',')[1]);
			else
				byteString = unescape(dataUrl.split(',')[1]);
			// separate out the mime component
			var mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];console.log(mimeString);
			// write the bytes of the string to a typed array
			var ia = new Uint8Array(byteString.length);
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}


			var uploaderSettings = this.uploader.settings;

			var nativeFile = new Blob([ia], {type: mimeString});console.log("nativeFile"); console.log(nativeFile);
			nativeFile.name = "hoanganh.png";
			//console.log(nativeFile);
			//var ext = mimeString.substr(6, mimeString.length);
			//console.log(ext);
			//var file = new plupload.File(nativeFile);
			var formData = new FormData();
			formData.append("wpuf_file", nativeFile, "hoanganh.png");
			//console.log("formData");console.log(formData);
			//console.log(formData);
			var oReq = new XMLHttpRequest();
			//oReq.onload = function(){
			//	console.log(oReq.response);
			//};
			console.log(wpufUploader.uploader.settings.url);
			oReq.open("post", "http://localhost/tmdt/wp-admin/admin-ajax.php?action=wpuf_file_upload");
			// oReq.responseType = "arraybuffer";
			oReq.onload = function(e){
				console.log(oReq.response);
			};
			oReq.send(formData);
			//var file = new plupload.File(nativeFile);
			//file.name = this.fileName;
			//file.type = mimeString;
			//file.loaded = nativeFile.size;
			//file.size = nativeFile.size;
			//file.origSize = nativeFile.size;
			//console.log("plupload.File");console.log(file);
			//var canvasImg = document.querySelector("#canvasDrawImage");

			//console.log(file.name);
			this.isResized = true;
			//this.uploader.addFile(file);
			//this.uploader.start();
			//this.uploader.addFile(canvasImg);
			//var $container = $('#' + this.container).find('.wpuf-attachment-upload-filelist');
			//$container.append(
			//	'<div class="upload-item" id="' + file.id + '"><div class="progress progress-striped active"><div class="bar"></div></div><div class="filename original">' +
			//	file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
			//	'</div></div>');
			//$.ajax({
			//	url: uploaderSettings.url,
			//	type: "POST",
			//	data: {
			//		'action': 'upload-attachment'
			//	}
			//}).done(function(response){console.log(response)});
			////this.uploader.start();
		},

		added: function (up, files) {
			//var $container = $('#' + this.container).find('.wpuf-attachment-upload-filelist');
			//
			//this.count += 1;
			//this.showHide();
			//
			//$.each(files, function(i, file) {
			//	$container.append(
			//		'<div class="upload-item" id="' + file.id + '"><div class="progress progress-striped active"><div class="bar"></div></div><div class="filename original">' +
			//		file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
			//		'</div></div>');
			//});
			//
			//up.refresh(); // Reposition Flash/Silverlight
			//up.start();
			//this.isResized = true;
			if(this.isResized){
				console.log("added");
				console.log(files[0]);
				console.log(files[0].name);
				//console.log(this.uploader.settings.url);
				//console.log(this.uploader.settings.flash_swf_url);
				var $container = $('#' + this.container).find('.wpuf-attachment-upload-filelist');

				this.count += 1;
				this.showHide();

				$.each(files, function(i, file) {
					$container.append(
						'<div class="upload-item" id="' + file.id + '"><div class="progress progress-striped active"><div class="bar"></div></div><div class="filename original">' +
						file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
						'</div></div>');
				});

				up.refresh(); // Reposition Flash/Silverlight
				up.start();
				this.isResized = false;
			}else{
				var nativeFile = files[0].getNative();
				this.uploader.removeFile(files[0]);
				this.fileName = files[0].name;
				this.addImageUploaded(nativeFile);
			//	//window.alert("fuck you");
			}
		},

		//upload: function (uploader) {
		//	this.uploader.start();
		//},

		progress: function (up, file) {
			var item = $('#' + file.id);

			$('.bar', item).css({ width: file.percent + '%' });
			$('.percent', item).html( file.percent + '%' );
		},

		error: function (up, error) {
			$('#' + this.container).find('#' + error.file.id).remove();

			var msg = '';
			switch(error.code) {
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

			this.count -= 1;
			this.showHide();
			this.uploader.refresh();
		},

		uploaded: function (up, file, response) {
			// var res = $.parseJSON(response.response);

			$('#' + file.id + " b").html("100%");
			$('#' + file.id).remove();

			if(response.response !== 'error') {
				var $container = $('#' + this.container).find('.wpuf-attachment-list');
				$container.append(response.response);
			} else {
				console.log(response);
				alert(response);

				this.count -= 1;
				this.showHide();
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
