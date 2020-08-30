/**
 * @description A unified configure script
 * @author Jaenster
 */
(function (module, require) {
	/** @class Config */
	function Config() {
		if (Config.loaded) return Config;
		if (!FileTools.exists("config/" + Config.file + ".js")) {
			for (let i = 0; i < 8; i++) print(' ');
			print('[ÿc1Errorÿc0] Config file doesnt exists.');
			print('-----------------------------------------');
			print('Please create a config file called d2bs\\kolton\\config\\' + Config.file + '.js');
			print('You can copy Example.js');
			print('Set it up and restart the bot');
			print('-----------------------------------------');
			D2Bot.printToConsole('Please setup a config file. d2bs\\kolton\\config\\' + Config.file + '.js', 9);
			D2Bot.printToConsole('You can set this up from Example.js', 4);
			delay(10000);
			D2Bot.stop();
		}

		const scripts = require('../../config/' + Config.file);
		const currentScript = getScript(true).name.toLowerCase();
		Object.keys(scripts || {})
			.forEach(x => {
				getScript(true).name === 'default.dbj' && print(' -- Enabled script: ' + x);
				Config.Scripts[x] = scripts[x];
			});

		if (me.ingame) {
			Config.Silence && (global.say = print); // Remove the say function, to instantly make the bot silenced

			// Load pickit if files are configured
			if (Array.isArray(Config.PickitFiles) && Config.PickitFiles.length) {
				let Pickit = require('../modules/Pickit');
				Pickit.LoadFiles(Config.PickitFiles);
			}

			if (currentScript === 'default.dbj') {
				Config.Party && require('../modules/Party');

				// Load the InGameStatus stuff
				require('../modules/InGameStatus');

				if (Array.isArray(Config.QuitList) && Config.QuitList.length || (typeof Config.QuitList === 'string' && Config.QuitList.length)) {
					require('../modules/QuitList');
				}
			}
		} else {
			// If a follower is given, put it in D2BotFollower.js
			Config.Follow && typeof JoinSettings === 'object' && JoinSettings && (JoinSettings[Config.Follow] = [me.windowtitle]);

			typeof Config.AdvancedConfig === 'object'  // advanced config exists
			&& Config.AdvancedConfig // not null
			&& typeof AdvancedConfig === 'object'  // advanced config exists
			&& AdvancedConfig
			&& (AdvancedConfig[me.windowtitle] = Config.AdvancedConfig);

			Object.keys(Config.StarterConfig).forEach(key => StarterConfig[key] = Config.StarterConfig[key])
		}

		// Load the advertisement module if we want to advertise
		if (Config.Advertisement && currentScript.endsWith('.dbj') && currentScript !== 'default.dbj') {
			require('../modules/Advertisement');
		}

		Config.loaded = true;
		return Config;
	}

	Config.loaded = false;

	Config.file = (function () {
		try {
			!isIncluded("../config/_customconfig.js") && include("../config/_customconfig.js");
		} catch (e) {
			// Dont care if we cant load custom config
			print('Warning; cant load custom config');
		}

		// check if a custom config is set
		if (typeof CustomConfig === 'object' && CustomConfig)
			for (let n in CustomConfig)
				if (CustomConfig.hasOwnProperty(n) && CustomConfig[n].indexOf(me.profile) > -1)
					return n;
		if (getScript('D2BotManual.dbj') && !FileTools.exists("config/" + me.windowtitle + ".js")) {
			return 'manual';
		}
		return me.windowtitle;
	})();


	// Time
	Config.StartDelay = 0;
	Config.PickDelay = 0;
	Config.AreaDelay = 0;
	Config.MinGameTime = 0;
	Config.MaxGameTime = 0;

	// Healing and chicken
	Config.LifeChicken = 0;
	Config.ManaChicken = 0;
	Config.UseHP = 0;
	Config.UseMP = 0;
	Config.UseRejuvHP = 0;
	Config.UseRejuvMP = 0;
	Config.UseMercHP = 0;
	Config.UseMercRejuv = 0;
	Config.MercChicken = 0;
	Config.IronGolemChicken = 0;
	Config.HealHP = 0;
	Config.HealMP = 0;
	Config.HealStatus = false;
	Config.TownHP = 0;
	Config.TownMP = 0;

	// General
	Config.AutoMap = false;
	Config.LastMessage = "";
	Config.UseMerc = false;
	Config.MercWatch = false;
	Config.LowGold = 0;
	Config.StashGold = 0;
	Config.FieldID = false;
	Config.DroppedItemsAnnounce = {
		Enable: false,
		Quality: [],
		LogToOOG: false,
		OOGQuality: []
	};
	Config.CainID = {
		Enable: false,
		MinGold: 0,
		MinUnids: 0
	};
	Config.Inventory = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	];
	Config.LocalChat = {
		Enabled: false,
		Toggle: false,
		Mode: 0
	};
	Config.QuitList = [];
	Config.QuitListMode = 0;

	Config.HPBuffer = 0;
	Config.MPBuffer = 0;
	Config.RejuvBuffer = 0;
	Config.PickRange = 40;
	Config.MakeRoom = true;
	Config.OpenChests = false;
	Config.PickitFiles = [];
	Config.BeltColumn = [];
	Config.MinColumn = [];
	Config.SkipEnchant = [];
	Config.SkipImmune = [];
	Config.SkipAura = [];
	Config.SkipException = [];
	Config.ScanShrines = [];
	Config.Debug = false;

	Config.ItemInfo = false;
	Config.ItemInfoQuality = [];

	Config.LogKeys = false;
	Config.LogOrgans = true;
	Config.LogLowRunes = false;
	Config.LogMiddleRunes = false;
	Config.LogHighRunes = true;
	Config.LogLowGems = false;
	Config.LogHighGems = false;
	Config.SkipLogging = [];
	Config.ShowCubingInfo = true;

	Config.CubeRepair = false;
	Config.RepairPercent = 40;
	Config.Recipes = [];
	Config.KeepRunewords = [];
	Config.Gamble = false;
	Config.GambleItems = [];
	Config.GambleGoldStart = 0;
	Config.GambleGoldStop = 0;
	Config.MiniShopBot = false;
	Config.PrimarySlot = undefined;
	Config.LogExperience = false;
	Config.TownCheck = false;
	Config.PingQuit = [{Ping: 0, Duration: 0}];
	Config.PacketShopping = true;

	// Fastmod
	Config.FCR = 0;
	Config.FHR = 0;
	Config.FBR = 0;
	Config.IAS = 0;
	Config.PacketCasting = 0;
	Config.WaypointMenu = true;

	// Anti-hostile
	Config.AntiHostile = false;
	Config.RandomPrecast = false;
	Config.HostileAction = 0;
	Config.TownOnHostile = false;
	Config.ViperCheck = false;

	// DClone
	Config.StopOnDClone = false;
	Config.SoJWaitTime = 0;
	Config.KillDclone = false;
	Config.DCloneQuit = false;

	// Experimental
	Config.AutoEquip = false;

	// GameData
	Config.ChampionBias = 60;

	// Attack specific
	Config.Dodge = false;
	Config.DodgeRange = 15;
	Config.DodgeHP = 100;
	Config.AttackSkill = [];
	Config.LowManaSkill = [];
	Config.CustomAttack = {};
	Config.TeleStomp = false;
	Config.ClearType = false;
	Config.ClearPath = false;


	// Assassin specific
	Config.UseTraps = false;
	Config.Traps = [];
	Config.BossTraps = [];
	Config.UseFade = false;
	Config.UseBoS = false;
	Config.UseVenom = false;
	Config.UseCloakofShadows = false;
	Config.AggressiveCloak = false;
	Config.SummonShadow = false;

	// Script specific
	Config.Mausoleum = {
		KillBloodRaven: false,
		ClearCrypt: false
	};
	Config.Eldritch = {
		OpenChest: false,
		KillSharptooth: false,
		KillShenk: false,
		KillDacFarren: false
	};
	Config.Pindleskin = {
		UseWaypoint: false,
		KillNihlathak: false,
		ViperQuit: false
	};
	Config.Nihlathak = {
		ViperQuit: false
	};
	Config.Pit = {
		ClearPath: false,
		ClearPit1: false
	};
	Config.Snapchip = {
		ClearIcyCellar: false
	};
	Config.Frozenstein = {
		ClearFrozenRiver: false
	};
	Config.Rakanishu = {
		KillGriswold: false
	};
	Config.Countess = {
		KillGhosts: false
	};
	Config.Coldworm = {
		KillBeetleburst: false,
		ClearMaggotLair: false,
	};
	Config.Baal = {
		DollQuit: false,
		SoulQuit: false,
		KillBaal: true,
		HotTPMessage: "Hot TP!",
		SafeTPMessage: "Safe TP!",
		BaalMessage: "Baal!"
	};
	Config.Corpsefire = {
		ClearDen: false
	};
	Config.BattleOrders = {
		Mode: 0,
		Getters: [],
		Wait: false
	};
	Config.Enchant = {
		Triggers: ["chant", "cows", "wps"],
		GetLeg: false,
		AutoChant: false,
		GameLength: 20
	};
	Config.IPHunter = {
		IPList: [],
		GameLength: 3
	};
	Config.Mephisto = {
		MoatTrick: false,
		KillCouncil: false,
		TakeRedPortal: true
	};
	Config.ShopBot = {
		ScanIDs: [],
		ShopNPC: "anya",
		CycleDelay: 0,
		QuitOnMatch: false
	};
	Config.AncientTunnels = {
		OpenChest: false,
		KillDarkElder: false
	};
	Config.OrgTorch = {
		WaitForKeys: false,
		WaitTimeout: false,
		UseSalvation: false,
		GetFade: false,
		MakeTorch: true
	};
	Config.Tristram = {
		PortalLeech: false,
		WalkClear: false
	};
	Config.Travincal = {
		PortalLeech: false
	};
	Config.Bonesaw = {
		ClearDrifterCavern: false
	};
	Config.ChestMania = {
		Act1: [],
		Act2: [],
		Act3: [],
		Act4: [],
		Act5: []
	};
	Config.ClearAnyArea = {
		AreaList: []
	};
	Config.Diablo = {
		Fast: false,
		Follower: false,
		Entrance: true,
		killDiablo: true,
	};

	Config.SpeedBaal = {
		Follower: false,
	};
	Config.Rush = {
		Give: false,
	};

	Config.QuitWhenDead = !me.playertype; // If on hardcore, dont quit when your dead

	// some new configurations
	Config.Follow = undefined; // Still i like to define it
	Config.Silence = true;
	Config.Development = '';
	Config.Scripts = {};
	Config.Party = false;
	Config.QuitDelay = 0;

	// Make the StarterConfig and AdvancedConfig visible in the config file
	Config.StarterConfig = {};
	Config.AdvancedConfig = {};

	// if true, it shares the games globally
	Config.Advertisement = false;

	module.exports = Config;
	const global = [].filter.constructor('return this')();
	if (typeof global['Config'] !== 'object') global['Config'] = Config;

})(module, require);