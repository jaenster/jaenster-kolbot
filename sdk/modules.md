# NodeJS like modules
Nodejs is great, and it has quite some sick abilities to use modules. I miss that in kolton, so i have added.

All modules are located in kolbot\libs\modules). When you use `require`, it always relates to the path `kolbot\libs\modules`. Keep this in mind, as this differs from native nodejs.

First a list of event based modules
- Events
- GameEvent
- Messaging
- Quests
- Team
- Packet
- LocationEvents

Normal libs
- Attack
- Config
- Pickit
- Control
- PreAttack
- Precast
- TownPrecast
- Promise
- Skills
- Storage
- Worker

Development Libs
- PacketSnooper
- Debug

Some modules get loaded upon the class of the char:
They override some functions, to implement class specific behaviour. Note some are missing ;)
- Assassin
- Necromancer
- Paladin
- Sorceress

Some modules are mainly for internal use, and you do not need to use
- AutoConfig
- Avoid
- CollMap
- Conveniences
- FastQuit
- Loader
- LocaleStringID
- Login
- NTIP
- QuitList
- Party
- GameData
# Event driven modules
## Events 
Like the NodeJS Events. Returns an function you need to call with new, so it acts like as a class. This is the base of all events modules
```javascript
const myEvents = new (require('Events'));


module.exports = myEvents;
module.exports.myFunction = function() {
	myEvents.emit('something','data');
}
``` 

## GameEvent
So you can hook upon game events. Possible events are quit, join, slain, hostile, soj, clone
```javascript
const GameEvent = require('GameEvent');

GameEvent.on('quit',function(name,account) {
	print(name+'@'+account+' quit the game');
});

GameEvent.on('join',function(name,account) {
	print(name+'@'+account+' joined the game');
});

GameEvent.on('soj',function(count) {
	print(count+' on '+me.realm+' - '+Number(me.gameserverip.split('.')[3]));
});
```

## Messaging
For internal thread communication, an replacement for `addEventListener('scriptmsg',callback)` and `scriptBroadcast('')`.
```javascript
const Messaging = require('Messaging');

// Hook upon incoming data 
Messaging.on('myScript',function(data) {
	// Data always isn an object
	if (data.hasOwnProperty('test')) {
		print(data.test);
	}
});

// Hook upon outgoing data
Messaging.send({myScript: {test: 'Some Data'}});
```

## Quests
Don't want to check everywhere for quest states? Just hook upon the quest of choice.
````javascript
const Quests = require('Quest'),
    Promise = require('Promise');

Quests.on(sdk.quests.SistersToTheSlaughter /*questNumber*/ ,function(sub, state) {
    // number and state you can compare to the old usage of me.getQuest....
    // So, its like:
    // let state = me.getQuest(questNumber,sub);
    
    if (sub === 1 && state) { // Value 1 is changed to "true"
        print('Just completed andy');
        
        // Make a promise that resolves next time we are in town.
        new Promise(resolve=> me.inTown && resolve())
            .then(function() { // Assuming here we are in act 1.
                // Now we are in town, lets switch to act 2.
                Town.move("warriv");
                const npc = getUnit(1, "warriv");
                npc.openMenu() && npc.useMenu(sdk.menu.GoEast);
            })
    }
})
````

## Team
Communicate with other clients, in a more easy way as using sendCopyData. Here an example with minimum code.
````javascript
const Team = require('Team');
const BaalData = {safe:false};

Team.on('Baal',function(data) {
    for(let i of data) {
    	BaalData[i] = data[i];
    }
});


// Ran by multiple bots
if (Leader) { // the leader
	
	Pather.journeyTo(sdk.areas.ThroneOfDestruction);
	Pather.moveTo(15083, 5035);
	Pather.makePortal(true);
	// Clear around baal
	getUnit(1,sdk.monsters.ThroneBaal).clear(60);
	
	// let the rest know the tp is safe
    Team.broadcastInGame({Baal: {safe: true}});
    
} else { // the leecher
	
	Town.goToTown(5) && Town.move("portalspot");
	while(!BaalData.safe) delay(50); // wait for safe tp
	Pather.usePortal(sdk.areas.ThroneOfDestruction,null);
}
````

## Packet
This module isn't implemented yet. But, you should be able to hook upon packets, without crashing
````javascript
const Packet = require('Packet');

Packet.on(0xA4,function() {
  print('Baal laughed');
});
````

## LocationEvents
A way to hook upon the event of changing states of out of game locations.
````javascript
const LocationEvents = require('LocationEvents'),
    Control = require('Control');

LocationEvents.on(sdk.locations.Lobby,function() {
  Control.EnterChat.click(); // Click on chat when we arrive in lobby
});
````

# Other kind of libs

## Config / Attack / Pickit
These versions are the same of koltons original lib\common\x.js. Note that these aren't global objects anymore.
If you need anything from the users configuration, retrieve it with `const Config = require('Config');`
Same with the Attack/Pickit.

Its also given to a gamescript, like for example
```javascript
function Baal(Config,Attack,Pickit) {}
```

## Control
This is an reference module. So, it is more easy to use the out of game (oog) buttons. Also used in the LocationEvent example
```javascript
const Control = require('Control');
Control.JoinGameName.setText('nextGame');
``` 

## PreAttack
Usefull little lib, if you expect an monster in so many miliseconds, it preattacks (like waiting for an wave, or diablo)
```javascript
const PreAttack = require('PreAttack');
// For more examples dive into SpeedDiablo / SpeedBaal
PreAttack.do(monsterId, tickWhenYouExpect, {x,y});
```

## Precast
Fully rewritten precast. You shouldnt actually need to use this, as it is happing automaticly while moving/attacking.
But if you want to, this is how it works
```javascript
const Precast = require('Precast');
Precast(); // How hard can it be =)
```

## TownPrecast
This cast's the precasts possible in town.
```javascript
const TownPrecast = require('TownPrecast');


const success = TownPrecast();
if (success) {
	// All your precast skills, are town castable
} else {
	// Not all your precast skills are castable in town, so it didnt do it
    const Precast = require('Precast');
    Precast.outTown(function() {
    	Pather.useWaypoint(sdk.areas.PandemoniumFortress); // After boing outside of town, go to act4.
    })
}

// Or, what you also can use, just prep already in town what you can, like holyshield/frost armor and such
TownPrecast.prepare(); // It casts what it can in town.
```

## Promise
Promises, like in es6 javascript. Its used to generate/create self made events
```javascript
const Promise = require('Promise');
new Promise(function() {
	if (me.inTown) {
		resolve();
	}
}).then(function() {
	// Gets called when in town.
	// Do something, like talk with warriv (see the Quests example)
})
```

## Skills
A set of array-like objects to get data for skills.
```javascript
const Skills = require('Skills');

Skills.class[sdk.skills.Telekinesis];   // returns 1, as it is an sorc skill
Skills.tab[sdk.skills.Telekinesis];     // returns 9, as it is an lighting skill
Skills.aura[sdk.skills.BlessedHammer];  // returns 113 (Concentration), as that renders the most damage with hammers
Skills.range[sdk.skills.Blizzard];      // returns the range of blizzard

Skills.hand[sdk.skills.LightningFury];  // returns the correct hand for the skill
Skills.isTimed[sdk.skills.Meteor];      // returns true, as it is a timed skill
Skills.manaCost[sdk.skills.FireBall];   // returns how much mana you would spend casting a fireball
Skills.town[sdk.skills.FrozenArmor];    // returns true, as frozen armor can be cast in town.
```

## Storage
Not much more as the old Storage system of kolton, but wrapped in a module. Some minor improvements are on it, but check the commits on it.
````javascript
const Storage = require('Storage');
````


## Worker
The module that adds the async-ish ability to d2bs. There isn't a big chance you will use this yourself directly, but most modules depend on it.

Another good example is the Messaging module, which uses Worker.
```javascript
const Worker = require('Worker');
const myEvents = new (require('Events'));

// Example to write an module to throw an event when we are in town

let oldstate = -1; // -1 is an invalid state, so the first time we check we emit too.
Worker.runInBackground.myChecker = function() {
    if (oldstate !== me.inTown) {
    	oldstate = me.inTown; // store the new value;
    	myEvents.emit(me.inTown);
    }
    	
    return true; // keep on looping, aslong we give back true
};

module.exports = {
	on: myEvents.on,
	off: myEvents.off,
	once: myEvents.once,
}
```

# The rest
I'll describe the rest later, but those are mainly internally used, or rarely specifiably required yourself by a script. What is above here is what would be very useful to use in your code