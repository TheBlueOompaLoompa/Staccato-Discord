![Staccato Badge](https://img.shields.io/badge/Staccato-Discord-blueviolet)![Issues Badge](https://img.shields.io/github/issues/TheBlueOompaLoompa/Staccato-Discord)[![GitHub forks](https://img.shields.io/github/forks/TheBlueOompaLoompa/Staccato-Discord)](https://github.com/TheBlueOompaLoompa/Staccato-Discord/network)[![GitHub stars](https://img.shields.io/github/stars/TheBlueOompaLoompa/Staccato-Discord)](https://github.com/TheBlueOompaLoompa/Staccato-Discord/stargazers)[![GitHub license](https://img.shields.io/github/license/TheBlueOompaLoompa/Staccato-Discord)](https://github.com/TheBlueOompaLoompa/Staccato-Discord)
# Staccato-Discord
The music bot for your discord server
## Requirements
* Node - Version 12 or later
* npm - this comes with node
* A google cloud project with the youtube api enabled and an api key
* A discord application with the bot enabled and it's api key
## How to setup
### Clone the repository
```bash
git clone https://github.com/TheBlueOompaLoompa/Staccato-Discord.git
```
### cd into the directory
```bash
cd Staccato-Discord
```
### Install the dependencies
```bash
npm i
```
### Create the file to startup with configurations (this will only work on linux)
Create a file in the root Staccato-Discord called .env
Inside that file put
```
BOT_TOKEN=YOUR DISCORD BOT TOKEN HERE
YOUTUBE_API_KEY=YOUR GCP YOUTUBE DATA API KEY HERE
BOT_PREFIX=WHATEVER YOU WANT TO BE USED BEFORE THE COMMANDS
```
You don't need to add the bot prefix line because by default the prefix is ```.```
# Starting the bot
Just run npm start

# License Info
   Copyright 2020 Ben Nack

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
