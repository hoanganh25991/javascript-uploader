;(function($){
	$(document).ready(function(){
		//window.alert("hello");
		//var ulForm = $(".wpuf-form");
		var divDienTich = $(".dien_tich");console.log(divDienTich);
		var divSoDienThoai = $(".so_dien_thoai");console.log(divSoDienThoai);
		var divCompanyName = $(".company_name");console.log(divCompanyName);
		var divThongTinLienHe = $("<p>");console.log(divThongTinLienHe);
		divThongTinLienHe.html("thong tin lien he");
		//divContainer.before(divSoDienThoai);
		divThongTinLienHe.css({
			border: '1px solid black',
			padding: '10px'
		});
		//divContainer.appendTo(ulForm);
		divThongTinLienHe.insertAfter(divDienTich);
	});
})(jQuery);