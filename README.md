# D2BS IS NOT SAFE FROM DETECTION!

# So what is this?
This is an attempt to create a new version of kolton, that is more clean, clear and more easy to setup and use.

# What is different?
This version of kolton has the following features:
- Fully automatic skills
- Fully automatic configuration
- Fully automatic Inventory setup *in development*
- A single configuration file
- Mana use *in development*
- New scripts
- New Party
- New precasting
- Faster weapon switching
- Automatic teleswitch *in development*
- More effiecient towning. *in development*
- Technical stuff


## Fully automatic skills
This bot determine's in every situation on every monster, on every cast what skill to use. To get technical what it does
is simply lists all the skills you have, calculates the damage on that monster (and surrounding monsters), and picks the best.

This way you never ever have to worry about setting up skills for when it encounter immune's, and those hybrid sorcs are suddenly allot more viable

Note: This doesnt work properly yet with melee skills (barb basically, or a paladin that doesnt smite or throws hammers).

## Fully automatic configuration.
You do not need to setup if the bot needs to watch the merc, or what class specifics you need to setup. It simply does this for you.
One of the few things that you still need to do is setup which pickit you need to use.

Note: All settings are still overridable. (just put the old Config.Whatever = "what i actually wanted"; in the config file)

## Fully automatic Inventory setup
This is a peace of code that is not finished, and not in the main code base. As it isn't properly tested yet. More info on this later.

## A single configuration file
Are you tired too of setting up D2BotFollow, and a config file? No more. Everything is handled from a single configuration file

## Mana use
This is not fully functional yet, but if the script determines the monster your trying to kill is a 1 hit with a fire bolt, and a 1 hit with a fire ball. 
It will prefer to cast a fire bolt, as it costs less mana. However, the fireball also blasts its surroundings, so at the moment it still often prefers the
skill that uses more mana. This still needs some tweaking =)

## New Scripts
AutoMagicFind.
    
      This is a weird script, not anything like your used to.
      It calculates which 85+ areas are the easiest for this character to pwn, to the hardest to do so.
      This reduces the chickens, well atleast it puts chickens more later in game.
      And if you used all your Rev pots in your last chickend game, you build them up in the easy areas
      
SpeedDiablo

    This is a script that are both for the leader, as the follower. (no seperated diablo/diahelper scripts).
    You can do a teamed fast diablo, or a solo full diablo run with it. It seems to knock of 20% of the time of a 
    regular diablo run in my test.

SpeedBaal
    
    This is quite simular to the SpeedDiablo, it is a script that is designed for multibotting and just simply does baal
    faster as the original Baal scripts. Again, this is both a leader as a follower script.
 
 ## New party
 There is a new party script. No more hassle with setting up an inviter, and an accepter. 
 The party script is simply always enabled (in multiplayer) and works fully automatic. If you specificly do _not_ want the bot to party,
 put in your config file: `Config.Party = false;`
 
 ## New precasting
 Precasting is always something that annoyed me personally allot with the original kolton. This will re-pre-casts whenever something is needed 
 or expires. Due to the fast switching of weapons now, you will barely notice it re-casted battle orders. It also keeps an eye on your merc, 
 or your summoned goods that not have an bo yet.
 
 ## Faster weapon switching
 As mentioned above, switching weapons is about 5 times (no kidding) faster as regular kolton. Not much more to tell about that ;) 
 This benefits stuff like teleswitching _allot_, as in the original, just switching weapons is so extremely slow, its pointless to do so.
 
 ## Automatic Teleswitching
 This is very much in development, so i cant say much about it. But the idea is that it does this automatically, 
 and if you go trough multiple areas, it doesnt switch back to the original weapon.
 
 ## More efficient towning
 This is also very much in development, but the idea is that if your close to an healer (like when you pass Atma in act 2), 
 just grab a heal anyway (unless you fully full), but not low enough to trigger the regular "heal" event.
 More stuff like this is due to come, but its tricky to setup without bugging the rest out of the game.
  
 # Great, how to set it up? 
 The entire goal is that you only need to setup 1 single file. So you never ever have to edit the D2BotWhatever config files. Keep this in mind

So how?
- Open the manager setup as your used to
- Go to folder d2bs\kolton\config\
- Copy and paste the Example.js file
- Rename your new copy to "ProfileName.js", profilename as given in the manager, **not charname**
- Open the file named after your profile. And set it up

```javascript 1.6
	// Figure out all settings on its own
	// Including skills, inventory, belt, merc usage, chicken, everything
	AutoConfig();

	// In the future you dont need to do this, but for now you still need to setup your inventory configuration.
	// like in original kolton, Config.Inventory[x] = [0,0,0,0,0,0....] you get the idea ;)
	// If you dont, every thing is locked


	// Here go your scripts as your used to.
	// You can paste them from Scripts.txt.
	Scripts.AutoMagicFind = true;

	// Here go the pickit files
	Config.PickitFiles.push("pots.nip");

	// In case you want to override some specific setting,

	// Examples: (including D2BotWhatever files)

	/** Here some D2BotWhatever setting examples*/
	//StarterConfig.MinGameTime = 60*3; // At least 3 minutes
	//Config.Follow = 'profileOfLeader'; // (like your used to in D2BotFollow with the JoinSettings)

	/** Some classic configuration examples */
	//Config.PacketCasting = 2; // Use packet casting for everything
	//Config.QuitList = ['myLeader']; // Exit the game if my leader does so too
```
 
 # Any questions, or want to be involved?
 Check out the our [discord](http://baa.al/discord), see ya there ;)
 
 ## Technical stuff.
 Allot of internal stuff of kolton is rewritten, as a faster pickit parser, a better party script, a better precasting script, 
 a better preattacking script, better class specifics as static use when needed, and allot of cleaning up / clearing.
 
 On top of that it is module based now, (nodeJS style require(...) and has full (but polyfilled) support for Promises.