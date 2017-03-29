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
RatpackPromise.prototype.then = function(action) {
    const resolve = (resolvedValue) => {
        this.error = false;
        this.success = true;
        this.complete = true;
        this.value = resolvedValue;
        action(resolvedValue);
    };
    const reject = (rejectError) => {
        // TODO - enforce type
        this.error = true;
        this.success = false;
        this.complete = false;
    };
    this.generator(resolve.bind(this), reject.bind(this));
    return;
};
RatpackPromise.prototype.onError = function(type, action) {

};
RatpackPromise.prototype.mapError = function(action) {
    let isStageResolved = false;
    let isStageRejected = false;

    const resolveHandler = resolve => resolvedValue => {
        if (isStageResolved) {
            console.log('Ignoring resolve call. Already resolved.');
            return;
        }
        if (isStageRejected) {
            console.log('Ignoring resolve call. Already rejected.');
            return;
        }
        isStageResolved = true;
        resolve(resolvedValue);
    }

    const rejectHandler = (resolve, reject) => ((rejectError) => {
        if (isStageResolved) {
            console.log("Ignoring reject call. Already resolved.");
            return;
        }
        if (isStageRejected) {
            console.log("Ignoring reject call. Already rejected.");
            return;
        }
        isStageRejected = true;
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
            currentGenerator(resolveHandler(resolve), rejectHandler(resolve, reject));
        } catch (e) {
            rejectHandler(resolve, reject)(e);
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
    throw new Error('setTimeout is undefined');
}).mapError(err => {
    console.log('Mapping error', err);
    return 'hello';
}).mapError(err => {
    console.log('Mapping error', err);
    return 'recovered 2nd mapError';
}).then(msg => {
    console.log(msg);
});