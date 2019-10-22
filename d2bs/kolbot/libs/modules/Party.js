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
			// Search for the party at hand
			const foundParty = uniqueParties.find(u => u.partyid === party.partyid);
			if (foundParty) { // Found this party
				foundParty.used++;
				continue;
			}
			uniqueParties.push({
				partyid: party.party,
				used: 1,
			});
		}

		// Filter out no party, if another party is found
		uniqueParties.some(u => u.partyid !== NO_PARTY) && (uniqueParties = uniqueParties.filter(u => u.partyid !== NO_PARTY));

		return (
			uniqueParties.sort((a, b) => b.used - a.used /*b-a = desc*/).first()
			// if no party is found, fake one. Shouldn't happen but with d2bs you never know
			|| {partyid: -1}
		).partyid;
	};

	const toMd5Int = what => parseInt(md5(what).substr(0, 4), 16); //ToDo; do something with game number here
	Party.acceptFirst = function () {
		const names = [];
		for (let party = getParty(); party.getNext();) {
			// Can only accept/invite non partied people
			if (party.partyid === NO_PARTY) {
				names.push(party.name);
			}
		}

		return names.filter(name => name !== me.name) // Filter out ourselves, cant form a party with myself.
			.sort((a, b) => toMd5Int(a) - toMd5Int(b)) // Sort by md5's int's id.
			.first();
	};

	// Only the default.dbj should run the party thread.
	if (getScript(true).name.toLowerCase() === 'default.dbj') {
		let timer = getTickCount();

		// Create an background worker
		Worker.runInBackground.party = function () {

			// Set timer back on 3 seconds, or reset it and continue
			if ((getTickCount() - timer) < 3000 || (timer = getTickCount()) && false) return true; // true = keep looping

			if (!Config.Party) return true; // Not running party at the moment

			const biggestPartyId = Party.biggestPartyId();

			// Either get the partyId of the party, and if we cant fetch the party object, use 0
			let myPartyId = (getParty() || {partyid: 0}).partyid;

			// No party id? Might be just begin of game. Come back later when it is.
			if (!myPartyId) return true; // true = keep looping

			for (let party = getParty(), acceptFirst; party && party.getNext();) {

				// If party is an valid object, create a function and set the this object to party
				if (party && typeof party === 'object' && party.hasOwnProperty('life')) (function () {

					// Deal with inviting
					if ( // If no party is formed, or im member of the biggest party
						this.partyflag !== INVITED && // Already invited
						this.partyflag !== ACCEPTABLE && // Need to accept invite, so cant invite
						this.partyflag !== PARTY_MEMBER && // cant party again with someone
						this.partyid === NO_PARTY // Can only invite someone that isn't in a party
						&& ( // If im not in a party, only if there is no party
							myPartyId === NO_PARTY && biggestPartyId === NO_PARTY
							// OR, if im part of the biggest party
							|| biggestPartyId === myPartyId
						)
					) {
						// Conditions are good to invite person.
						clickParty(party, BUTTON_INVITE_ACCEPT_CANCEL);
					}

					// Deal with accepting
					if (
						this.partyflag === ACCEPTABLE // The other invited me to be part of his party
						&& myPartyId === NO_PARTY // Can only accept if we are not in a party
						&& this.partyid === biggestPartyId // Only accept if it is an invite to the biggest party
					) { // Person is a possible match to accept the invite from


						// Try to make all bots accept the same char first, to avoid confusion with multiple parties
						if (biggestPartyId === NO_PARTY) {

							// if acceptFirst isnt set, create it (to cache it, yet generate on demand)
							if (!acceptFirst) acceptFirst = Party.acceptFirst();

							if (acceptFirst !== this.name) return; // Ignore this acceptation
						}

						// Conditions are good to accept this invite.
						clickParty(party, BUTTON_INVITE_ACCEPT_CANCEL);
					}

					// Deal with being in the wrong party. (we want to be in the biggest party)
					if (
						this.partyflag === PARTY_MEMBER // We are in the same party
						&& biggestPartyId !== this.partyid // yet this party isnt the biggest party available
						&& biggestPartyId !== NO_PARTY // And the biggest party isnt no party
					) { // We are not a member of the biggest party, and but we are in a party. So leave it
						clickParty(party, BUTTON_LEAVE_PARTY);
					}
				}).apply(party);
			}

			return true; // true = keep looping
		}
	}

	module.exports = Party;

})(module, require);