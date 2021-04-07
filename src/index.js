require('dotenv').config();

const YouTube = require('simple-youtube-api');
const youtube = new YouTube(process.env.YOUTUBE_API_KEY);
const Discord = require('discord.js');
const client = new Discord.Client();
const cmd = require('./commandFunctions');
const util = require('./util');

const prefix = process.env.BOT_PREFIX ? process.env.BOT_PREFIX : '~';

const broadcast = client.voice.createBroadcast();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	client.voice.connections.forEach(vc => {
		vc.disconnect();
	});

	cmd.init(broadcast, prefix);
});

client.on('message', msg => {
	if(msg.author.id == 449964764798648360) return;
	if(msg.content.startsWith(`${prefix}play`)) {
		let voiceChannel = msg.member.voice.channel;

		let args = msg.content.split(' ').slice(1);

		console.log(args.join(' '));

		if(!voiceChannel)
			return;

		voiceChannel.join().then(vc => {
			if(args.length === 0) {
				if(cmd.getQueueLength() > 0) {
					cmd.play(vc, cmd.getQueue(0), msg).catch(reas => {console.log(reas)});
					console.log("Playing queue")
				}
				return;
			}
			
			vc.voice.setMute(false).catch(reason => console.log);
			if(util.validateYouTubeUrl(args.join(' '))) {
				cmd.insertToQueue(args[0]);
				cmd.play(vc, cmd.getQueue(0), msg).catch(reas => {console.log(reas)});
			} else {
				youtube.searchVideos(args.join(' '), 1)
						.then(results => {
							if(results.length === 0) {
								msg.reply('Unable to queue the song :(');
								return;
							}

							cmd.insertToQueue(results[0].url);
							cmd.play(vc, cmd.getQueue(0), msg).catch(reas => {console.log(reas)});
						}).catch(reason => {
							msg.reply('Unable to queue the song :(')
							console.log(reason)
						});
			}
		}).catch(reason => {
			console.log(reason);
			msg.channel.send("Failed to play your song :(");
		});
	}

	if(msg.content.startsWith(`${prefix}stop`)) {
		broadcast.end();
		cmd.removeFromQueue(0);
		cmd.leave();
	}

	if(msg.content.startsWith(`${prefix}time`)) {
		cmd.showTime(cmd.getQueue(0), msg);
	}

	if(msg.content.startsWith(`${prefix}skip`)) {
		let voiceChannel = msg.member.voice.channel;
		cmd.skipSong(voiceChannel, msg);
	}

	if(msg.content.startsWith(`${prefix}queue`)) {
		const args = msg.content.split(' ').slice(1);

		if(args.length === 0) {
			cmd.showQueue(msg);
			return;
		}else {
			if(util.validateYouTubeUrl(args.join(' '))) {
				cmd.queueVideo(args[0], msg)
			} else {
				youtube.searchVideos(args.join(' '), 1)
						.then(results => {
							if(results.length === 0) {
								msg.reply('Unable to queue the song :(');
								return;
							}
	
							cmd.queueVideo(results[0].url, msg);
						}).catch(reason => {
							msg.reply('Unable to queue the song :(')
							console.log(reason)
						});
			}
		}
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

		console.log(`Set volume to ${cmd.setVolume(parseInt(args[0], 10) / 100)}`);
	}

	if(msg.content.startsWith(`${prefix}help`) && !msg.author.bot) {
		cmd.showHelp(msg);
		msg.delete();
	}
	if(msg.content.startsWith(`${prefix}oops`)) {
		cmd.removeFromQueue(cmd.getQueueLength() - 1)
	}
});

client.login(process.env.BOT_TOKEN);
