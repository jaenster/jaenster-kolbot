(function (module, require) {

	const Promise = require('Promise');

	function Subscription(unsubscribe) {
		this.unsubscribe = unsubscribe;
	};





	function Observable(subscribe) {
		this._subscribe = subscribe;

		this.subscribe = (next, error, complete) => {
			const observer = new Observer({next: next, error: error, complete: complete});
			observer._unsubscribe = this._subscribe(observer);
			return new Subscription(observer.unsubscribe);
		};
	};

	Observable.create = (subscribe) => {
		return new Observable(subscribe);
	};

	Observable.empty = Observable.create(observer => observer.complete());

	Observable.fromPromise = (promise) => {
		return Observable.create(observer => {
			promise
				.catch(observer.error)
				.then(observer.next)
				.finally(x => {
					observer.complete();
				});
			return null;
		});
	};

	Observable.fromArray = (values) => {
		return Observable.create(observer => {
			values.forEach(observer.next);
			observer.complete();
			return null;
		});
	};

	Observable.defer = (factory) => {
		return Observable.create(observer => {
			let input;
			try {
				input = factory();
			}
			catch (err) {
				observer.error(err);
				return undefined;
			}
			const source = input || Observable.empty;
			return source.subscribe(observer);
		});
	};

	Observable.prototype.map = (transformation) => {
		const stream = this;

		return new Observable((observer) => {
			const subscription = stream.subscribe(
				(value) => observer.next(transformation(value)),
				observer.error,
				observer.complete
			);

			return subscription.unsubscribe;
		});
	};

	Observable.prototype.do = function (next, error, complete) {
		const stream = this;

		return Observable.create(observer => {
			const subscription = stream.subscribe(
				v => {
					next(v);
					observer.next(v);
				},
				e => {
					error(e);
					observer.error(e);
				},
				() => {
					complete();
					observer.complete();
				}
			);
			return subscription.unsubscribe;
		});
	};

	Observable.prototype.concat = function (other) {
		const stream = this;

		return Observable.create(observer => {
			let currentSubscription;
			let done = false;

			function switchTo (observable) {
				currentSubscription = observable.subscribe(
					observer.next,
					observer.error,
					() => {
						if (typeof currentSubscription !== 'undefined') {
							currentSubscription.unsubscribe();
						}
						if (!done) {
							done = true;
							switchTo(other);
						}
						else {
							observer.complete();
						}
					}
				);
			}

			switchTo(stream);

			return currentSubscription.unsubscribe;
		});
	};

	Observable.prototype.doOnSubscribe = function (onSubscribe) {
		return Observable.empty.do(null, null, onSubscribe).concat(this);
	};






	function Observer(handlers) {
		this.handlers = handlers; // next, error and complete logic
	    this.closed = false;

		this.next = (value) => {
			if (this.handlers.next && !this.closed) {
				this.handlers.next(value);
			}
		};

		this.error = (error) => {
			if (!this.closed) {
				if (this.handlers.error) {
					this.handlers.error(error);
				}
				this.unsubscribe();
			}
		};

		this.complete = () => {
			if (!this.closed) {
				if (this.handlers.complete) {
					this.handlers.complete();
				}
				this.unsubscribe();
			}
		};

		this.unsubscribe = () => {
			this.closed = true;
			if (this._unsubscribe) {
				this._unsubscribe();
			}
		};
	};







	function Subject(subscribe) {
		Observable.call(this, subscribe);

		this.__onSubscribe = undefined;

		this.observers = [];

		this.subscribe = (next, error, complete) => {
			const observer = new Observer({next: next, error: error, complete: complete});
			this.observers.push(observer);
			observer._unsubscribe = this._subscribe(observer);
			if (typeof this.__onSubscribe === 'function') {
				this.__onSubscribe();
			}
			return new Subscription(observer.unsubscribe);
		};

		this.next = (value) => {
			this.observers.forEach(o => o.next(value));
		};

		this.error = (error) => {
			if (!this.closed) {
				this.observers.forEach(o => o.error(error));
				this.unsubscribe();
			}
		};

		this.complete = () => {
			if (!this.closed) {
				this.observers.forEach(o => o.complete());
				this.unsubscribe();
			}
		};

		this.unsubscribe = () => {
			this.closed = true;
			this.observers.forEach(o => o.unsubscribe());
		};
	};

	Subject.create = (subscribe) => {
		return new Subject(subscribe);
	};

	Subject.prototype.doOnSubscribe = (onSubscribe) => {
		this.__onSubscribe = onSubscribe;
		return this;
	};

	var Rx = {
		Observable: Observable,
		Observer: Observer,
		Subject: Subject,
		Subscription: Subscription
	};

	module.exports = Rx;

})(module, require);