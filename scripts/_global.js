// Global script for shared functionality across all scripts
// Run check: node --check scripts/_global.js

console.log("_global.js loaded");

class jsonData {
	constructor(filename) {
		this.filename = filename;
		// load json data from file
        this.data = fetch(filename)
            .then((response) => response.json())
            .then((json) => {
                this.data = json;
            });
	}

	getData() {
        return this.data;
	}

	saveData(tofile = false) {
        localStorage.setItem(this.filename, JSON.stringify(this.data));
        if (tofile) {
            // SaveToFile
        }
	}
}

