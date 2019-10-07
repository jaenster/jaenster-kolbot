/**
 * @author Jaenster
 * @description A module that configures your bot you
 */
(function (module, require) {
	// Should be an module
	const Config = require('Config');
	const Auto = {}, Skills = require('Skills');
	Object.defineProperties(Auto, {
		Config: {
			get: function () {
				return !Config.AutoConfig && typeof Config.AutoConfig !== 'object' && (Config.AutoConfig = {}) && false || Config.AutoConfig;
			},
			enumerable: false,
		},
		isWeak: {
			get: () => (Auto.myResistance < 0),
		},
		myResistance: {
			get: () => [me.getStat(45), me.getStat(43), me.getStat(41), me.getStat(39)],
		},
		dodgeRules: {
			get: () => function () {
				Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
				Config.DodgeRange = 7; // Distance to keep from monsters.
				Config.DodgeHP = 100; // Dodge only if HP percent is less than or equal to Config.DodgeHP. 100 = always dodge.
			},
		},
	});

	const emptyInventorySlots = function (free = 0) {
		for (let i = 0; i < 4; i += 1) for (let j = 0; j < Config.Inventory[i].length; j += 1) Config.Inventory[i][j] && free++;
	};

	const AutoConfig = function () {
		return me.ingame && Object.keys(AutoConfig)  // Run all AutoConfig modules
			.map(x => AutoConfig[x])
			.filter(x => typeof x === 'function')
			.forEach(_ => _());
	};

	AutoConfig.Chicken = function () {
		Config.HealHP = 50;
		Config.HealMP = 50;
		Config.HealStatus = false;
		Config.UseMerc = true;
		Config.AvoidDolls = ([0, 1, 2, 6].indexOf(me.classid)); // Avoid dolls in case your a Ama / Sorc / Necro or Assa

		// Chicken settings
		Config.LifeChicken = 35; // Exit game if life is less or equal to designated percent.
		Config.ManaChicken = 0; // Exit game if mana is less or equal to designated percent.
		Config.MercChicken = 0; // Exit game if merc's life is less or equal to designated percent.
		Config.TownHP = 0; // Go to town if life is under designated percent.
		Config.TownMP = 0; // Go to town if mana is under designated percent.
	};

	AutoConfig.PotTaking = function () {
		// Potion settings
		Config.UseHP = 75;
		Config.UseRejuvHP = 45;
		Config.UseMP = 30;
		Config.UseRejuvMP = Math.max.apply(Math, Skills.getSkillLevel(sdk.skills.EnergyShield)) > 1 ? 25 : 0; // Only use a Rejuv pot for mana in case we have an es
		Config.UseMercHP = 75;
		Config.UseMercRejuv = 20;
		Config.HPBuffer = 0;
		Config.MPBuffer = 0;
		Config.RejuvBuffer = Math.min(me.isWeak ? 6 : 3, Math.max(0, Math.floor(emptyInventorySlots() - 12 / 2))); // If space allows it, keep 3 Rejuv's in inventory or 6 in the case we are weak
	};

	AutoConfig.Identifying = function () {
		// Item identification settings
		Config.CainID.Enable = me.act === 4; // Only if we start in act4. Its quicker, otherwise it ain't.
		Config.CainID.MinGold = 2500000;
		Config.CainID.MinUnids = 3;
		Config.FieldID = true; //ToDo; if we have a tomb
		Config.DroppedItemsAnnounce.Enable = false;
		Config.DroppedItemsAnnounce.Quality = [];
	};

	AutoConfig.CubeRepair = function () {
		//ToDo; Fix we only do this if we have an very expensive armor to repair and we dont have gold to do so
		Config.CubeRepair = false;
		Config.RepairPercent = 40;
	};

	AutoConfig.Merc = function () {
		Config.UseMerc = !!me.mercrevivecost; // If a merc costs anything, im pretty sure you want one
		Config.MercWatch = ([0, 1, 6].indexOf(me.classid));

		if (Config.UseMerc) {
			// Create a promise, once we can read a merc resolve with the merc object
			// Once we have the merc, determin if it has Infinity, ifso, we definitely want to resurrect the merc during battle
			print('need to watch merc?');
			getScript(true).name.toLowerCase() === 'default.dbj' && new (require('Promise'))(function (resolve, reject) {
				const merc = me.getMerc();
				merc && typeof merc === 'object' && merc.hasOwnProperty('getItems') && resolve();
			})
				.then(function () {
					return me.getMerc() && me.getMerc().getItems().filter(item => item.getPrefix(sdk.locale.items.Infinity).length && (Config.MercWatch = true) && print('MercWatch=true'));
				});
		}

	};

	AutoConfig.Clearing = function () {
		Config.BossPriority = true;
		Config.ClearType = 0xF;
	};

	AutoConfig.Packet = function () {
		Config.PacketCasting = 1; // use packet casting for teleportation
		Config.PacketShopping = true;
	};

	//ToDo; Do something with this. For now 4 rows of rv pots to avoid belt clearance
	AutoConfig.Belt = function () {
		let [b, m] = [Config.BeltColumn, Config.MinColumn];
		for (let i = 0; i < 4; i++) (b[i] = i === 0 && 'hp' || i === 1 && 'mp' || 'rv') && (m[i] = b[i] !== 'rv' && 3 || 0);
		[Config.BeltColumn, Config.MinColumn] = [b, m];
	};


	AutoConfig.ClassSpecifics = function () {
		if (!me.ingame) return; // only if we are in game;
		//ToDo; take in acocunt the oskills of the game. A sorc can use zeal and you might want pala specifics on a sorc.
		switch (true) {
			// Almost all sorcs are the same, just setup a sorc
			case me.classid === 1: //sorc
				require('Sorceress'); // Use more telekenis and such
				break;

			case me.classid === 5: // Druid
				break;
			case me.classid === 2: // Pala
				require('Paladin');
				break;
			case me.classid === 6:
				require('Assassin');
				break;

		}
	};

	// Determin if we should use an party or not
	AutoConfig.Party = function () {
		Config.Party = (
			me.gamename  // It needs a game name, as it doesnt matter in single player
			|| me.gameserverip // but we do care if its a tcp/ip game
		)
	};

	module.exports = AutoConfig;
})(module, require);