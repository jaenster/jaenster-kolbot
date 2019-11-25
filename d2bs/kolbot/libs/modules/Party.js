(function (module, require) {
	const Config = require('Config');
	const Worker = require('Worker');
	const NO_PARTY = 65535;
	const PARTY_MEMBER = 1;
	const ACCEPTABLE = 2;
	const INVITED = 4;
	const BUTTON_INVITE_ACCEPT_CANCEL = 2;
	const BUTTON_LEAVE_PARTY = 3;

	print('ÿc2Jaensterÿc0 :: Party Script running');

	Config.Debug && (function (orig) {
		global.clickParty = function (party, button) {
			print('Click on ' + button + ' of party: ' + party.name);
			orig(party, button);
		};
	})(clickParty);

	const Party = {};

	Party.biggestPartyId = function () {
		let uniqueParties = [];
		//                                                  Or add it and return the value
		for (let party = getParty(); party.getNext();) {
			(
			// Find this party
				uniqueParties.find(u => u.partyid === party.partyid)
			// Or create an instance of it
			|| ((uniqueParties.push({
				partyid: party.partyid,
				used: 0
			}) && false) || uniqueParties[uniqueParties.length - 1])
			// Once we have the party object, increase field used
			).used++;
		}

		// Filter out no party, if another party is found
		uniqueParties.some(u => u.partyid !== NO_PARTY) && (uniqueParties = uniqueParties.filter(u => u.partyid !== NO_PARTY));

		return (uniqueParties.sort((a, b) => b.used - a.used /*b-a = desc*/).first() || {partyid: -1}).partyid;
	};

	Party.acceptFirst = function () {
		const toMd5Int = what => parseInt(md5(what).substr(0, 4), 16); //ToDo; do something with game number here
		const names = [];
		for (let party = getParty(); party.getNext();) {
			if (party.partyid === NO_PARTY) {
				names.push(party.name);
			}
		}
		return names.filter(n => n.name !== me.name/*cant accept yourself ;)*/).sort((a, b) => toMd5Int(a) - toMd5Int(b)).first();
	};

	getScript(true).name.toLowerCase() === 'default.dbj' && (Worker.runInBackground.party = (function () {// For now, we gonna do this in game with a single party
		let timer = getTickCount();
		return function () {
			// Set timer back on 3 seconds, or reset it and continue
			if ((getTickCount() - timer) < 3000 || (timer = getTickCount()) && false) {
				return true;
			}

			if (Config.Party) {
				const biggestPartyId = Party.biggestPartyId();
				let myPartyId = ((() => (getParty() || {partyid: 0}).partyid))();
				if (myPartyId) {
					for (let party = getParty(), acceptFirst; party && party.getNext();) {
						party && typeof party === 'object' && (function () {
							if (!(party.hasOwnProperty('life'))) {
								return;
							} // Somehow not a party member

							// Deal with inviting
							( // If no party is formed, or im member of the biggest party
								this.partyflag !== INVITED && // Already invited
						this.partyflag !== ACCEPTABLE && // Need to accept invite, so cant invite
						this.partyflag !== PARTY_MEMBER && // cant party again with soemone
						this.partyid === NO_PARTY // Can only invite someone that isnt in a party
						&& ( // If im not in a party, only if there is no party
							myPartyId === NO_PARTY && biggestPartyId === NO_PARTY
							// OR, if im part of the biggest party
							|| biggestPartyId === myPartyId
						)
							) && clickParty(party, BUTTON_INVITE_ACCEPT_CANCEL);// if player isn't invited, invite

							// Deal with accepting
							if (
								this.partyflag === ACCEPTABLE
						&& myPartyId === NO_PARTY // Can only accept if we are not in a party
						&& (
							this.partyid === biggestPartyId // Only accept if it is an invite to the biggest party
						)
							) {
								// Try to make all bots accept the same char first, to avoid confusion with multiple parties
								if (biggestPartyId === NO_PARTY) {
									// if acceptFirst isnt set, create it (to cache it, yet generate on demand)
									!acceptFirst && (acceptFirst = Party.acceptFirst());

									if (acceptFirst !== this.name) {
										return;
									} // Ignore this acceptation
								}

								clickParty(party, BUTTON_INVITE_ACCEPT_CANCEL);
							}

							// Deal with being in the wrong party. (we want to be in the biggest party)
							(
								this.partyflag === PARTY_MEMBER // We are in the same party
						&& biggestPartyId !== this.partyid // yet this party isnt the biggest party available
						&& biggestPartyId !== NO_PARTY // And the biggest party isnt no party
							) && clickParty(party, BUTTON_LEAVE_PARTY);
						}).apply(party);
					}
				}
			}
			return true;
		};
	})());

	module.exports = Party;

})(module, require);
