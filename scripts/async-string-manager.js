const STORED_LINK_PREFIX = 'marEMDker-';

export class AsyncStringManager {
    #links = {};

    reset() {
        this.#links = {};
    }

    addLink(promise) {
        const marker = `${STORED_LINK_PREFIX}${foundry.utils.randomID(10)}`;
        this.#links[marker] = promise;
        return marker;
    }

    /**
     * Should be called after generating all the output text, before adding it to the output file.
     * @param {*} value 
     * @returns 
     */
    async applyPatches(value) {
        while (!foundry.utils.isEmpty(this.#links) && value.includes(STORED_LINK_PREFIX)) {
            // Replace each marked with the real link.
            // Some links might not be present yet, since they might be in the string that is returned 
            // from one of the other promises (e.g from use of our own 'EMDconvertHtml' helper)
            for (const [marker, promise] of Object.entries(this.#links)) {
                // Each link is unique with a random ID, so replace not replaceAll
                const replacestr = await promise;
                value = value.replace(marker, replacestr);
                delete this.#links[marker];
            }
        }
        return value;
    }
}