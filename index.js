function RatpackPromise(generator) {
    if (typeof generator !== 'function') {
        throw new Error('Cannot create promise without value generator function');
    }
    this.error = null;
    this.success = null;
    this.complete = false;
    this.value;

    this.generator = generator;
}

/**
 * This is a terminating call on the promise chain.
 */
RatpackPromise.prototype.then = function(action) {
    // When executing .then() and we have a successful promise, pass
    // the value of the promise to the action that does something
    // with that promise value
    const resolveHandler = (resolvedValue) => {
        this.error = false;
        this.success = true;
        this.complete = true;
        this.value = resolvedValue;
        action(resolvedValue);
    };

    // When executing .then() and we have an error, don't actually
    // do anything.
    const rejectHandler = (rejectError) => {
        // TODO - enforce type of rejectError?
        this.error = true;
        this.success = false;
        this.complete = true;
    };
    this.generator(resolveHandler.bind(this), rejectHandler.bind(this));
    return;
};

/**
 * This is a terminating call on the promise chain.
 */
RatpackPromise.prototype.onError = function(action) {
    let stageResolved = false;
    let stageRejected = false;
    const isStageResolved = () => this.success || stageResolved;
    const isStageRejected = () => this.error || stageRejected;

    const resolveHandler = resolveValue => {
        if (isStageResolved()) {
            console.log('[DEBUG] [onError] Ignoring resolve call. Already resolved.');
            return;
        }
        if (isStageRejected()) {
            console.log('[DEBUG] [onError] Ignoring resolve call. Already rejected.');
            return;
        }
        this.error = false;
        this.success = true;
        this.complete = true;
    };

    const rejectHandler = rejectError => {
        if (isStageResolved()) {
            console.log('[DEBUG] [onError] Ignoring reject call. Already resolved.');
            return;
        }
        if (isStageRejected()) {
            console.log('[DEBUG] [onError] Ignoring reject call. Already rejected.');
            return;
        }
        this.error = true;
        this.success = false;
        this.complete = true;
        action(rejectError);
    };

    try {
        this.generator(resolveHandler.bind(this), rejectHandler.bind(this));
    } catch (e) {
        rejectHandler(e);
    }
    return this;
};

RatpackPromise.prototype.mapError = function(action) {
    let stageResolved = false;
    let stageRejected = false;
    const isStageResolved = () => this.success || stageResolved;
    const isStageRejected = () => this.error || stageRejected;

    // When executing .mapError(), we want to make sure we haven't executed through this point in
    // the promise chain already. This function generates a resolveHandler that takes resolvedValue
    // and checks whether this stage in the promise chain has already been resolved or rejected.
    // If this stage is unresolve and unrejected, the resolvedValue is just passed on to the resolve
    // function this builder got passed in.
    const makeResolveHandler = resolve => resolvedValue => {
        if (isStageResolved()) {
            console.log('[DEBUG] [mapError] Ignoring resolve call. Already resolved.');
            return;
        }
        if (isStageRejected()) {
            console.log('[DEBUG] [mapError] Ignoring resolve call. Already rejected.');
            return;
        }
        stageResolved = true;
        resolve(resolvedValue);
    }

    // When executing .mapError(), we want to make sure we haven't executed through this point in
    // the promise chain already. This function generates a rejectHandler that takes the rejection error
    // value and as long as this stage is unresolved and unrejected it passes that rejection error value
    // to the action specified for this mapError call. If that calls succeeds, the newly mapped value
    // gets passed to the resolve function.
    // If that call fails, then the reject call is executed.
    const makeRejectHandler = (resolve, reject) => ((rejectError) => {
        if (isStageResolved()) {
            console.log("[DEBUG] [mapError] Ignoring reject call. Already resolved.");
            return;
        }
        if (isStageRejected()) {
            console.log("[DEBUG] [mapError] Ignoring reject call. Already rejected.");
            return;
        }
        stageRejected = true;
        try {
            const newValue = action(rejectError);
            this.error = false;
            this.success = true;
            this.complete = false;
            this.value = newValue;
            resolve(newValue);
        } catch (e) {
            this.error = true;
            this.success = false;
            this.complete = false;
            this.value = undefined;
            reject(e);
        }
    }).bind(this);

    const currentGenerator = this.generator;
    const newGenerator = (resolve, reject) => {
        try {
            currentGenerator(makeResolveHandler(resolve), makeRejectHandler(resolve, reject));
        } catch (e) {
            makeRejectHandler(resolve, reject)(e);
        }
    };
    this.generator = newGenerator;
    return this;
};
RatpackPromise.prototype.map = function(action) {

};
RatpackPromise.prototype.left = function(action) {

};
RatpackPromise.prototype.right = function(action) {

};



new RatpackPromise((resolve, reject) => {
    //resolve('hello world');
    //reject(new Error('uh oh'));
    setTimeout(() => {
        reject("jello");
    }, 1000);
    //throw new Error('setTimeout is undefined');
}).mapError(err => {
    console.log('Mapping error', err);
    return 'hello';
}).onError(e => {
    console.log('onError',e);
}).mapError(err => {
    console.log('Mapping error', err);
    return 'recovered 2nd mapError';
}).then(msg => {
    console.log(msg);
});