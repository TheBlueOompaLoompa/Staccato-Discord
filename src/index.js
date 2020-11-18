require('dotenv').config();

const YouTube = require('simple-youtube-api');
const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

const ytdl = require('ytdl-core');
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();

const prefix = process.env.BOT_PREFIX ? process.env.BOT_PREFIX : '~';

const broadcast = client.voice.createBroadcast();

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

let volume = 1;

let queue = [];

let playing = false;

async function play(connection, url, msg) {
	ytdl.getBasicInfo(url).then(info => {
		let videoLength = info["videoDetails"]["lengthSeconds"]
		if(videoLength < 900) {
			ytdl(url, {filter: 'audioonly', range: {start: 0}})
				.pipe(fs.createWriteStream(__dirname + '/../song.mp3')).once("finish", () => {
					playing = true;

					broadcast.play(__dirname + '/../song.mp3');

					broadcast.dispatcher.setVolumeLogarithmic(volume);

					broadcast.dispatcher.on("finish", () => {
						queue = queue.slice(1);
						playing = false;
						
						if(queue.length > 0)
							play(connection, queue[0], msg)
					})

					connection.play(broadcast);

					nowPlaying(url, msg.channel);
				});
		} else {
			msg.reply("That video is too long! The maximum is 15 minutes.");
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
		const embed = new Discord.MessageEmbed()
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

function msToTime(s) {
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
  
	return mins + ':' + ((secs.toString(10).length === 1) ? ('0' + secs.toString(10)) : (secs.toString(10)));
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

		const embed = new Discord.MessageEmbed()
			.setColor('#ffffff')
			.setTitle(`Current Time`)
			.setThumbnail(info["videoDetails"]["thumbnail"]["thumbnails"][3]["url"])
			.setDescription(`${msToTime(currentTime)} / ${msToTime(totalTime)}`)
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
		const embed = new Discord.MessageEmbed()
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

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	client.voice.connections.forEach(vc => {
		vc.disconnect();
	})
});

client.on('message', msg => {
	if(msg.content.startsWith(`${prefix}play`)) {
		let voiceChannel = msg.member.voice.channel;

		let args = msg.content.split(' ').slice(1);

		console.log(args.join(' '));

		if(!voiceChannel)
			return;

		voiceChannel.join().then(vc => {
			if(args.length === 0) {
				if(queue.length > 0) {
					play(vc, queue[0], msg);
				}
				return;
			}

			vc.voice.setMute(false).catch(reason => console.log);
			ytdl.getBasicInfo(args[0]).then(() => {
				queue.insert(0, args[0]);
				play(vc, queue[0], msg);
			}).catch(() => {
				youtube.searchVideos(query, 1)
						.then(results => {
							if(results.length === 0) {
								msg.reply('Unable to queue the song :(');
								return;
							}

							queue.insert(0, results[0].url);
							play(vc, queue[0], msg);
						}).catch(reason => {
							msg.reply('Unable to queue the song :(')
							console.log(reason)
						});
			});
		}).catch(reason => {
			msg.channel.send("Failed to play your song :(");
		});
	}

	if(msg.content.startsWith(`${prefix}stop`)) {
		broadcast.end();
	}

	if(msg.content.startsWith(`${prefix}time`)) {
		showTime(queue[0], msg);
	}

	if(msg.content.startsWith(`${prefix}queue`)) {
		const args = msg.content.split(' ').slice(1);

		if(args.length === 0) {
			return;
		}

		ytdl.getBasicInfo(args[0]).then(() => {
			queueVideo(args[0], msg);
		}).catch(() => {
			youtube.searchVideos(query, 1)
					.then(results => {
						if(results.length === 0) {
							msg.reply('Unable to queue the song :(');
							return;
						}
						
						queueVideo(results[0].url, msg);
					}).catch(reason => {
						msg.reply('Unable to queue the song :(')
						console.log(reason)
					});
		});


	}

	if(msg.content.startsWith(`${prefix}vol`)) {
		const args = msg.content.split(' ').slice(1);

		if(args.length === 0) {
			return;
		}

		if(parseInt(args[0], 10) > 100) {
			msg.reply(`${args[0]} is greater than 100, the maximum volume is 100.`);
			return;
		}

		volume = parseInt(args[0], 10) / 100;

		try {
			broadcast.dispatcher.setVolumeLogarithmic(volume);
		} catch (err) {
			console.log("Brodcast isn't dispatched yet!");
		}
	}
});

client.login(process.env.BOT_TOKEN);