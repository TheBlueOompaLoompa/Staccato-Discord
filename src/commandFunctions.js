const ytdl = require('ytdl-core');
const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const util = require('./util');
const help = require('./help.json');

let prefix = '.';
let broadcast;
let volume = 1;

let queue = [];

let c;

let playing = false;

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

async function play(connection, url, msg) {
	c = connection;
	ytdl.getBasicInfo(url).then(info => {
		let videoLength = info["videoDetails"]["lengthSeconds"]
		if(videoLength < 1200 * 5) {
			console.log("started downloading");
			ytdl(url, {filter: 'audioonly', range: {start: 0}})
				.pipe(fs.createWriteStream(__dirname + '/../song.mp3')).once("finish", () => {
					console.log("downloaded");
					playing = true;

					broadcast.play(__dirname + '/../song.mp3', { highWaterMark: 50 });

					broadcast.dispatcher.setVolumeLogarithmic(volume);

					connection.play(broadcast, { highWaterMark: 50 });

					nowPlaying(url, msg.channel);

					broadcast.dispatcher.on("finish", () => {
						queue = queue.slice(1);
						playing = false;
						
						if(queue.length > 0){
							play(connection, queue[0], msg)
						}else{
							connection.disconnect();
						}
					})
				});
		} else {
			msg.reply("That video is too long! The maximum is 25 minutes.");
			queue = queue.slice(1);

			playing = false;
						
			if(queue.length > 0)
				play(connection, queue[0], msg)
		}
	}).catch(reason => {
		console.log(reason);
		msg.reply('Unable to play the song :(');
	});	
}

function queueVideo(url, msg) {
	queue.push(url);
	ytdl.getBasicInfo(url).then(info => {
		console.log(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"]);
		const embed = new MessageEmbed()
			.setColor('#ffffff')
			.setTitle(`Queued for Playing`)
			.setThumbnail(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"])
			.setDescription(info["videoDetails"]["title"])

			.addField("URL:", url);
		;

		msg.channel.send(embed);
	}).catch(reason => {
		console.log(reason);
		msg.channel.send("Unable to get video info");
	});
}

async function generateSongs() {
    let songs = [];

    for (let i = 0; i < queue.length; i++){
        let info = await ytdl.getBasicInfo(queue[i]);
        songs.push({name: "Index:", value: `${i + 1}`, inline: true});
        songs.push({name: "Title:", value: `${info["videoDetails"]["title"]}`, inline: true});
        songs.push({name: "URL:", value: `${queue[i]}`, inline: true});
        songs.push({ name: '\u200B', value: '\u200B' });
    }

    return songs;
}

function showQueue(msg) {
    if(queue.length === 0){
		msg.reply("There isn't a song playing right now!");
		return;
    }
    
    let songs = [];
    
    generateSongs().then(s => {
        songs = s;

        const embed = new MessageEmbed()
        .setColor("#ffffff")
        .setTitle('Songs in Queue')
        .addFields(...songs);

        msg.channel.send(embed);
    });    
}

function showTime(url, msg) {
	if(queue.length === 0){
		msg.reply("There isn't a song playing right now!");
		return;
	}
	ytdl.getBasicInfo(url).then(info => {
		console.log(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"]);

		let currentTime = broadcast.dispatcher.streamTime;
		let totalTime = info["videoDetails"]["lengthSeconds"] * 1000;

		const embed = new MessageEmbed()
			.setColor('#ffffff')
			.setTitle(`Current Time`)
			.setThumbnail(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"])
			.setDescription(`${util.msToTime(currentTime)} / ${util.msToTime(totalTime)}`)
			.setTimestamp()

			.addField("Title:", info["videoDetails"]["title"])
			.addField("URL:", url)
		;

		msg.channel.send(embed);
	}).catch(reason => {
		console.log(reason);
		msg.channel.send("Unable to get video info");
	});
}

const nowPlaying = (url, channel) => {
	ytdl.getBasicInfo(url).then(info => {
		console.log(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"]);
		const embed = new MessageEmbed()
			.setColor('#ffffff')
			.setTitle(`Now Playing`)
			.setThumbnail(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"])
			.setDescription(info["videoDetails"]["title"])

			.addField("URL:", url);
		;

		channel.send(embed);
	}).catch(reason => {
		console.log(reason);
		channel.send("Unable to get video info");
	});	
}

function generateHelp() {
    let shownHelp = help;
    
    shownHelp.fields.forEach((value, idx) => {
        shownHelp.fields[idx].name = shownHelp.fields[idx].name.replace('${prefix}', prefix);
        shownHelp.fields[idx].value = shownHelp.fields[idx].value.replace('${prefix}', prefix);
    });

    return shownHelp;
}

function leave(){
	c.disconnect();
}

function skipSong(voiceChannel, msg) {
    queue = queue.slice(1);
    broadcast.end();
    if(queue.length > 0) {
        voiceChannel.join().then(vc => {
            play(vc, queue[0], msg);
        }).catch(reason => {
            msg.reply("Failed to play the next song :(");
            queue = queue.splice(1);
        })
    }
}

module.exports = {
    init: (broad, pref) => {
        broadcast = broad;
        prefix = pref;
    },
    insertToQueue: (item) => {
        queue.insert(0, item);
    },
    removeFromQueue: (idx) => {
    	queue.splice(idx, 1);
    },
    getQueue: (idx) => {
        return queue[idx];
    },
    getQueueLength: () => {
        return queue.length;
    },
    setVolume: (vol = 1.0) => {
        volume = vol;

        try {
			broadcast.dispatcher.setVolumeLogarithmic(volume);
		} catch (err) {
			console.log("Brodcast isn't dispatched yet!");
		}

        return vol;
    },
    showHelp: (msg) => {
        const help = new MessageEmbed(generateHelp())
        msg.channel.send(help);
    },
    play,
    queueVideo,
    showQueue,
    showTime,
    nowPlaying,
    skipSong,
    leave,
}
