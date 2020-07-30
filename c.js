// Init count url
ns = md5("SHIQUAN_WORDS_IN_PICTURE_REMOTE"); //namespace
pn = md5(window.location);
var uvl = "https://api.countapi.xyz/get/" + pn + "/Unique_Visitor"
var huv = "https://api.countapi.xyz/hit/" + pn + "/Unique_Visitor"
var pvl = "https://api.countapi.xyz/hit/" + pn + "/Page_View"
var icl = "https://api.countapi.xyz/get/" + ns + "/Image_Creation"
var hic = "https://api.countapi.xyz/hit/" + ns + "/Image_Creation"

// Count unique visitors
if (document.cookie.replace(/(?:(?:^|.*;\s*)UV\s*\=\s*([^;]*).*$)|^.*$/, "$1") !== "true") {
	$.get(huv);
	document.cookie = "UV=true; expires=Fri, 31 Dec 9999 23:59:59 GMT;SameSite=Lax;";
}

// Render count value
$.ajax({
	url: uvl,
	success: function(data) {
		$("#uv").text(data['value']);
	}
});
$.ajax({
	url: pvl,
	success: function(data) {
		$("#pv").text(data['value']);
	}
});
$.ajax({
	url: icl,
	success: function(data) {
		$("#ic").text(data['value']);
	}
});

function cimg() {
	$.ajax({
		url: hic,
		success: function(data) {
			$("#ic").text(data['value']);
		}
	});
}
