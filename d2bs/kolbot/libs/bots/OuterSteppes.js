function OuterSteppes(Config, Attack, Pickit, Pather, Town) {
	Town();

	if (!Pather.journeyTo(104)) {
		throw new Error("Failed to move to Outer Steppes");
	}

	Attack.clearLevel(Config.ClearType);

	return true;
}