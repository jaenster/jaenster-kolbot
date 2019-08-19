/**
 * @description Some sorc specific's
 * @Author Jaenster
 */
(function (module, require) {

	// Override the interact function, to use telekinesis when possible
	(function (interact) {
		Unit.prototype.interact = function () {
			// ToDo; Write
		}
	})(Unit.prototype.interact)

})(module, require);