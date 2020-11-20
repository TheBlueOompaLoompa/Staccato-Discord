function msToTime(s) {
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
  
	return mins + ':' + ((secs.toString(10).length === 1) ? ('0' + secs.toString(10)) : (secs.toString(10)));
}

function validateYouTubeUrl(url = "https://youtube.com/watch?v=fakevideoid")
{
	if (url != undefined || url != '') {
		var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
		var match = url.match(regExp);
		return match && match[2].length == 11;
	}
}

module.exports = {
    msToTime,
    validateYouTubeUrl,
}